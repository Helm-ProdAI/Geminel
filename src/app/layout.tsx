import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { BabuuAssistant } from "@/components/babuu/BabuuAssistant";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Babuu — Geminel",
  description: "Where brands rise.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable} antialiased min-h-screen`}>
        {children}
        <BabuuAssistant />
      </body>
    </html>
  );
}
