"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    if (paints.length === 0) {
      loadPaints().then(setPaints);
    }
  }, [paints.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const results = query.length >= 2
    ? filterPaints(paints, { search: query, hexOnly: true })
        .sort((a, b) => {
          const q = query.toLowerCase();
          const an = a.name.toLowerCase();
          const bn = b.name.toLowerCase();
          if (an === q && bn !== q) return -1;
          if (bn === q && an !== q) return 1;
          if (an.startsWith(q) && !bn.startsWith(q)) return -1;
          if (bn.startsWith(q) && !an.startsWith(q)) return 1;
          return an.localeCompare(bn);
        })
        .slice(0, 20)
    : [];

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div
        className="bg-bg border border-green/60 box-glow w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <span className="text-green text-[13px] tracking-widest shrink-0">SEARCH PAINT</span>
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

        <div className="max-h-72 overflow-y-auto">
          {query.length < 2 ? (
            <div className="px-3 py-5 text-[13px] text-green-dim text-center">
              TYPE TO SEARCH<span className="blink">_</span>
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-5 text-[13px] text-green-dim text-center">NO MATCH</div>
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
                  <div className="text-[13px] text-green truncate">{p.name}</div>
                  <div className="text-sm text-green-dim">{p.company}</div>
                </div>
                <span className="text-sm text-green-dim font-mono shrink-0">{p.hex}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
