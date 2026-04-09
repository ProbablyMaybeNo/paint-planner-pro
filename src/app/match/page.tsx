"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loadPaints, PAINT_TYPE_ICONS, inferPaintType } from "@/lib/paints";
import {
  findClosestPaints,
  getTechniqueColors,
  getHarmonyColors,
  hexToHsl,
  isLightColor,
  HARMONY_CONFIGS,
} from "@/lib/colors";
import type { Paint } from "@/types/paint";
import TerminalBox from "@/components/ui/TerminalBox";

function ColorSwatch({ hex, label, size = "sm" }: { hex: string; label?: string; size?: "sm" | "lg" }) {
  const isLight = hex ? isLightColor(hex) : false;
  return (
    <div className={`border border-border ${size === "lg" ? "h-20" : "h-12"}`}
         style={{ backgroundColor: hex || "#111" }}>
      {label && (
        <div className="px-1 py-0.5 text-[9px]" style={{ color: isLight ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.6)" }}>
          {label}
        </div>
      )}
    </div>
  );
}

function MatchRow({ paint, score, onClick }: { paint: Paint; score: number; onClick?: () => void }) {
  const icon = PAINT_TYPE_ICONS[inferPaintType(paint)] ?? PAINT_TYPE_ICONS[""];
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 py-1.5 px-2 border-b border-border/40 hover:bg-green-faint cursor-pointer group"
    >
      <div className="w-6 h-6 border border-border/60 flex-shrink-0"
           style={{ backgroundColor: paint.hex || "#111" }} />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-green truncate group-hover:glow-green">{paint.name}</div>
        <div className="text-[9px] text-green-dim">{paint.company} · {paint.line}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-[9px] text-green font-mono">{paint.hex}</div>
        <div className="text-[9px] text-green-dim">ΔE {score.toFixed(1)}</div>
      </div>
      <span className="text-[10px]" style={{ color: icon.color }} title={icon.label}>{icon.symbol}</span>
    </div>
  );
}

