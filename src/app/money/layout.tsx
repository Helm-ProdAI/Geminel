import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Money — personal ledger",
  description: "Track spending, debts and goals in PHP.",
  manifest: "/money.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Money" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#070B1C",
  viewportFit: "cover",
};

export default function MoneyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
