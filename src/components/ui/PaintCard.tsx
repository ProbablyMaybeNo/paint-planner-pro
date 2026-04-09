"use client";

import { inferPaintType, PAINT_TYPE_ICONS } from "@/lib/paints";
import { isLightColor } from "@/lib/colors";
import type { Paint } from "@/types/paint";

interface PaintCardProps {
  paint: Paint;
  onClick?: (paint: Paint) => void;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function PaintCard({ paint, onClick, selected, size = "md" }: PaintCardProps) {
  const type = inferPaintType(paint);
  const icon = PAINT_TYPE_ICONS[type] ?? PAINT_TYPE_ICONS[""];
  const hasHex = paint.hex && paint.hex.startsWith("#");
  const isLight = hasHex ? isLightColor(paint.hex) : false;
  const textColor = isLight ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)";
  const dimColor = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";

  const sizeClasses = {
    sm: "h-20",
    md: "h-28",
    lg: "h-36",
  }[size];

  return (
    <div
      onClick={() => onClick?.(paint)}
      className={`
        relative flex flex-col cursor-pointer select-none
        border transition-all duration-150 group
        ${selected
          ? "border-cyan box-glow-cyan scale-[1.02]"
          : "border-border hover:border-green hover:box-glow"
        }
        ${onClick ? "cursor-pointer" : "cursor-default"}
      `}
    >
      {/* Color swatch */}
      <div
        className={`flex-1 ${sizeClasses} relative`}
        style={{ backgroundColor: hasHex ? paint.hex : "#1a1a1a" }}
      >
        {/* Type icon */}
        <span
          className="absolute top-1 right-1.5 text-[11px] font-semibold leading-none type-icon"
          style={{ color: hasHex ? (isLight ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)") : icon.color }}
          title={icon.label}
        >
          {icon.symbol}
        </span>

        {/* No hex placeholder */}
        {!hasHex && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-green-dim text-[10px]">NO HEX</span>
          </div>
        )}

        {/* Hex on hover */}
        {hasHex && (
          <span
            className="absolute bottom-1 left-1.5 text-[9px] font-mono opacity-0 group-hover:opacity-70 transition-opacity"
            style={{ color: textColor }}
          >
            {paint.hex}
          </span>
        )}
      </div>

      {/* Info strip */}
      <div className="bg-surface border-t border-border px-1.5 py-1">
        <div className="text-[10px] text-green leading-tight truncate font-medium" title={paint.name}>
          {paint.name}
        </div>
        <div className="text-[9px] text-green-dim leading-tight truncate flex justify-between">
          <span>{paint.company}</span>
          {paint.line && <span className="opacity-60">{paint.line}</span>}
        </div>
      </div>
    </div>
  );
}
