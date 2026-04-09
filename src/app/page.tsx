"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadPaints, getCompanies } from "@/lib/paints";

const BOOT_LINES = [
  "PAINT PLANNER PRO v0.1.0",
  "Copyright (C) 2026 Antigravity Systems",
  "",
  "Initializing colour subsystems......... [OK]",
  "Loading paint database................. [OK]",
  "Calibrating CIEDE2000 ΔE engine........ [OK]",
  "Mounting interactive colour wheel...... [OK]",
  "Initializing tactical planner.......... [OK]",
  "",
  "SYSTEM READY",
  "",
];

const NAV_CARDS = [
  {
    href: "/library",
    key: "L",
    title: "PAINT DATABASE",
    desc: "Browse every paint from 31 companies. Filter by company, hue range, paint type. Sort by colour.",
    color: "#00ff41",
  },
  {
    href: "/match",
    key: "M",
    title: "COLOUR MATCH",
    desc: "Enter any hex code and find the 10 closest paints using CIEDE2000. Harmony panel + technique guide.",
    color: "#00e5ff",
  },
  {
    href: "/wheel",
    key: "W",
    title: "COLOUR WHEEL",
    desc: "Interactive HSL wheel with 8 harmony modes. Drag pickers, build palettes, export to planner.",
    color: "#ff8c00",
  },
  {
    href: "/planner",
    key: "P",
    title: "TACTICAL PLANNER",
    desc: "Armies › Units › Models hierarchy. Paint scheme layers, body zone mapping, progress tracking.",
    color: "#ff00ff",
  },
];

const COMPANIES_DISPLAY = [
  "Citadel", "Vallejo Model Color", "Vallejo Game Color", "Army Painter",
  "Scale75", "Reaper Miniatures", "Pro Acryl", "AK Interactive",
  "Ammo by MIG", "P3 Formula", "Two Thin Coats", "Monument Hobbies",
  "Foundry", "Tamiya", "Humbrol", "Revell", "Mr. Hobby", "Mr. Paint",
  "AK Real Colors", "Warcolours", "Kimera Kolors", "Green Stuff World",
  "Turbo Dork", "Golden", "Liquitex", "Mission Models", "Italeri",
  "Coat d'Arms", "Abteilung 502", "Creature Caster",
];

export default function HomePage() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showCards, setShowCards] = useState(false);
  const [paintCount, setPaintCount] = useState<number | null>(null);
  const [companyCount, setCompanyCount] = useState<number | null>(null);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= BOOT_LINES.length) {
        clearInterval(interval);
        setTimeout(() => setShowCards(true), 200);
      }
    }, 70);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadPaints().then((paints) => {
      const withHex = paints.filter((p) => p.hex && p.hex.startsWith("#"));
      setPaintCount(withHex.length);
      setCompanyCount(getCompanies(paints).length);
    });
  }, []);

  return (
    <div className="flex-1 flex flex-col p-6 max-w-5xl mx-auto w-full">
      {/* Boot sequence */}
      <div className="mb-6 font-terminal">
        {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className={`text-xs leading-relaxed ${
              line === "SYSTEM READY"
                ? "text-green glow-green font-semibold text-sm"
                : line.includes("[OK]")
                  ? "text-green"
                  : "text-green-dim"
            }`}
          >
            {line || "\u00a0"}
          </div>
        ))}
        {visibleLines < BOOT_LINES.length && (
          <span className="blink text-green text-xs">█</span>
        )}
      </div>

      {showCards && (
        <>
          {/* Nav cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 animate-fade-in">
            {NAV_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="border border-border p-4 bg-surface hover:bg-surface-2 transition-all duration-150 group block"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm font-semibold tracking-wider" style={{ color: card.color }}>
                    [{card.key}] {card.title}
                  </div>
                </div>
                <p className="text-[11px] text-green-dim leading-relaxed">{card.desc}</p>
                <div
                  className="mt-3 text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: card.color }}
                >
                  ENTER →
                </div>
              </Link>
            ))}
          </div>

          {/* Stats row */}
          <div className="border-t border-border pt-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center animate-fade-in">
            {[
              { label: "PAINTS WITH HEX", value: paintCount ? paintCount.toLocaleString() : "—", note: "INDEXED" },
              { label: "COMPANIES", value: companyCount ? String(companyCount) : "31", note: "ACTIVE" },
              { label: "HARMONY MODES", value: "8", note: "COLOUR WHEEL" },
              { label: "DELTA-E ENGINE", value: "CIEDE2000", note: "COLOUR MATCH" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-0.5">
                <div className="text-lg text-green glow-green font-semibold">{stat.value}</div>
                <div className="text-[9px] text-green-dim tracking-widest">{stat.label}</div>
                <div className="text-[8px] text-green-dim opacity-50">{stat.note}</div>
              </div>
            ))}
          </div>

          {/* Company grid */}
          <div className="border border-border bg-surface animate-fade-in">
            <div className="px-3 py-1.5 border-b border-border">
              <span className="text-green text-[10px] tracking-widest glow-green">
                ┌─[ INDEXED PAINT COMPANIES ]
              </span>
            </div>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-1">
              {COMPANIES_DISPLAY.map((co) => (
                <Link
                  key={co}
                  href={`/library?company=${encodeURIComponent(co)}`}
                  className="text-[10px] text-green-dim hover:text-green hover:glow-green truncate transition-colors"
                >
                  › {co}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
