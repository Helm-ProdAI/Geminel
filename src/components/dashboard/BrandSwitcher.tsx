"use client";

import { useState } from "react";
import { ChevronDown, Building2, User, Sparkles, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandOption {
  id: string;
  brand_name: string;
  brand_type: "personal" | "creator" | "corporate" | "ecommerce";
  current_stage_focus: number;
  weakest_stage: number;
}

const TYPE_ICONS = {
  personal:  User,
  creator:   Sparkles,
  corporate: Building2,
  ecommerce: ShoppingBag,
};

interface BrandSwitcherProps {
  brands: BrandOption[];
  currentBrandId: string;
  onSwitch: (brandId: string) => void;
}

export function BrandSwitcher({ brands, currentBrandId, onSwitch }: BrandSwitcherProps) {
  const [open, setOpen] = useState(false);
  const current = brands.find((b) => b.id === currentBrandId);
  if (!current) return null;

  const Icon = TYPE_ICONS[current.brand_type];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-all"
        style={{
          borderColor: open ? "rgba(216,183,121,0.55)" : "rgba(216,183,121,0.28)",
          background: "#0E1530",
          color: "#EDEFF7",
        }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: "#E7C98A" }} />
        <span style={{ fontWeight: 400 }}>{current.brand_name}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          style={{ color: "#AEB6D4" }}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-full z-20 mt-1.5 w-60 rounded-md shadow-2xl overflow-hidden"
            style={{ background: "#0E1530", border: "1px solid rgba(216,183,121,0.28)" }}
          >
            <div className="p-1">
              {brands.map((brand) => {
                const BrandIcon = TYPE_ICONS[brand.brand_type];
                const isActive = brand.id === currentBrandId;

                return (
                  <button
                    key={brand.id}
                    onClick={() => { onSwitch(brand.id); setOpen(false); }}
                    className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm transition-colors"
                    style={{
                      background: isActive ? "rgba(231,201,138,0.08)" : "transparent",
                      color: isActive ? "#EDEFF7" : "#AEB6D4",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(174,182,212,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <BrandIcon
                      className="h-4 w-4 shrink-0"
                      style={{ color: isActive ? "#E7C98A" : "#AEB6D4" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontWeight: 400 }}>{brand.brand_name}</p>
                      <p className="text-xs capitalize" style={{ color: "#AEB6D4", opacity: 0.7 }}>
                        {brand.brand_type}
                      </p>
                    </div>
                    {isActive && (
                      <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#E7C98A" }} />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-1" style={{ borderTop: "1px solid rgba(174,182,212,0.1)" }}>
              <a
                href="/brands/new"
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm transition-colors"
                style={{ color: "#AEB6D4" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#EDEFF7"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#AEB6D4"; }}
              >
                <span className="text-base leading-none" style={{ color: "#E7C98A" }}>+</span>
                <span>Add brand</span>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
