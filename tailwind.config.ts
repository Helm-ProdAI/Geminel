import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Geminel brand palette — exact from brand guidelines
        deep:       "#070B1C",   // background
        midnight:   "#0E1530",   // card surfaces
        ink:        "#1B2240",   // elevated surfaces
        gold:       "#E7C98A",   // Starlight Gold — primary accent
        champagne:  "#D8B779",   // eyebrows, labels, secondary gold
        mist:       "#AEB6D4",   // secondary text
        cloud:      "#EDEFF7",   // primary text
        paper:      "#F6F5F1",   // light mode ground
        line:       "rgba(216,183,121,0.28)", // gold border
        // Semantic (mapped to brand)
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        border:  "var(--border)",
        input:   "var(--input)",
        primary: {
          DEFAULT:    "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        muted: {
          DEFAULT:    "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        // Stage colors — celestial tone-matched
        stage: {
          awareness:     "#7C82D4",
          consideration: "#6FB8D4",
          conversion:    "#6EC4A0",
          loyalty:       "#D4B86E",
          advocacy:      "#D47CAA",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans:  ["Inter", "var(--font-sans)", "system-ui", "sans-serif"],
        mono:  ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
