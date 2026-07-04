// GET /api/health — reports which services are configured.
// The Settings page reads this to show real connection status.
// Only reports presence of keys, never their values.

import { NextResponse } from "next/server";

export async function GET() {
  const env = process.env;

  const services = {
    supabase:   Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    anthropic:  Boolean(env.ANTHROPIC_API_KEY),
    cohere:     Boolean(env.COHERE_API_KEY),
    resend:     Boolean(env.RESEND_API_KEY),
    google:     Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    semrush:    Boolean(env.SEMRUSH_API_KEY),
    profound:   Boolean(env.PROFOUND_API_KEY),
    cloudinary: Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY),
    shotstack:  Boolean(env.SHOTSTACK_API_KEY),
    meta:       Boolean(env.META_APP_ID),
    cron:       Boolean(env.CRON_SECRET),
  };

  // Supabase reachability check (only if configured)
  let supabaseReachable = false;
  if (services.supabase) {
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        headers: {
          apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        signal: AbortSignal.timeout(3000),
      });
      supabaseReachable = res.ok;
    } catch {
      supabaseReachable = false;
    }
  }

  const requiredReady = services.supabase && services.anthropic;

  return NextResponse.json({
    ready: requiredReady,
    mode: requiredReady ? "live" : "demo",
    services,
    supabase_reachable: supabaseReachable,
    checked_at: new Date().toISOString(),
  });
}
