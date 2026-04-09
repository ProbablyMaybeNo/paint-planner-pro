"use client";

import { isLightColor } from "@/lib/colors";
import type { Paint } from "@/types/paint";

interface CompareTrayProps {
  paints: Paint[];
  onRemove: (id: number) => void;
  onClear: () => void;
}

export default function CompareTray({ paints, onRemove, onClear }: CompareTrayProps) {
  if (paints.length === 0) return null;

  return (
    <div className="border-t border-cyan/40 bg-cyan/5 px-4 py-2 flex items-center gap-3 flex-shrink-0">
      <span className="text-cyan text-[10px] tracking-widest whitespace-nowrap">
        COMPARE [{paints.length}/6]:
      </span>
      <div className="flex flex-1 gap-2 overflow-x-auto">
        {paints.map((p) => {
          const isLight = p.hex ? isLightColor(p.hex) : false;
          return (
            <div
              key={p.id}
              className="flex-shrink-0 border border-border/60 flex flex-col"
              style={{ minWidth: 80 }}
            >
              <div
                className="h-10 relative flex items-end px-1 pb-0.5"
                style={{ backgroundColor: p.hex || "#111" }}
              >
                <span
                  className="text-[8px] font-mono leading-none"
                  style={{ color: isLight ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)" }}
                >
                  {p.hex}
                </span>
                <button
                  onClick={() => onRemove(p.id)}
                  className="absolute top-0.5 right-0.5 text-[9px] leading-none"
                  style={{ color: isLight ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)" }}
                >
                  ×
                </button>
              </div>
              <div className="bg-surface px-1 py-0.5">
                <div className="text-[8px] text-green truncate">{p.name}</div>
                <div className="text-[8px] text-green-dim truncate">{p.company}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <a
          href={`/match?hex=${encodeURIComponent(paints[0]?.hex || "")}`}
          className="btn-terminal text-[9px] px-2"
        >
          MATCH →
        </a>
        <button className="btn-terminal text-[9px] px-2 text-red border-red/40" onClick={onClear}>
          CLEAR
        </button>
      </div>
    </div>
  );
}
