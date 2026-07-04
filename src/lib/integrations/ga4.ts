// Google Analytics 4 integration
// Uses the Data API (googleapis + google-auth-library).
// Credentials flow: OAuth2 with refresh token stored per brand in brand_integrations.

import { createServiceSupabaseClient } from "@/lib/supabase-server";

interface GA4Metrics {
  sessions:       number;
  new_users:      number;
  pageviews:      number;
  bounce_rate:    number;
  avg_session_sec: number;
  conversions:    number;
}

interface GA4Config {
  property_id:   string;
  access_token:  string;
  refresh_token: string;
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
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
  if (!res.ok) throw new Error(`GA4 token refresh failed: ${data.error}`);
  return data.access_token as string;
}

export async function fetchGA4Metrics(
  config: GA4Config,
  startDate: string,
  endDate: string
): Promise<GA4Metrics> {
  const token = await refreshAccessToken(config.refresh_token);

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${config.property_id}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: "sessions" },
          { name: "newUsers" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
          { name: "conversions" },
        ],
      }),
    }
  );

  if (!res.ok) throw new Error(`GA4 API error: ${res.status}`);
  const data = await res.json();
  const row  = data.rows?.[0]?.metricValues ?? [];

  return {
    sessions:       Number(row[0]?.value ?? 0),
    new_users:      Number(row[1]?.value ?? 0),
    pageviews:      Number(row[2]?.value ?? 0),
    bounce_rate:    Number(row[3]?.value ?? 0),
    avg_session_sec: Number(row[4]?.value ?? 0),
    conversions:    Number(row[5]?.value ?? 0),
  };
}

export async function getBrandGA4Config(brandId: string): Promise<GA4Config | null> {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("brand_integrations")
    .select("credentials, settings")
    .eq("brand_id", brandId)
    .eq("platform", "google_analytics")
    .eq("is_active", true)
    .single();

  if (!data) return null;
  return {
    property_id:   (data.settings as Record<string, string>)?.property_id,
    access_token:  "",
    refresh_token: (data.credentials as Record<string, string>)?.refresh_token,
  };
}
