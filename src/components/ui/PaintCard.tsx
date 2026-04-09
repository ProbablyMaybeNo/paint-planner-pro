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
  const ink = isLight ? "rgba(0,0,0,0.80)" : "rgba(255,255,255,0.85)";
  const inkDim = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";

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
          <span className="text-green-dim text-[8px]">NO HEX</span>
        </div>
      )}

      {/* Top row: name left, type right */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-1 gap-0.5">
        <span
          className="text-[8px] font-medium leading-tight line-clamp-2 flex-1 min-w-0"
          style={{ color: ink }}
        >
          {paint.name}
        </span>
        <span
          className="text-[10px] leading-none shrink-0 ml-0.5"
          style={{ color: ink }}
          title={icon.label}
        >
          {icon.symbol}
        </span>
      </div>

      {/* Bottom row: hex left, company right — visible on hover */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end p-1 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {hasHex && (
          <span className="text-[7px] font-mono leading-none" style={{ color: inkDim }}>
            {paint.hex}
          </span>
        )}
        <span className="text-[7px] leading-none truncate text-right flex-1" style={{ color: inkDim }}>
          {paint.company}
        </span>
      </div>
    </div>
  );
}
