// Brand context loader
// Fetches the full brand schema for a given brand ID.
// Called at the start of every Babuu conversation.
// Returns null if brand not found or user lacks access.

import { createServerSupabaseClient } from "./supabase-server";
import type { Brand } from "@/types/brand";

export async function loadBrandContext(brandId: string): Promise<Brand | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("id", brandId)
    .eq("archived", false)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Brand;
}

export async function listBrands(): Promise<Pick<Brand, "id" | "brand_name" | "brand_type" | "current_stage_focus" | "weakest_stage">[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("brands")
    .select("id, brand_name, brand_type, current_stage_focus, weakest_stage")
    .eq("archived", false)
    .order("brand_name");

  if (error || !data) {
    return [];
  }

  return data;
}

// Semantic search over brand's strategy embeddings
// Returns the most relevant chunks for Babuu to use as additional context
export async function searchBrandEmbeddings(
  brandId: string,
  query: string,
  matchCount = 5
): Promise<{ chunk_text: string; document_type: string; source_reference: string; similarity: number }[]> {
  const supabase = await createServerSupabaseClient();

  // Generate embedding for the query using Cohere
  const { CohereClient } = await import("cohere-ai");
  const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

  const embedResponse = await cohere.embed({
    texts: [query],
    model: "embed-english-v3.0",
    inputType: "search_query",
  });

  const queryEmbedding = (embedResponse.embeddings as number[][])[0];

  const { data, error } = await supabase.rpc("match_brand_embeddings", {
    query_embedding: queryEmbedding,
    target_brand_id: brandId,
    match_threshold: 0.65,
    match_count: matchCount,
  });

  if (error || !data) {
    return [];
  }

  return data;
}

// Store a new embedding (strategy doc, Babuu recommendation, etc.)
export async function embedAndStore(
  brandId: string,
  text: string,
  documentType: string,
  sourceReference: string
): Promise<void> {
  const { CohereClient } = await import("cohere-ai");
  const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

  // Chunk the text into 500-token segments
  const chunks = chunkText(text, 400);

  const embedResponse = await cohere.embed({
    texts: chunks,
    model: "embed-english-v3.0",
    inputType: "search_document",
  });

  const embeddings = embedResponse.embeddings as number[][];

  const supabase = await createServerSupabaseClient();

  const rows = chunks.map((chunk, i) => ({
    brand_id: brandId,
    document_type: documentType,
    chunk_text: chunk,
    embedding: embeddings[i],
    source_reference: sourceReference,
  }));

  await supabase.from("strategy_embeddings").insert(rows);
}

function chunkText(text: string, maxWords: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(" "));
  }

  return chunks.filter((c) => c.trim().length > 0);
}
