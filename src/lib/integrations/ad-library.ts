// Meta Ad Library integration
// Official, free API for viewing every active ad any page runs.
// This is the backbone of Competitor Spy for paid ads.
// Requires: Meta access token with ads_read (same app as Meta integration).
// Docs: https://www.facebook.com/ads/library/api

export interface AdLibraryAd {
  id: string;
  page_name: string;
  ad_creative_bodies: string[];
  ad_creative_link_titles: string[];
  ad_creative_link_captions: string[];
  ad_delivery_start_time: string;
  ad_delivery_stop_time?: string;
  publisher_platforms: string[];
  ad_snapshot_url: string;
}

export async function searchCompetitorAds(
  searchTerms: string,
  accessToken: string,
  country = "US",
  limit = 25
): Promise<AdLibraryAd[]> {
  const url = new URL("https://graph.facebook.com/v21.0/ads_archive");
  url.searchParams.set("access_token",         accessToken);
  url.searchParams.set("search_terms",         searchTerms);
  url.searchParams.set("ad_reached_countries", `["${country}"]`);
  url.searchParams.set("ad_active_status",     "ACTIVE");
  url.searchParams.set("limit",                String(limit));
  url.searchParams.set(
    "fields",
    "id,page_name,ad_creative_bodies,ad_creative_link_titles,ad_creative_link_captions,ad_delivery_start_time,ad_delivery_stop_time,publisher_platforms,ad_snapshot_url"
  );

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ad Library API error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.data ?? [];
}

// Long-running ads are the strongest signal: nobody keeps paying for
// an ad that loses money. Sort by delivery start, oldest first.
export function rankByLongevity(ads: AdLibraryAd[]): AdLibraryAd[] {
  return [...ads].sort(
    (a, b) =>
      new Date(a.ad_delivery_start_time).getTime() -
      new Date(b.ad_delivery_start_time).getTime()
  );
}
