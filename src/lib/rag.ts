// RAG = Retrieval Augmented Generation.
// Policy docs are split into small chunks, each chunk gets an embedding
// (a list of numbers that captures its meaning), and we store them in pgvector.
// At question time we embed the question and fetch the closest chunks.
import { db } from "./supabase";
import { embedDocuments, embedQuery } from "./llm";

export type Chunk = { heading: string; content: string };

/**
 * Split markdown into chunks by "##" sections. Long sections are split again
 * by paragraph so each chunk stays small (about 1,000 characters max).
 */
export function chunkMarkdown(markdown: string, maxChars = 1000): Chunk[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const docTitle = (lines.find((l) => l.startsWith("# ")) ?? "").replace(/^#\s+/, "");
  const sections: Chunk[] = [];
  let heading = docTitle || "Overview";
  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text) sections.push({ heading, content: text });
    buffer = [];
  };

  for (const line of lines) {
    if (line.startsWith("# ")) continue; // the document title itself
    if (line.startsWith("## ")) {
      flush();
      heading = line.replace(/^##\s+/, "");
      continue;
    }
    buffer.push(line);
  }
  flush();

  // Split any section that is still too long.
  const chunks: Chunk[] = [];
  for (const s of sections) {
    if (s.content.length <= maxChars) {
      chunks.push(s);
      continue;
    }
    let current = "";
    for (const para of s.content.split(/\n\s*\n/)) {
      if ((current + "\n\n" + para).length > maxChars && current) {
        chunks.push({ heading: s.heading, content: current.trim() });
        current = "";
      }
      current += "\n\n" + para;
    }
    if (current.trim()) chunks.push({ heading: s.heading, content: current.trim() });
  }
  return chunks;
}

/** Chunk, embed and store one document. Re-uploading the same source replaces it. */
export async function ingestDocument(source: string, markdown: string) {
  const title =
    (markdown.split("\n").find((l) => l.startsWith("# ")) ?? "").replace(/^#\s+/, "").trim() || source;
  const chunks = chunkMarkdown(markdown);
  if (chunks.length === 0) throw new Error("The document has no text to index.");

  // Each chunk is embedded together with its heading for better matching.
  const embeddings = await embedDocuments(
    chunks.map((c) => ({ title, text: `${c.heading}\n${c.content}` })),
  );

  // Replace any older version of this document.
  await db().from("documents").delete().eq("source", source);
  const { data: doc, error } = await db().from("documents").insert({ title, source }).select("id").single();
  if (error || !doc) throw new Error(`Could not save document: ${error?.message}`);

  const rows = chunks.map((c, i) => ({
    document_id: doc.id,
    chunk_index: i,
    heading: c.heading,
    content: c.content,
    embedding: JSON.stringify(embeddings[i]),
  }));
  const { error: chunkError } = await db().from("doc_chunks").insert(rows);
  if (chunkError) throw new Error(`Could not save chunks: ${chunkError.message}`);

  return { title, source, chunks: chunks.length };
}

export type PolicyHit = { source: string; title: string; heading: string; content: string; similarity: number };

/** Find the policy chunks most related to a question. */
export async function searchPolicyChunks(query: string, limit = 4): Promise<PolicyHit[]> {
  const embedding = await embedQuery(query);
  const { data, error } = await db().rpc("match_doc_chunks", {
    query_embedding: JSON.stringify(embedding),
    match_count: limit,
    min_similarity: Number(process.env.RAG_MIN_SIMILARITY ?? 0.5),
  });
  if (error) throw new Error(`Policy search failed: ${error.message}`);
  return (data ?? []).map((r: PolicyHit) => ({
    source: r.source,
    title: r.title,
    heading: r.heading,
    content: r.content,
    similarity: Math.round(r.similarity * 100) / 100,
  }));
}
