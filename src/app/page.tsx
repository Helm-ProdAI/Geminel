import Link from "next/link";

export default function HomePage() {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "#070B1C", color: "#EDEFF7" }}
    >
      {/* Nav */}
      <header
        className="flex h-16 items-center justify-between px-8"
        style={{ borderBottom: "1px solid rgba(174,182,212,0.08)" }}
      >
        <div className="flex items-center gap-2.5">
          <GuidingPairMark size={28} />
          <span
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontWeight: 300,
              fontSize: 18,
              letterSpacing: "0.04em",
              color: "#EDEFF7",
            }}
          >
            Gemin<b style={{ fontWeight: 400 }}>el</b>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm" style={{ color: "#AEB6D4" }}>
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md px-4 py-2 text-sm"
            style={{ background: "rgba(231,201,138,0.1)", border: "1px solid rgba(216,183,121,0.28)", color: "#E7C98A" }}
          >
            Open Babuu
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-8">
          <GuidingPairMark size={56} />
        </div>

        <div className="eyebrow mb-6" style={{ letterSpacing: "0.4em" }}>
          Marketing intelligence
        </div>

        <h1
          className="mx-auto max-w-2xl"
          style={{
            fontFamily: "Fraunces, Georgia, serif",
            fontWeight: 300,
            fontSize: "clamp(36px, 6vw, 68px)",
            lineHeight: 1.15,
            color: "#EDEFF7",
          }}
        >
          Every client brand.
          <br />
          One intelligent engine.
        </h1>

        <p
          className="mx-auto mt-6 max-w-lg text-base leading-relaxed"
          style={{ color: "#AEB6D4", fontWeight: 300 }}
        >
          Babuu is your second brain. It knows every brand, reads every data point,
          and thinks like a senior marketer with 30 years of experience.
          No hallucination. No guesswork. No AI tells.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-md px-6 py-3 text-sm font-medium"
            style={{ background: "#E7C98A", color: "#070B1C" }}
          >
            Open the platform
          </Link>
          <Link
            href="/brands/new"
            className="rounded-md px-6 py-3 text-sm"
            style={{ border: "1px solid rgba(216,183,121,0.28)", color: "#E7C98A" }}
          >
            Add first brand
          </Link>
        </div>

        {/* Feature grid */}
        <div className="mx-auto mt-24 grid max-w-4xl grid-cols-3 gap-4 text-left">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-md p-5"
              style={{
                background: "radial-gradient(140% 140% at 0% 0%, rgba(231,201,138,0.04) 0%, rgba(14,21,48,0) 60%)",
                border: "1px solid rgba(174,182,212,0.1)",
              }}
            >
              <p className="eyebrow mb-2" style={{ letterSpacing: "0.28em", fontSize: 10 }}>
                {f.category}
              </p>
              <p style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 16, color: "#EDEFF7", marginBottom: 8 }}>
                {f.title}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#AEB6D4", fontWeight: 300 }}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs" style={{ color: "rgba(174,182,212,0.3)", borderTop: "1px solid rgba(174,182,212,0.07)" }}>
        <span style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, letterSpacing: "0.2em" }}>
          Where brands rise.
        </span>
      </footer>
    </div>
  );
}

const FEATURES = [
  { category: "Intelligence", title: "Babuu AI agent",      description: "A senior marketing strategist that knows your brand inside out. Calls real data before answering. Never makes up facts." },
  { category: "Data",         title: "Growth Engine",        description: "Five-stage funnel tracking across Awareness, Consideration, Conversion, Loyalty, and Advocacy. Leaks surface automatically." },
  { category: "Channels",     title: "All platforms",        description: "Instagram, TikTok, LinkedIn, Meta Ads, Google Ads, SEO, AEO, email, and video — one unified view per brand." },
  { category: "Planning",     title: "Content calendar",     description: "Plan, brief, and track every post. Babuu drafts captions, assigns content pillars, and flags gaps in the pipeline." },
  { category: "Visibility",   title: "SEO + AEO",            description: "Track keyword rankings via Semrush and AI Overview inclusion via Profound. Know where you rank with humans and machines." },
  { category: "Automation",   title: "Always watching",      description: "Weekly reports, engagement alerts, ad pacing checks, and quarterly reviews — automated and delivered to your inbox." },
];

function GuidingPairMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ flexShrink: 0 }}>
      <g fill="none" stroke="#E7C98A" strokeWidth="1.4" strokeLinejoin="round" filter="drop-shadow(0 0 8px rgba(231,201,138,0.5))">
        <path d="M38 30 L41.5 44 L55 47.5 L41.5 51 L38 65 L34.5 51 L21 47.5 L34.5 44 Z" />
      </g>
      <g fill="#E7C98A" opacity="0.95">
        <path d="M66 44 L68.4 53 L77 55.4 L68.4 57.8 L66 67 L63.6 57.8 L55 55.4 L63.6 53 Z" />
      </g>
    </svg>
  );
}
