// Profound API integration for AI Engine Optimization (AEO)
// Tracks whether the brand appears in AI Overview answers on Google.

interface AEOCheckResult {
  query:            string;
  brand_mentioned:  boolean;
  position?:        number;
  ai_answer_text?:  string;
  source_urls?:     string[];
  checked_at:       string;
}

export async function checkAEOPresence(
  query: string,
  brandName: string
): Promise<AEOCheckResult> {
  const apiKey = process.env.PROFOUND_API_KEY;
  if (!apiKey) throw new Error("PROFOUND_API_KEY not set");

  const res = await fetch("https://api.profound.co/v1/queries", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`Profound API error: ${res.status}`);
  const data = await res.json();

  const aiText: string = data.ai_overview?.text ?? "";
  const brandMentioned = aiText.toLowerCase().includes(brandName.toLowerCase());

  const sentences = aiText.split(/[.!?]/).map((s: string) => s.trim()).filter(Boolean);
  let position: number | undefined;
  if (brandMentioned) {
    position = sentences.findIndex((s: string) =>
      s.toLowerCase().includes(brandName.toLowerCase())
    ) + 1;
  }

  return {
    query,
    brand_mentioned: brandMentioned,
    position:        brandMentioned ? position : undefined,
    ai_answer_text:  aiText || undefined,
    source_urls:     data.ai_overview?.sources?.map((s: { url: string }) => s.url) ?? [],
    checked_at:      new Date().toISOString(),
  };
}

export async function batchCheckAEO(
  queries: string[],
  brandName: string
): Promise<AEOCheckResult[]> {
  const results = await Promise.allSettled(
    queries.map((q) => checkAEOPresence(q, brandName))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<AEOCheckResult> => r.status === "fulfilled")
    .map((r) => r.value);
}
