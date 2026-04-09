"use client";

import { PAINT_TYPE_ICONS, type PaintTypeIcon } from "@/lib/paints";
import type { Paint } from "@/types/paint";

const TYPE_FILTER_KEYS = [
  "opaque", "transparent", "wash", "contrast", "metallic",
  "enamel", "pigment", "oil", "technical", "dry", "air",
] as const;

interface FilterPanelProps {
  paints: Paint[];
  companies: string[];
  company: string;
  setCompany: (v: string) => void;
  line: string;
  setLine: (v: string) => void;
  lines: string[];
  paintType: string;
  setPaintType: (v: string) => void;
  hexOnly: boolean;
  setHexOnly: (v: boolean) => void;
  resultCount: number;
  totalCount: number;
}

export default function FilterPanel({
  companies,
  company,
  setCompany,
  line,
  setLine,
  lines,
  paintType,
  setPaintType,
  hexOnly,
  setHexOnly,
  resultCount,
  totalCount,
}: FilterPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="text-[13px] text-green-dim border-b border-border pb-3">
        <div className="text-green text-sm font-semibold glow-green">{resultCount.toLocaleString()}</div>
        <div>of {totalCount.toLocaleString()} records</div>
      </div>

      {/* Company */}
      <div>
        <div className="text-[13px] text-green-dim mb-1 tracking-widest">COMPANY</div>
        <select
          value={company}
          onChange={(e) => { setCompany(e.target.value); setLine(""); }}
          className="w-full text-xs bg-surface border-border"
        >
          <option value="">ALL</option>
          {companies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Line */}
      {lines.length > 0 && (
        <div>
          <div className="text-[13px] text-green-dim mb-1 tracking-widest">LINE</div>
          <select
            value={line}
            onChange={(e) => setLine(e.target.value)}
            className="w-full text-xs bg-surface border-border"
          >
            <option value="">ALL</option>
            {lines.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      )}

      {/* Paint Type */}
      <div>
        <div className="text-[13px] text-green-dim mb-2 tracking-widest">PAINT TYPE</div>
        <div className="flex flex-col gap-1">
          <button
            className={`btn-terminal text-left text-[13px] px-2 py-1 ${paintType === "" ? "active" : ""}`}
            onClick={() => setPaintType("")}
          >
            ◈ ALL TYPES
          </button>
          {TYPE_FILTER_KEYS.map((t) => {
            const icon = PAINT_TYPE_ICONS[t] as PaintTypeIcon;
            return (
              <button
                key={t}
                className={`btn-terminal text-left text-[13px] px-2 py-1 ${paintType === t ? "active" : ""}`}
                onClick={() => setPaintType(paintType === t ? "" : t)}
              >
                <span style={{ color: icon.color }}>{icon.symbol}</span>
                {" "}{icon.label.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hex only toggle */}
      <div>
        <button
          className={`btn-terminal text-[13px] w-full ${hexOnly ? "active" : ""}`}
          onClick={() => setHexOnly(!hexOnly)}
        >
          {hexOnly ? "[■]" : "[□]"} HEX DATA ONLY
        </button>
      </div>
    </div>
  );
}
