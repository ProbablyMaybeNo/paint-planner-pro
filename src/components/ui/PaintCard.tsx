"use client";

import { inferPaintType, PAINT_TYPE_ICONS } from "@/lib/paints";
import { isLightColor } from "@/lib/colors";
import type { Paint } from "@/types/paint";

interface PaintCardProps {
  paint: Paint;
  onClick?: (paint: Paint) => void;
  selected?: boolean;
}

export default function PaintCard({ paint, onClick, selected }: PaintCardProps) {
  const type = inferPaintType(paint);
  const icon = PAINT_TYPE_ICONS[type] ?? PAINT_TYPE_ICONS[""];
  const hasHex = paint.hex && paint.hex.startsWith("#");
  const isLight = hasHex ? isLightColor(paint.hex) : false;
  const labelBg = isLight ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.60)";
  const ink = isLight ? "rgba(0,0,0,0.92)" : "rgba(255,255,255,0.95)";
  const inkDim = isLight ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.80)";

  return (
    <div
      onClick={() => onClick?.(paint)}
      className={`
        relative w-full aspect-square cursor-pointer select-none
        border transition-all duration-150 group overflow-hidden
        ${selected
          ? "border-cyan z-10 scale-[1.04]"
          : "border-border hover:border-green hover:z-10"
        }
      `}
      style={{ backgroundColor: hasHex ? paint.hex : "#111" }}
      title={`${paint.name} · ${paint.company} · ${paint.hex ?? "no hex"}`}
    >
      {/* No hex placeholder */}
      {!hasHex && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-green-dim text-sm">NO HEX</span>
        </div>
      )}

      {/* Top strip: name + type — frosted bg for legibility */}
      <div
        className="absolute top-0 left-0 right-0 flex justify-between items-center gap-0.5 px-1 py-0.5"
        style={{ background: labelBg }}
      >
        <span className="text-[11px] font-semibold leading-tight truncate flex-1 min-w-0" style={{ color: ink }}>
          {paint.name}
        </span>
        <span className="text-[11px] leading-none shrink-0" style={{ color: ink }} title={icon.label}>
          {icon.symbol}
        </span>
      </div>

      {/* Bottom strip: hex + company — always visible, frosted bg */}
      <div
        className="absolute bottom-0 left-0 right-0 flex justify-between items-center gap-1 px-1 py-0.5"
        style={{ background: labelBg }}
      >
        <span className="text-[10px] font-mono leading-none shrink-0" style={{ color: inkDim }}>
          {hasHex ? paint.hex : "—"}
        </span>
        <span className="text-[10px] leading-none truncate text-right flex-1" style={{ color: inkDim }}>
          {paint.company}
        </span>
      </div>
    </div>
  );
}
