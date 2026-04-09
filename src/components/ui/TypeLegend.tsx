import { PAINT_TYPE_ICONS } from "@/lib/paints";

const LEGEND_TYPES = [
  "opaque", "transparent", "wash", "contrast", "metallic",
  "enamel", "pigment", "technical", "oil", "dry", "air", "varnish",
] as const;

export default function TypeLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {LEGEND_TYPES.map((type) => {
        const icon = PAINT_TYPE_ICONS[type];
        return (
          <span key={type} className="flex items-center gap-1 text-[10px] text-green-dim">
            <span style={{ color: icon.color }} className="text-[11px]">{icon.symbol}</span>
            {icon.label}
          </span>
        );
      })}
    </div>
  );
}
