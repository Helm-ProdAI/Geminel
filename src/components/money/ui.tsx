"use client";

import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-midnight/80 p-4 backdrop-blur", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3 mt-6 flex items-baseline justify-between gap-3 first:mt-0">
      <h2 className="font-serif text-lg text-cloud">{children}</h2>
      {hint ? <span className="text-[11px] uppercase tracking-wider text-mist/70">{hint}</span> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "gold" | "alert";
}) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-mist/80">{label}</span>
      <span
        className={cn(
          "font-serif text-2xl leading-tight",
          tone === "gold" && "text-gold",
          tone === "alert" && "text-[#F09A9A]",
          tone === "default" && "text-cloud"
        )}
      >
        {value}
      </span>
      {sub ? <span className="text-xs text-mist">{sub}</span> : null}
    </Card>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-mist/80">{label}</span>
      {children}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-white/10 bg-deep/60 px-3 py-2.5 text-[16px] text-cloud outline-none placeholder:text-mist/50 focus:border-gold/50";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputBase, "appearance-none", props.className)} />;
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  return (
    <button
      {...props}
      className={cn(
        "rounded-xl px-4 py-2.5 text-sm font-medium transition active:scale-[0.98]",
        variant === "primary" && "bg-gold text-deep",
        variant === "ghost" && "border border-white/12 text-mist",
        variant === "danger" && "border border-[#F09A9A]/30 text-[#F09A9A]",
        className
      )}
    />
  );
}

export function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: color }}
      />
    </div>
  );
}
