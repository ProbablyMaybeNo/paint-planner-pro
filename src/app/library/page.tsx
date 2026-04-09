"use client";

import { useEffect, useState, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loadPaints, filterPaints, getCompanies, getLines } from "@/lib/paints";
import type { Paint } from "@/types/paint";
import PaintCard from "@/components/ui/PaintCard";
import FilterPanel from "@/components/library/FilterPanel";
import HueFilter from "@/components/library/HueFilter";
import CompareTray from "@/components/library/CompareTray";
import TypeLegend from "@/components/ui/TypeLegend";
import TerminalBox from "@/components/ui/TerminalBox";

const PAGE_SIZE = 240;

function LibraryPageInner() {
  const searchParams = useSearchParams();
  const [paints, setPaints] = useState<Paint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(
    searchParams.get("company") ? [searchParams.get("company")!] : []
  );
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [hexOnly, setHexOnly] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Paint | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [activeHue, setActiveHueState] = useState("");
  const [hueMin, setHueMin] = useState(0);
  const [hueMax, setHueMax] = useState(360);
  const [sortBy, setSortBy] = useState<"name" | "hue" | "company">("hue");
  const [compareTray, setCompareTray] = useState<Paint[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPaints().then((data) => {
      setPaints(data);
      setLoading(false);
    });
  }, []);

  const companies = useMemo(() => getCompanies(paints), [paints]);
  const lines = useMemo(
    () => selectedCompanies.length === 1 ? getLines(paints, selectedCompanies[0]) : [],
    [paints, selectedCompanies]
  );

  const filtered = useMemo(() => {
    const base = filterPaints(paints, {
      search,
      companies: selectedCompanies.length > 0 ? selectedCompanies : undefined,
      lines: selectedLines.length > 0 ? selectedLines : undefined,
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      hexOnly,
      hueMin: activeHue ? hueMin : undefined,
      hueMax: activeHue ? hueMax : undefined,
    });

    // Sort
    if (sortBy === "name") {
      return [...base].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "company") {
      return [...base].sort((a, b) => a.company.localeCompare(b.company) || a.name.localeCompare(b.name));
    } else {
      // Sort by hue (colors grouped together)
      return [...base].sort((a, b) => {
        const getHue = (hex: string) => {
          if (!hex || !hex.startsWith("#")) return 999;
          const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b2 = parseInt(hex.slice(5,7),16)/255;
          const max = Math.max(r,g,b2), min = Math.min(r,g,b2);
          if (max === min) return 360; // greys at end
          const d = max - min;
          let h = 0;
          if (max === r) h = ((g - b2) / d + (g < b2 ? 6 : 0)) / 6;
          else if (max === g) h = ((b2 - r) / d + 2) / 6;
          else h = ((r - g) / d + 4) / 6;
          return h * 360;
        };
        return getHue(a.hex) - getHue(b.hex);
      });
    }
  }, [paints, search, selectedCompanies, selectedLines, selectedTypes, hexOnly, activeHue, hueMin, hueMax, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const handleSelectedCompanies = useCallback((v: string[]) => { setSelectedCompanies(v); setSelectedLines([]); setPage(1); }, []);
  const handleSelectedLines = useCallback((v: string[]) => { setSelectedLines(v); setPage(1); }, []);
  const handleSelectedTypes = useCallback((v: string[]) => { setSelectedTypes(v); setPage(1); }, []);

  const setActiveHue = useCallback((seg: string, min: number, max: number) => {
    setActiveHueState(seg);
    setHueMin(min);
    setHueMax(max);
    setPage(1);
  }, []);

  const clearHue = useCallback(() => {
    setActiveHueState("");
    setHueMin(0);
    setHueMax(360);
    setPage(1);
  }, []);

  const handleCopy = useCallback((paint: Paint, e: React.MouseEvent) => {
    e.stopPropagation();
    if (paint.hex) {
      navigator.clipboard.writeText(paint.hex).catch(() => {});
      setCopied(paint.id);
      setTimeout(() => setCopied(null), 1500);
    }
  }, []);

  const handleCardClick = useCallback((paint: Paint) => {
    setSelected((prev) => prev?.id === paint.id ? null : paint);
  }, []);

  const addToCompare = useCallback((paint: Paint, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompareTray((prev) => {
      if (prev.some((p) => p.id === paint.id) || prev.length >= 6) return prev;
      return [...prev, paint];
    });
  }, []);

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex flex-col h-full" style={{ height: "calc(100vh - 80px)" }}>
      {/* Header bar */}
      <div className="border-b border-border px-4 py-2 flex items-center gap-3 flex-shrink-0">
        <span className="text-green glow-green text-base tracking-widest font-semibold whitespace-nowrap">
          ┌─[ PAINT DATABASE ]
        </span>
        <div className="flex-1 relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-green-dim text-[13px]">SEARCH:</span>
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="name, company, line, or #hex... (press / to focus)"
            className="w-full pl-16 pr-3 py-1 text-xs"
          />
        </div>
        {/* Sort — desktop only */}
        <div className="hidden sm:flex gap-1 items-center flex-shrink-0">
          <span className="text-green-dim text-[13px]">SORT:</span>
          {(["hue", "name", "company"] as const).map((s) => (
            <button
              key={s}
              className={`btn-terminal text-xs px-2 py-0.5 ${sortBy === s ? "active" : ""}`}
              onClick={() => setSortBy(s)}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        {/* Filter toggle — mobile */}
        <button
          className="md:hidden btn-terminal text-xs px-2 py-0.5 flex-shrink-0"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          {sidebarOpen ? "✕ FILTERS" : "☰ FILTERS"}
        </button>
        <span className="text-green-dim text-[13px] whitespace-nowrap">
          {loading ? "LOADING..." : `${filtered.length.toLocaleString()} / ${paints.length.toLocaleString()} PAINTS`}
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? "block absolute z-40 bg-bg left-0 top-0 h-full" : "hidden"} md:block w-44 border-r border-border p-3 overflow-y-auto flex-shrink-0 space-y-4`}>
          {!loading && (
            <>
              <FilterPanel
                companies={companies}
                selectedCompanies={selectedCompanies}
                setSelectedCompanies={handleSelectedCompanies}
                lines={lines}
                selectedLines={selectedLines}
                setSelectedLines={handleSelectedLines}
                selectedTypes={selectedTypes}
                setSelectedTypes={handleSelectedTypes}
                hexOnly={hexOnly}
                setHexOnly={setHexOnly}
                resultCount={filtered.length}
                totalCount={paints.length}
              />
              <HueFilter
                activeHue={activeHue}
                setActiveHue={setActiveHue}
                clearHue={clearHue}
              />
            </>
          )}
        </div>

        {/* Main grid area */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <span className="text-green-dim text-sm tracking-widest">
                LOADING PAINT DATABASE<span className="blink">_</span>
              </span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <span className="text-green-dim text-xs">NO RECORDS MATCH QUERY</span>
              <button className="btn-terminal text-[13px]" onClick={() => { setSearch(""); setSelectedCompanies([]); setSelectedLines([]); setSelectedTypes([]); clearHue(); }}>
                CLEAR ALL FILTERS
              </button>
            </div>
          ) : (
            <div className="p-3">
              {/* Company group headers when sorting by company */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11 gap-1">
                {paginated.map((paint) => (
                  <div key={paint.id} className="relative group">
                    <PaintCard
                      paint={paint}
                      onClick={handleCardClick}
                      selected={selected?.id === paint.id}
                    />
                    {/* Copy hex button */}
                    {paint.hex && (
                      <button
                        onClick={(e) => handleCopy(paint, e)}
                        className="absolute top-0.5 left-0.5 text-sm opacity-0 group-hover:opacity-90 hover:!opacity-100 transition-opacity bg-black/70 px-0.5"
                        style={{ color: copied === paint.id ? "#00e5ff" : "rgba(255,255,255,0.8)" }}
                        title="Copy hex"
                      >
                        {copied === paint.id ? "✓" : "⎘"}
                      </button>
                    )}
                    {/* Compare button */}
                    <button
                      onClick={(e) => addToCompare(paint, e)}
                      className="absolute bottom-6 right-0.5 text-[7px] opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity bg-black/70 px-0.5"
                      style={{ color: compareTray.some(p => p.id === paint.id) ? "#00e5ff" : "rgba(255,255,255,0.6)" }}
                      title="Add to compare"
                    >
                      {compareTray.some(p => p.id === paint.id) ? "✓" : "+"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 mb-2">
                  <button className="btn-terminal text-[13px] px-3" disabled={page === 1} onClick={() => setPage(1)}>◄◄</button>
                  <button className="btn-terminal text-[13px] px-3" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>◄ PREV</button>
                  <span className="text-green-dim text-[13px] px-2">
                    {page} / {totalPages} &nbsp;·&nbsp; {((page-1)*PAGE_SIZE+1).toLocaleString()}–{Math.min(page*PAGE_SIZE, filtered.length).toLocaleString()} of {filtered.length.toLocaleString()}
                  </span>
                  <button className="btn-terminal text-[13px] px-3" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>NEXT ►</button>
                  <button className="btn-terminal text-[13px] px-3" disabled={page === totalPages} onClick={() => setPage(totalPages)}>►►</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-52 border-l border-border p-3 overflow-y-auto flex-shrink-0">
            <TerminalBox title="DETAIL" compact>
              <div
                className="w-full h-20 mb-3 border border-border flex flex-col justify-end p-1.5"
                style={{ backgroundColor: selected.hex || "#1a1a1a" }}
              >
                <span className="text-[13px] font-mono" style={{ color: "rgba(255,255,255,0.75)" }}>
                  {selected.hex || "NO HEX"}
                </span>
              </div>

              <div className="text-[13px] text-green font-semibold mb-2 leading-tight">{selected.name}</div>

              <div className="text-sm text-green-dim space-y-0.5 mb-3">
                <div>CO: <span className="text-green">{selected.company}</span></div>
                {selected.line && <div>LINE: <span className="text-green">{selected.line}</span></div>}
                <div>HEX: <span className="text-green font-mono">{selected.hex || "—"}</span></div>
              </div>

              <div className="flex flex-col gap-1.5">
                {selected.hex && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(selected.hex).catch(() => {}); setCopied(selected.id); setTimeout(() => setCopied(null), 1500); }}
                    className="btn-terminal text-[13px] w-full"
                  >
                    {copied === selected.id ? "✓ COPIED" : "⎘ COPY HEX"}
                  </button>
                )}
                <a href={`/match?hex=${encodeURIComponent(selected.hex || "")}`} className="btn-terminal text-[13px] text-center block">
                  FIND MATCHES →
                </a>
                <a href={`/wheel?hex=${encodeURIComponent(selected.hex || "")}`} className="btn-terminal btn-cyan text-[13px] text-center block">
                  COLOUR WHEEL →
                </a>
              </div>
            </TerminalBox>
          </div>
        )}
      </div>

      {/* Compare tray */}
      <CompareTray
        paints={compareTray}
        onRemove={(id) => setCompareTray((prev) => prev.filter((p) => p.id !== id))}
        onClear={() => setCompareTray([])}
      />

      {/* Legend */}
      <div className="border-t border-border px-4 py-1.5 flex-shrink-0">
        <TypeLegend />
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center flex-1">
        <span className="text-green-dim text-xs">LOADING<span className="blink">_</span></span>
      </div>
    }>
      <LibraryPageInner />
    </Suspense>
  );
}
