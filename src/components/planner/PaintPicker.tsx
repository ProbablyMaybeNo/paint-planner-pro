"use client";

import { useState, useEffect, useRef } from "react";
import { getPaintsSync, loadPaints, filterPaints } from "@/lib/paints";
import type { Paint } from "@/types/paint";

interface PaintPickerProps {
  onSelect: (paint: Paint) => void;
  onClose: () => void;
}

export default function PaintPicker({ onSelect, onClose }: PaintPickerProps) {
  const [query, setQuery] = useState("");
  const [paints, setPaints] = useState<Paint[]>(getPaintsSync());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (paints.length === 0) {
      loadPaints().then(setPaints);
    }
  }, [paints.length]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const results = query.length >= 2
    ? filterPaints(paints, { search: query, hexOnly: true }).slice(0, 12)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-bg border border-green/60 box-glow w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <span className="text-green text-[10px] tracking-widest shrink-0">SEARCH PAINT</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="name, company, hex..."
            className="flex-1 text-xs bg-transparent outline-none border-none text-green placeholder:text-green-dim"
          />
          <button onClick={onClose} className="text-green-dim hover:text-green text-xs">✕</button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {query.length < 2 ? (
            <div className="px-3 py-5 text-[10px] text-green-dim text-center">
              TYPE TO SEARCH<span className="blink">_</span>
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-5 text-[10px] text-green-dim text-center">NO MATCH</div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                className="w-full flex items-center gap-2 px-3 py-1.5 border-b border-border/30 hover:bg-green-faint text-left transition-colors"
                onClick={() => { onSelect(p); onClose(); }}
              >
                <div
                  className="w-5 h-5 border border-border/60 shrink-0"
                  style={{ backgroundColor: p.hex }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-green truncate">{p.name}</div>
                  <div className="text-[8px] text-green-dim">{p.company}</div>
                </div>
                <span className="text-[9px] text-green-dim font-mono shrink-0">{p.hex}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
