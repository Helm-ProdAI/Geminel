// Supabase auth middleware
// Refreshes the session on every request and protects dashboard routes.
// In MVP mode, /dashboard and /brands are accessible without a session
// so we can test without a full auth setup. Flip MVP_AUTH_BYPASS to false
// when adding client logins.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const MVP_AUTH_BYPASS = true; // set false to enforce login

export async function middleware(request: NextRequest) {
  // If Supabase env vars are not yet configured, pass through without auth check
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  // Refresh session — do not remove this
  const { data: { user } } = await supabase.auth.getUser();

  if (!MVP_AUTH_BYPASS) {
    const isProtected = request.nextUrl.pathname.startsWith("/dashboard") ||
                        request.nextUrl.pathname.startsWith("/brands") ||
                        request.nextUrl.pathname.startsWith("/settings");

    if (isProtected && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/cron).*)"],
};
