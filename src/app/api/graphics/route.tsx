// GET /api/graphics?text=...&type=quote|stat|hook&eyebrow=...&brand=...&format=square|story|landscape
// On-brand graphic generation via Next's built-in ImageResponse (Satori).
// Zero external services. Returns a PNG ready for posting.
//
// Examples:
//   /api/graphics?type=quote&text=Most marketing shouts. This is different.&brand=Geminel
//   /api/graphics?type=stat&text=2.4x&eyebrow=more saves from carousels&format=story

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const SIZES: Record<string, { width: number; height: number }> = {
  square:    { width: 1080, height: 1080 },
  story:     { width: 1080, height: 1920 },
  landscape: { width: 1200, height: 675 },
};

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const text    = p.get("text") ?? "Where brands rise.";
  const type    = p.get("type") ?? "quote";
  const eyebrow = p.get("eyebrow") ?? "";
  const brand   = p.get("brand") ?? "Geminel";
  const format  = p.get("format") ?? "square";

  const size = SIZES[format] ?? SIZES.square;
  const isStat = type === "stat";
  const isStory = format === "story";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "radial-gradient(120% 120% at 20% 10%, #101735 0%, #070B1C 65%)",
          padding: isStory ? 120 : 90,
          position: "relative",
        }}
      >
        {/* Guiding pair mark */}
        <svg width={isStory ? 72 : 56} height={isStory ? 72 : 56} viewBox="0 0 100 100" style={{ marginBottom: 48 }}>
          <path
            d="M38 30 L41.5 44 L55 47.5 L41.5 51 L38 65 L34.5 51 L21 47.5 L34.5 44 Z"
            fill="none" stroke="#E7C98A" strokeWidth="1.4" strokeLinejoin="round"
          />
          <path
            d="M66 44 L68.4 53 L77 55.4 L68.4 57.8 L66 67 L63.6 57.8 L55 55.4 L63.6 53 Z"
            fill="#E7C98A" opacity="0.95"
          />
        </svg>

        {eyebrow ? (
          <div
            style={{
              color: "#D8B779",
              fontSize: isStory ? 30 : 24,
              letterSpacing: 10,
              textTransform: "uppercase",
              marginBottom: 36,
              textAlign: "center",
              display: "flex",
            }}
          >
            {eyebrow}
          </div>
        ) : null}

        <div
          style={{
            color: "#EDEFF7",
            fontSize: isStat ? (isStory ? 220 : 180) : (isStory ? 68 : 56),
            fontWeight: 300,
            textAlign: "center",
            lineHeight: 1.25,
            maxWidth: "92%",
            display: "flex",
            fontFamily: "Georgia, serif",
          }}
        >
          {text}
        </div>

        {/* Footer wordmark */}
        <div
          style={{
            position: "absolute",
            bottom: isStory ? 100 : 64,
            color: "#AEB6D4",
            fontSize: isStory ? 28 : 22,
            letterSpacing: 6,
            display: "flex",
          }}
        >
          {brand.toUpperCase()}
        </div>

        {/* Gold hairline */}
        <div
          style={{
            position: "absolute",
            bottom: isStory ? 160 : 110,
            width: 80,
            height: 1,
            background: "rgba(216,183,121,0.6)",
            display: "flex",
          }}
        />
      </div>
    ),
    { width: size.width, height: size.height }
  );
}
