// The ONLY file that knows which AI provider we use.
// To swap Gemini for another provider, change this file and nothing else.
import { google, type GoogleEmbeddingModelOptions } from "@ai-sdk/google";
import { embed, embedMany } from "ai";
import { requireEnv } from "./env";

/** The chat model used by the agent (name comes from LLM_MODEL in .env). */
export function chatModel() {
  requireEnv("GOOGLE_GENERATIVE_AI_API_KEY");
  return google(requireEnv("LLM_MODEL"));
}

function embeddingSettings() {
  const modelName = requireEnv("EMBEDDING_MODEL");
  const dimensions = Number(requireEnv("EMBEDDING_DIMENSIONS"));
  return { modelName, dimensions, model: google.embedding(modelName) };
}

// gemini-embedding-2 takes the "task" as part of the text;
// older models (gemini-embedding-001) take a taskType option instead.
function usesTextTaskPrefix(modelName: string) {
  return !modelName.includes("embedding-001");
}

/** Embed policy document chunks (for storing in the database). */
export async function embedDocuments(chunks: { title: string; text: string }[]): Promise<number[][]> {
  const { modelName, dimensions, model } = embeddingSettings();
  const prefixed = usesTextTaskPrefix(modelName);
  const { embeddings } = await embedMany({
    model,
    values: chunks.map((c) => (prefixed ? `title: ${c.title} | text: ${c.text}` : c.text)),
    maxParallelCalls: 2,
    providerOptions: {
      google: {
        outputDimensionality: dimensions,
        ...(prefixed ? {} : { taskType: "RETRIEVAL_DOCUMENT" }),
      } satisfies GoogleEmbeddingModelOptions,
    },
  });
  return embeddings.map(normalize);
}

/** Embed a customer's question (for searching the database). */
export async function embedQuery(query: string): Promise<number[]> {
  const { modelName, dimensions, model } = embeddingSettings();
  const prefixed = usesTextTaskPrefix(modelName);
  const { embedding } = await embed({
    model,
    value: prefixed ? `task: search result | query: ${query}` : query,
    providerOptions: {
      google: {
        outputDimensionality: dimensions,
        ...(prefixed ? {} : { taskType: "RETRIEVAL_QUERY" }),
      } satisfies GoogleEmbeddingModelOptions,
    },
  });
  return normalize(embedding);
}

// Scale a vector to length 1 so cosine similarity works the same for every model.
function normalize(v: number[]): number[] {
  const length = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0)) || 1;
  return v.map((x) => x / length);
}
