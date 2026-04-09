"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loadPaints } from "@/lib/paints";
import {
  hslToHex,
  hexToHsl,
  isLightColor,
  getHarmonyColors,
  findClosestPaints,
  HARMONY_CONFIGS,
} from "@/lib/colors";
import type { ColorStop } from "@/types/paint";
import type { Paint } from "@/types/paint";
import TerminalBox from "@/components/ui/TerminalBox";
import dynamic from "next/dynamic";

const ColorWheelCanvas = dynamic(() => import("@/components/wheel/ColorWheelCanvas"), { ssr: false });

let stopCounter = 0;
function makeId() { return `stop-${++stopCounter}`; }

function defaultStops(hue: number, sat: number, mode: string, l: number): ColorStop[] {
  const config = HARMONY_CONFIGS[mode];
  if (!config) return [];

  return config.offsets.map((offset, i) => {
    let h = (hue + offset) % 360;
    if (h < 0) h += 360;
    let s = sat;
    let li = l;
    if (mode === "monochromatic") { li = Math.max(15, Math.min(85, l + (i - 2) * 18)); }
    if (mode === "shades") { li = 15 + i * 17; }
    return { id: makeId(), hue: h, saturation: s, lightness: li, isPrimary: i === 0 };
  });
}

function WheelPageInner() {
  const searchParams = useSearchParams();
  const initialHex = searchParams.get("hex") || "";

  const [paints, setPaints] = useState<Paint[]>([]);
  const [loading, setLoading] = useState(true);
  const [harmonyMode, setHarmonyMode] = useState("complementary");
  const [lightness, setLightness] = useState(50);
  const [stops, setStops] = useState<ColorStop[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [freeMode, setFreeMode] = useState(false);
  const [palette, setPalette] = useState<ColorStop[]>([]);

  useEffect(() => {
    loadPaints().then((d) => { setPaints(d); setLoading(false); });
  }, []);

  // Initialize stops from harmony mode
  useEffect(() => {
    let baseHue = 30;
    let baseSat = 75;
    let baseL = lightness;

    if (initialHex) {
      const hsl = hexToHsl(initialHex);
      if (hsl) { baseHue = hsl.h; baseSat = hsl.s; baseL = hsl.l; setLightness(baseL); }
    }

    const newStops = defaultStops(baseHue, baseSat, harmonyMode, baseL);
    setStops(newStops);
    setActiveId(newStops[0]?.id ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [harmonyMode]);

  const activeStop = stops.find((s) => s.id === activeId);

  const handleStopChange = useCallback((id: string, hue: number, saturation: number, l: number) => {
    if (freeMode) {
      setStops((prev) => prev.map((s) =>
        s.id === id ? { ...s, hue, saturation, lightness: l } : s
      ));
    } else {
      // Lock harmony relationships — move all stops relative to primary
      const idx = stops.findIndex((s) => s.id === id);
      if (idx < 0) return;
      const config = HARMONY_CONFIGS[harmonyMode];
      if (!config) return;
      const primaryOffset = config.offsets[idx] ?? 0;
      const primaryHue = ((hue - primaryOffset) % 360 + 360) % 360;

      setStops((prev) =>
        prev.map((s, i) => {
          let newHue = (primaryHue + (config.offsets[i] ?? 0)) % 360;
          if (newHue < 0) newHue += 360;
          let newL = s.lightness;
          if (harmonyMode === "monochromatic") { newL = Math.max(15, Math.min(85, lightness + (i - 2) * 18)); }
          if (harmonyMode === "shades") { newL = 15 + i * 17; }
          return { ...s, hue: newHue, saturation, lightness: newL };
        })
      );
    }
  }, [freeMode, stops, harmonyMode, lightness]);

  const handleLightnessChange = (val: number) => {
    setLightness(val);
    if (!freeMode) {
      setStops((prev) =>
        prev.map((s, i) => {
          let newL = val;
          if (harmonyMode === "monochromatic") { newL = Math.max(15, Math.min(85, val + (i - 2) * 18)); }
          if (harmonyMode === "shades") { newL = 15 + i * 17; }
          return { ...s, lightness: newL };
        })
      );
    }
  };

  const addFreeStop = () => {
    if (stops.length >= 10) return;
    setStops((prev) => [...prev, { id: makeId(), hue: Math.random() * 360, saturation: 70, lightness: lightness }]);
    setFreeMode(true);
  };

  const removeStop = (id: string) => {
    setStops((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) setActiveId(stops[0]?.id ?? null);
  };

  const addToPalette = (stop: ColorStop) => {
    if (palette.length >= 10) return;
    if (palette.some((p) => p.id === stop.id)) return;
    setPalette((prev) => [...prev, { ...stop }]);
  };

  const sendToPlanner = () => {
    const colors = palette.map((s) => ({
      hex: hslToHex(s.hue, s.saturation, s.lightness),
      hue: s.hue,
      saturation: s.saturation,
      lightness: s.lightness,
    }));
    localStorage.setItem("ppp_wheel_palette", JSON.stringify(colors));
  };

  const closestToActive = useMemo(() => {
    if (!activeStop || loading) return [] as Array<{ paint: Paint; deltaE: number }>;
    const hex = hslToHex(activeStop.hue, activeStop.saturation, activeStop.lightness);
    return findClosestPaints<Paint>(hex, paints.filter((p) => p.hex?.startsWith("#")), 6);
  }, [activeStop, paints, loading]);

  const activeHex = activeStop ? hslToHex(activeStop.hue, activeStop.saturation, activeStop.lightness) : "";

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-3 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span className="text-green glow-green text-xs tracking-widest font-semibold hidden sm:block shrink-0">
          ┌─[ COLOUR WHEEL TERMINAL ]
        </span>
        <div className="flex gap-1 overflow-x-auto sm:ml-4 flex-nowrap pb-0.5 sm:pb-0">
          {Object.entries(HARMONY_CONFIGS).map(([key, cfg]) => (
            <button
              key={key}
              className={`btn-terminal text-[9px] px-2 py-0.5 shrink-0 ${harmonyMode === key && !freeMode ? "active" : ""}`}
              onClick={() => { setHarmonyMode(key); setFreeMode(false); }}
            >
              {cfg.label}
            </button>
          ))}
          <button
            className={`btn-cyan btn-terminal text-[9px] px-2 py-0.5 shrink-0 ${freeMode ? "active" : ""}`}
            onClick={() => setFreeMode(true)}
          >
            FREE
          </button>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto shrink-0">
          <span className="text-green-dim text-[10px]">L:</span>
          <input
            type="range"
            min={10} max={90}
            value={lightness}
            onChange={(e) => handleLightnessChange(Number(e.target.value))}
            className="w-24 sm:w-28"
          />
          <span className="text-green text-[10px] font-mono w-6">{lightness}%</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-auto lg:overflow-hidden">
        {/* Wheel */}
        <div className="flex items-center justify-center p-2 lg:p-4 lg:flex-1 lg:overflow-hidden">
          <div className="relative">
            <ColorWheelCanvas
              stops={stops}
              activeId={activeId}
              onStopChange={handleStopChange}
              onStopSelect={setActiveId}
              lightness={lightness}
            />
            {freeMode && stops.length < 10 && (
              <button
                className="absolute bottom-2 right-2 btn-terminal text-[10px] px-2"
                onClick={addFreeStop}
              >
                + ADD STOP
              </button>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border flex flex-col lg:overflow-hidden lg:flex-shrink-0">
          {/* Stop list */}
          <div className="border-b border-border p-3">
            <div className="text-[10px] text-green-dim tracking-widest mb-2">COLOUR STOPS</div>
            <div className="space-y-1">
              {stops.map((stop, i) => {
                const hex = hslToHex(stop.hue, stop.saturation, stop.lightness);
                return (
                  <div
                    key={stop.id}
                    className={`flex items-center gap-2 px-2 py-1 cursor-pointer border transition-all
                      ${activeId === stop.id
                        ? "border-cyan/60 bg-cyan/10"
                        : "border-transparent hover:border-border"
                      }`}
                    onClick={() => setActiveId(stop.id)}
                  >
                    <div className="w-5 h-5 border border-border/60" style={{ backgroundColor: hex }} />
                    <span className="text-[9px] text-green font-mono flex-1">{hex}</span>
                    <span className="text-[9px] text-green-dim">H:{stop.hue.toFixed(0)}°</span>
                    {stop.isPrimary && <span className="text-[8px] text-green">PRIMARY</span>}
                    <button
                      className="text-[9px] text-red opacity-0 group-hover:opacity-100 hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); removeStop(stop.id); }}
                    >
                      ×
                    </button>
                    <button
                      className="text-[9px] text-cyan hover:glow-cyan"
                      onClick={(e) => { e.stopPropagation(); addToPalette(stop); }}
                      title="Add to palette"
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active stop matches */}
          <div className="lg:flex-1 lg:overflow-y-auto">
            <div className="p-3 border-b border-border">
              <div className="text-[10px] text-green-dim tracking-widest mb-1">CLOSEST PAINTS</div>
              {activeHex && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 border border-border" style={{ backgroundColor: activeHex }} />
                  <span className="text-[10px] text-green font-mono">{activeHex}</span>
                </div>
              )}
            </div>
            <div>
              {loading ? (
                <div className="p-3 text-green-dim text-xs">LOADING<span className="blink">_</span></div>
              ) : closestToActive.length === 0 ? (
                <div className="p-3 text-green-dim text-xs">NO DATA</div>
              ) : (
                closestToActive.map(({ paint, deltaE }) => (
                  <div key={paint.id} className="flex items-center gap-2 px-3 py-1.5 border-b border-border/40 hover:bg-green-faint">
                    <div className="w-5 h-5 border border-border/60" style={{ backgroundColor: paint.hex }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-green truncate">{paint.name}</div>
                      <div className="text-[8px] text-green-dim">{paint.company}</div>
                    </div>
                    <span className="text-[9px] text-green-dim">ΔE {deltaE.toFixed(1)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Palette export */}
          {palette.length > 0 && (
            <div className="border-t border-border p-3">
              <div className="text-[10px] text-green-dim tracking-widest mb-2">
                MY PALETTE ({palette.length}/10)
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {palette.map((s) => {
                  const hex = hslToHex(s.hue, s.saturation, s.lightness);
                  return (
                    <div key={s.id} className="w-6 h-6 border border-border" style={{ backgroundColor: hex }} title={hex} />
                  );
                })}
              </div>
              <a
                href="/planner"
                className="btn-terminal btn-cyan text-[10px] w-full block text-center"
                onClick={sendToPlanner}
              >
                SEND TO PLANNER →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WheelPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center flex-1">
        <span className="text-green-dim text-xs">LOADING<span className="blink">_</span></span>
      </div>
    }>
      <WheelPageInner />
    </Suspense>
  );
}
