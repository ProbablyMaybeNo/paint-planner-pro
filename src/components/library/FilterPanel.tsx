"use client";

import { PAINT_TYPE_ICONS, type PaintTypeIcon } from "@/lib/paints";

const TYPE_FILTER_KEYS = [
  "opaque", "transparent", "wash", "contrast", "metallic",
  "enamel", "pigment", "oil", "technical", "dry", "air",
] as const;

interface FilterPanelProps {
  companies: string[];
  selectedCompanies: string[];
  setSelectedCompanies: (v: string[]) => void;
  lines: string[];
  selectedLines: string[];
  setSelectedLines: (v: string[]) => void;
  selectedTypes: string[];
  setSelectedTypes: (v: string[]) => void;
  hexOnly: boolean;
  setHexOnly: (v: boolean) => void;
  resultCount: number;
  totalCount: number;
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export default function FilterPanel({
  companies,
  selectedCompanies,
  setSelectedCompanies,
  lines,
  selectedLines,
  setSelectedLines,
  selectedTypes,
  setSelectedTypes,
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

      {/* Company toggles */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[13px] text-green-dim tracking-widest">COMPANIES</span>
          {selectedCompanies.length > 0 && (
            <button
              className="text-[11px] text-red opacity-70 hover:opacity-100"
              onClick={() => setSelectedCompanies([])}
            >
              CLEAR
            </button>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          {companies.map((c) => (
            <button
              key={c}
              className={`btn-terminal text-left text-[13px] px-2 py-0.5 leading-snug ${selectedCompanies.includes(c) ? "active" : ""}`}
              onClick={() => setSelectedCompanies(toggle(selectedCompanies, c))}
            >
              {selectedCompanies.includes(c) ? "■" : "□"} {c}
            </button>
          ))}
        </div>
      </div>

      {/* Line toggles — only shown when exactly one company selected */}
      {selectedCompanies.length === 1 && lines.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] text-green-dim tracking-widest">LINE</span>
            {selectedLines.length > 0 && (
              <button
                className="text-[11px] text-red opacity-70 hover:opacity-100"
                onClick={() => setSelectedLines([])}
              >
                CLEAR
              </button>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            {lines.map((l) => (
              <button
                key={l}
                className={`btn-terminal text-left text-[13px] px-2 py-0.5 leading-snug ${selectedLines.includes(l) ? "active" : ""}`}
                onClick={() => setSelectedLines(toggle(selectedLines, l))}
              >
                {selectedLines.includes(l) ? "■" : "□"} {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paint Type toggles */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[13px] text-green-dim tracking-widest">PAINT TYPE</span>
          {selectedTypes.length > 0 && (
            <button
              className="text-[11px] text-red opacity-70 hover:opacity-100"
              onClick={() => setSelectedTypes([])}
            >
              CLEAR
            </button>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          {TYPE_FILTER_KEYS.map((t) => {
            const icon = PAINT_TYPE_ICONS[t] as PaintTypeIcon;
            return (
              <button
                key={t}
                className={`btn-terminal text-left text-[13px] px-2 py-0.5 ${selectedTypes.includes(t) ? "active" : ""}`}
                onClick={() => setSelectedTypes(toggle(selectedTypes, t))}
              >
                <span style={{ color: selectedTypes.includes(t) ? icon.color : undefined }}>
                  {selectedTypes.includes(t) ? "■" : "□"}
                  {" "}{icon.symbol}
                </span>
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