function MatchPageInner() {
  const searchParams = useSearchParams();
  const initialHex = searchParams.get("hex") || "";

  const [paints, setPaints] = useState<Paint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hexInput, setHexInput] = useState(initialHex.startsWith("#") ? initialHex : initialHex ? `#${initialHex}` : "");
  const [activeHex, setActiveHex] = useState(initialHex.startsWith("#") ? initialHex : initialHex ? `#${initialHex}` : "");
  const [harmonyMode, setHarmonyMode] = useState("complementary");

  useEffect(() => {
    loadPaints().then((d) => { setPaints(d); setLoading(false); });
  }, []);

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(activeHex);

  const closest = useMemo(() => {
    if (!isValidHex || loading) return [] as Array<{ paint: Paint; deltaE: number }>;
    return findClosestPaints<Paint>(activeHex, paints.filter(p => p.hex?.startsWith("#")), 10);
  }, [activeHex, paints, isValidHex, loading]);

  const techniques = useMemo(() => {
    if (!isValidHex) return null;
    return getTechniqueColors(activeHex);
  }, [activeHex, isValidHex]);

  const hsl = useMemo(() => {
    if (!isValidHex) return null;
    return hexToHsl(activeHex);
  }, [activeHex, isValidHex]);

  const harmonyColors = useMemo(() => {
    if (!hsl) return [];
    return getHarmonyColors(hsl.h, hsl.s, hsl.l, harmonyMode);
  }, [hsl, harmonyMode]);

  const harmonyMatches = useMemo(() => {
    return harmonyColors.map((c) => ({
      color: c,
      matches: findClosestPaints<Paint>(c.hex, paints.filter(p => p.hex?.startsWith("#")), 3),
    }));
  }, [harmonyColors, paints]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = hexInput.startsWith("#") ? hexInput : `#${hexInput}`;
    setActiveHex(val.toUpperCase());
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-4 py-2">
        <span className="text-green glow-green text-xs tracking-widest font-semibold">
          ┌─[ COLOUR MATCH SYSTEM ]
        </span>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden overflow-y-auto lg:overflow-hidden">
        {/* Left: input + swatch */}
        <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-border p-4 flex flex-col gap-4 overflow-y-auto flex-shrink-0">
          <TerminalBox title="TARGET COLOUR" compact>
            {/* Hex input */}
            <form onSubmit={handleSubmit} className="flex gap-1 mb-3">
              <input
                type="text"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value.toUpperCase())}
                placeholder="#FF8C00"
                maxLength={7}
                className="flex-1 text-xs py-1"
              />
              <button type="submit" className="btn-terminal text-[10px] px-2">▶</button>
            </form>

            {/* Large swatch */}
            <div
              className="w-full h-28 border border-border mb-3 flex flex-col justify-end p-2"
              style={{ backgroundColor: isValidHex ? activeHex : "#111" }}
            >
              {isValidHex && (
                <>
                  <div className="text-[11px] font-mono" style={{ color: isLightColor(activeHex) ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)" }}>
                    {activeHex}
                  </div>
                  {hsl && (
                    <div className="text-[9px]" style={{ color: isLightColor(activeHex) ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.5)" }}>
                      H:{hsl.h.toFixed(0)}° S:{hsl.s.toFixed(0)}% L:{hsl.l.toFixed(0)}%
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Native color picker */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-green-dim">PICKER:</label>
              <input
                type="color"
                value={isValidHex ? activeHex : "#00ff41"}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase();
                  setHexInput(v);
                  setActiveHex(v);
                }}
                className="w-8 h-6 border border-border bg-transparent cursor-pointer"
              />
            </div>
          </TerminalBox>

          {/* Technique palette */}
          {techniques && (
            <TerminalBox title="TECHNIQUE PALETTE" compact>
              <div className="space-y-1">
                {Object.entries(techniques).map(([key, hex]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-8 h-5 border border-border/60 flex-shrink-0" style={{ backgroundColor: hex }} />
                    <span className="text-[9px] text-green-dim uppercase">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-[9px] text-green ml-auto font-mono">{hex}</span>
                  </div>
                ))}
              </div>
            </TerminalBox>
          )}
        </div>

        {/* Center: closest matches */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-border p-3 flex items-center gap-2">
            <span className="text-green-dim text-[10px] tracking-widest">CLOSEST MATCHES</span>
            <span className="text-green-dim text-[10px]">— CIEDE2000 ΔE</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-20">
                <span className="text-green-dim text-xs">LOADING<span className="blink">_</span></span>
              </div>
            ) : !isValidHex ? (
              <div className="flex items-center justify-center h-20">
                <span className="text-green-dim text-xs">ENTER HEX TO SCAN</span>
              </div>
            ) : closest.length === 0 ? (
              <div className="flex items-center justify-center h-20">
                <span className="text-green-dim text-xs">NO MATCHES FOUND</span>
              </div>
            ) : (
              <div>
                {closest.map(({ paint, deltaE: de }) => (
                  <MatchRow key={paint.id} paint={paint} score={de} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: harmony */}
        <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border flex flex-col overflow-hidden flex-shrink-0">
          <div className="border-b border-border p-3">
            <span className="text-green-dim text-[10px] tracking-widest">COLOUR HARMONIES</span>
          </div>

          {/* Harmony mode selector */}
          <div className="p-3 border-b border-border">
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(HARMONY_CONFIGS).map(([key, cfg]) => (
                <button
                  key={key}
                  className={`btn-terminal text-[9px] px-1 py-1 ${harmonyMode === key ? "active" : ""}`}
                  onClick={() => setHarmonyMode(key)}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
            {HARMONY_CONFIGS[harmonyMode] && (
              <p className="text-[9px] text-green-dim mt-2">
                {HARMONY_CONFIGS[harmonyMode].description}
              </p>
            )}
          </div>

          {/* Harmony colors + matches */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {harmonyMatches.map(({ color, matches }, i) => (
              <div key={i}>
                {/* Color strip */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 border border-border" style={{ backgroundColor: color.hex }} />
                  <div>
                    <div className="text-[10px] text-green font-mono">{color.hex}</div>
                    <div className="text-[9px] text-green-dim">
                      H:{color.hue.toFixed(0)}° S:{color.saturation.toFixed(0)}% L:{color.lightness.toFixed(0)}%
                    </div>
                  </div>
                </div>
                {/* Closest paints for this harmony color */}
                {matches.map(({ paint, deltaE: de }) => (
                  <div key={paint.id} className="flex items-center gap-1.5 py-0.5 pl-10">
                    <div className="w-4 h-4 border border-border/60 flex-shrink-0" style={{ backgroundColor: paint.hex || "#111" }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-green truncate">{paint.name}</div>
                      <div className="text-[9px] text-green-dim">{paint.company}</div>
                    </div>
                    <span className="text-[9px] text-green-dim flex-shrink-0">ΔE {de.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MatchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center flex-1">
        <span className="text-green-dim text-xs">LOADING<span className="blink">_</span></span>
      </div>
    }>
      <MatchPageInner />
    </Suspense>
  );
}
