"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Login failed. Check your credentials.");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "#070B1C" }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2.5">
            <GuidingPairMark size={32} />
          </div>
          <h1
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontWeight: 300,
              fontSize: 22,
              color: "#EDEFF7",
              letterSpacing: "0.04em",
            }}
          >
            Gemin<b style={{ fontWeight: 400 }}>el</b>
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#AEB6D4" }}>
            Sign in to Babuu
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs" style={{ color: "#AEB6D4" }}>
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border px-4 py-2.5 text-sm outline-none transition-colors"
              style={{
                background:   "#0E1530",
                borderColor:  "rgba(174,182,212,0.2)",
                color:        "#EDEFF7",
              }}
              onFocus={(e)  => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(216,183,121,0.5)"; }}
              onBlur={(e)   => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(174,182,212,0.2)"; }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs" style={{ color: "#AEB6D4" }}>
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border px-4 py-2.5 text-sm outline-none transition-colors"
              style={{
                background:  "#0E1530",
                borderColor: "rgba(174,182,212,0.2)",
                color:       "#EDEFF7",
              }}
              onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(216,183,121,0.5)"; }}
              onBlur={(e)  => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(174,182,212,0.2)"; }}
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: "#E07878" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md py-2.5 text-sm font-medium transition-all"
            style={{
              background: loading ? "rgba(231,201,138,0.5)" : "#E7C98A",
              color:      "#070B1C",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* MVP bypass */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="text-xs transition-colors"
            style={{ color: "rgba(174,182,212,0.4)" }}
          >
            Skip login (MVP mode)
          </Link>
        </div>
      </div>
    </div>
  );
}

function GuidingPairMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <g fill="none" stroke="#E7C98A" strokeWidth="1.4" strokeLinejoin="round"
         filter="drop-shadow(0 0 8px rgba(231,201,138,0.5))">
        <path d="M38 30 L41.5 44 L55 47.5 L41.5 51 L38 65 L34.5 51 L21 47.5 L34.5 44 Z" />
      </g>
      <g fill="#E7C98A" opacity="0.95">
        <path d="M66 44 L68.4 53 L77 55.4 L68.4 57.8 L66 67 L63.6 57.8 L55 55.4 L63.6 53 Z" />
      </g>
    </svg>
  );
}
