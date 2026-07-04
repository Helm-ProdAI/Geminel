// Semrush API integration
// Fetches organic keyword positions for a domain.

interface SemrushKeyword {
  keyword:          string;
  position:         number;
  previous_position: number;
  search_volume:    number;
  cpc:              number;
  url:              string;
  traffic_percent:  number;
}

export async function fetchOrganicKeywords(
  domain: string,
  database = "us",
  limit = 100
): Promise<SemrushKeyword[]> {
  const apiKey = process.env.SEMRUSH_API_KEY;
  if (!apiKey) throw new Error("SEMRUSH_API_KEY not set");

  const url = new URL("https://api.semrush.com/");
  url.searchParams.set("type",       "domain_organic");
  url.searchParams.set("key",        apiKey);
  url.searchParams.set("domain",     domain);
  url.searchParams.set("database",   database);
  url.searchParams.set("display_limit", String(limit));
  url.searchParams.set("export_columns", "Ph,Po,Pp,Nq,Cp,Ur,Tr");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Semrush API error: ${res.status}`);
  const text = await res.text();

  // Semrush returns CSV
  const lines = text.trim().split("\n").slice(1); // skip header
  return lines.map((line) => {
    const [keyword, position, previous_position, search_volume, cpc, url_col, traffic_percent] =
      line.split(";");
    return {
      keyword,
      position:          Number(position),
      previous_position: Number(previous_position),
      search_volume:     Number(search_volume),
      cpc:               Number(cpc),
      url:               url_col ?? "",
      traffic_percent:   Number(traffic_percent),
    };
  });
}

export async function fetchKeywordHistory(
  keyword: string,
  database = "us"
): Promise<{ date: string; position: number }[]> {
  const apiKey = process.env.SEMRUSH_API_KEY;
  if (!apiKey) throw new Error("SEMRUSH_API_KEY not set");

  const url = new URL("https://api.semrush.com/");
  url.searchParams.set("type",     "phrase_organic");
  url.searchParams.set("key",      apiKey);
  url.searchParams.set("phrase",   keyword);
  url.searchParams.set("database", database);
  url.searchParams.set("export_columns", "Dt,Po");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Semrush phrase API error: ${res.status}`);
  const text = await res.text();

  return text.trim().split("\n").slice(1).map((line) => {
    const [date, position] = line.split(";");
    return { date, position: Number(position) };
  });
}
