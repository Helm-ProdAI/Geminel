import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(decimals)}%`;
}

export function stageName(stage: number): string {
  return ["", "Awareness", "Consideration", "Conversion", "Loyalty", "Advocacy"][stage] ?? "";
}

export function stageColor(stage: number): string {
  return [
    "",
    "text-indigo-400",
    "text-sky-400",
    "text-emerald-400",
    "text-amber-400",
    "text-pink-400",
  ][stage] ?? "";
}

export function stageBg(stage: number): string {
  return [
    "",
    "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "bg-sky-500/10 text-sky-400 border-sky-500/20",
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "bg-pink-500/10 text-pink-400 border-pink-500/20",
  ][stage] ?? "";
}
