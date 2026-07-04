// Google Search Console integration
// Fetches clicks, impressions, CTR, and position per query.

interface GSCRow {
  query:       string;
  clicks:      number;
  impressions: number;
  ctr:         number;
  position:    number;
}

interface GSCConfig {
  site_url:      string;
  refresh_token: string;
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type:    "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`GSC token refresh failed: ${data.error}`);
  return data.access_token as string;
}

export async function fetchTopQueries(
  config: GSCConfig,
  startDate: string,
  endDate: string,
  limit = 50
): Promise<GSCRow[]> {
  const token = await getAccessToken(config.refresh_token);

  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(config.site_url)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: limit,
        startRow: 0,
      }),
    }
  );

  if (!res.ok) throw new Error(`GSC API error: ${res.status}`);
  const data = await res.json();

  return (data.rows ?? []).map((row: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }) => ({
    query:       row.keys[0],
    clicks:      row.clicks,
    impressions: row.impressions,
    ctr:         row.ctr,
    position:    row.position,
  }));
}
