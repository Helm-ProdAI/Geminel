// Server-side Supabase client
// Use in Server Components, API routes, and Server Actions.
// Reads cookies to honor the user's auth session and RLS policies.
//
// NOTE: We use `createClient` (untyped) here because the hand-written
// Database interface causes TypeScript to resolve table types as `never`
// under Supabase's generic typing system. Once we run `supabase gen types`
// against the real project, replace this with the generated types file
// and use createServerClient<Database> again.

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDB = any;

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<AnyDB>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

// Service role client: bypasses RLS.
// Only use in cron jobs and internal automation. Never expose to users.
export function createServiceSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
