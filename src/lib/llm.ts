// The ONLY file that knows which AI provider we use.
// To swap Gemini for another provider, change this file and nothing else.
import { google, type GoogleEmbeddingModelOptions } from "@ai-sdk/google";
import { embed, embedMany, wrapLanguageModel, type LanguageModel } from "ai";
import { requireEnv } from "./env";

/** True for "busy / over quota / temporary" errors where another model may work. */
function isBusyError(error: unknown) {
  const e = error as { statusCode?: number; isRetryable?: boolean };
  return e?.isRetryable === true || [429, 500, 502, 503, 504].includes(e?.statusCode ?? 0);
}

// Models that recently said "busy" are skipped for a short while, so we don't
// waste seconds on every step waiting for the same error again.
const BUSY_COOLDOWN_MS = 60_000;
const busyUntil = new Map<string, number>();

/**
 * The chat model used by the agent (LLM_MODEL in .env).
 * If LLM_FALLBACK_MODELS is set (comma-separated), a busy or rate-limited model
 * is automatically replaced by the next one in the list.
 * `onFallback` lets the caller show this "retry" to the user.
 */
export function chatModel(onFallback?: (info: { from: string; to: string }) => void): LanguageModel {
  requireEnv("GOOGLE_GENERATIVE_AI_API_KEY");
  const primaryName = requireEnv("LLM_MODEL");
  const fallbackNames = (process.env.LLM_FALLBACK_MODELS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const primary = google(primaryName);
  if (fallbackNames.length === 0) return primary;
  const allNames = [primaryName, ...fallbackNames];

  return wrapLanguageModel({
    model: primary,
    middleware: {
      specificationVersion: "v4",
      wrapStream: async ({ params }) => {
        // Try models in order, skipping ones that were busy a moment ago
        // (unless every model is cooling down, then try them all anyway).
        const now = Date.now();
        const ready = allNames.filter((n) => (busyUntil.get(n) ?? 0) <= now);
        const order = ready.length > 0 ? ready : allNames;
        if (order[0] !== primaryName) onFallback?.({ from: primaryName, to: order[0] });

        let lastError: unknown;
        for (let i = 0; i < order.length; i++) {
          const name = order[i];
          try {
            return await google(name).doStream(params);
          } catch (error) {
            if (!isBusyError(error)) throw error;
            busyUntil.set(name, Date.now() + BUSY_COOLDOWN_MS);
            lastError = error;
            if (order[i + 1]) onFallback?.({ from: name, to: order[i + 1] });
          }
        }
        throw lastError;
      },
    },
  });
}

/**
 * Provider-specific options for the chat model. We ask Gemini to share a short
 * summary of its reasoning ("thoughts") so the UI can show the agent thinking.
 */
export function chatProviderOptions() {
  return {
    google: { thinkingConfig: { includeThoughts: true, thinkingLevel: "low" as const } },
  };
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
