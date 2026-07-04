// Meta Graph API integration
// Covers Instagram Business + Facebook Pages insights and Meta Ads.
// Token: long-lived page access token stored in brand_integrations.credentials.

export interface MetaSocialMetrics {
  followers:       number;
  reach_7d:        number;
  impressions_7d:  number;
  engagement_rate: number;
  profile_visits:  number;
}

export interface MetaAdCampaign {
  id:          string;
  name:        string;
  status:      string;
  objective:   string;
  spend:       number;
  impressions: number;
  clicks:      number;
  conversions: number;
  ctr:         number;
  cpc:         number;
}

async function graphGet(path: string, token: string, params: Record<string, string> = {}) {
  const url = new URL(`https://graph.facebook.com/v21.0${path}`);
  url.searchParams.set("access_token", token);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Meta Graph API error on ${path}: ${res.status}`);
  return res.json();
}

export async function fetchInstagramMetrics(
  igUserId: string,
  accessToken: string
): Promise<MetaSocialMetrics> {
  const [profile, insights] = await Promise.all([
    graphGet(`/${igUserId}`, accessToken, { fields: "followers_count,profile_views" }),
    graphGet(`/${igUserId}/insights`, accessToken, {
      metric:  "reach,impressions,profile_views",
      period:  "day",
      since:   String(Math.floor(Date.now() / 1000) - 7 * 86400),
      until:   String(Math.floor(Date.now() / 1000)),
    }),
  ]);

  const reach7d = insights.data?.find((d: { name: string }) => d.name === "reach")?.values
    ?.reduce((s: number, v: { value: number }) => s + v.value, 0) ?? 0;

  const impressions7d = insights.data?.find((d: { name: string }) => d.name === "impressions")?.values
    ?.reduce((s: number, v: { value: number }) => s + v.value, 0) ?? 0;

  return {
    followers:       profile.followers_count ?? 0,
    reach_7d:        reach7d,
    impressions_7d:  impressions7d,
    engagement_rate: impressions7d > 0 ? (reach7d / impressions7d) * 100 : 0,
    profile_visits:  profile.profile_views ?? 0,
  };
}

export async function fetchMetaAdCampaigns(
  adAccountId: string,
  accessToken: string,
  datePreset = "last_7d"
): Promise<MetaAdCampaign[]> {
  const data = await graphGet(`/act_${adAccountId}/campaigns`, accessToken, {
    fields:      "id,name,status,objective,insights{spend,impressions,clicks,actions,ctr,cpc}",
    date_preset: datePreset,
    limit:       "50",
  });

  return (data.data ?? []).map((c: {
    id: string;
    name: string;
    status: string;
    objective: string;
    insights?: { data?: [{ spend: string; impressions: string; clicks: string; ctr: string; cpc: string; actions?: { action_type: string; value: string }[] }] };
  }) => {
    const ins = c.insights?.data?.[0];
    const conversions = (ins?.actions ?? [])
      .filter((a: { action_type: string }) => a.action_type === "purchase" || a.action_type === "lead")
      .reduce((s: number, a: { value: string }) => s + Number(a.value), 0);

    return {
      id:          c.id,
      name:        c.name,
      status:      c.status,
      objective:   c.objective,
      spend:       Number(ins?.spend ?? 0),
      impressions: Number(ins?.impressions ?? 0),
      clicks:      Number(ins?.clicks ?? 0),
      conversions,
      ctr:         Number(ins?.ctr ?? 0),
      cpc:         Number(ins?.cpc ?? 0),
    };
  });
}
