"use client";

import type { Paint, PaintType } from "@/types/paint";

let _cache: Paint[] | null = null;

/** Load paints from static JSON (cached in memory) */
export async function loadPaints(): Promise<Paint[]> {
  if (_cache) return _cache;
  const res = await fetch("/data/paints.json");
  const raw = await res.json();
  _cache = raw as Paint[];
  return _cache;
}

/** Get paints synchronously if already loaded */
export function getPaintsSync(): Paint[] {
  return _cache ?? [];
}

// Known Citadel wash/shade paint name fragments
const CITADEL_WASHES = new Set([
  "agrax earthshade", "nuln oil", "reikland fleshshade", "druchii violet",
  "carroburg crimson", "seraphim sepia", "fuegan orange", "biel-tan green",
  "athonian camoshade", "coelia greenshade", "casandora yellow", "bloodletter",
  "leviathan purple", "asurmen blue", "badab black", "baal red",
  "devlan mud", "gryphonne sepia", "ogryn flesh", "thraka green",
  "skavenblight dinge", "berserker bloodshade", "magos purple",
]);

// Known Citadel Contrast paint name fragments (partial)
const CITADEL_CONTRAST = new Set([
  "black templar", "blood angels red", "akhelian green", "apothecary white",
  "aethermatic blue", "aggaros dunes", "angron red", "astorath red",
  "basilicanum grey", "bilious green", "black legion", "creed camo",
  "dark angels green", "garaghak", "gore-grunta fur", "guilliman flesh",
  "gryph-charger grey", "gryph-hound orange", "imperial fists", "iron warriors",
  "iyanden yellow", "leviathan", "leviadon blue", "luxion purple",
  "magmadroth flame", "militarum green", "nazdreg yellow", "night lords blue",
  "ork flesh", "plaguebearer flesh", "pylar glacier", "shyish purple",
  "skeleton horde", "snakebite leather", "space wolves grey", "striking scorpion",
  "talassar blue", "terradon turquoise", "volupus pink", "warp lightning",
  "wyldwood",
]);

// Known Citadel Technical paint name fragments
const CITADEL_TECHNICAL = new Set([
  "ardcoat", "blood for the blood god", "nihilakh oxide", "typhus corrosion",
  "agrellan earth", "agrellan badland", "armageddon dust", "armageddon dunes",
  "astrogranite", "astrogranite debris", "martian ironearth", "martian ironcrust",
  "stirland mud", "stirland battlemire", "valhallan blizzard", "lustrian undergrowth",
  "waystone green", "spiritstone red", "mourn mountain snow", "contrast medium",
  "lahmian medium", "technical colour",
]);

// Known Citadel metallic name fragments
const CITADEL_METALLICS = new Set([
  "leadbelcher", "retributor armour", "liberator gold", "stormhost silver",
  "runefang steel", "ironbreaker", "auric armour gold", "brass scorpion",
  "balthasar gold", "hashut copper", "canoptek alloy", "fulgurite copper",
  "skullcrusher brass", "gehenna's gold", "warplock bronze", "tin bitz",
  "boltgun metal", "chainmail", "mithril silver",
]);

// Known Citadel Dry paint name fragments
const CITADEL_DRY = new Set([
  "baharroth blue", "ashen grey", "changeweed", "darkened bone",
  "etherium blue", "hexos palesun", "imrik blue", "krieg khaki",
  "longbeard grey", "necron compound", "nihilakh oxide dry",
  "payne", "praxeti white", "ryza rust", "skullcrusher dry",
  "stormfang", "terminatus stone", "underhive ash", "eldar flesh",
  "sylvaneth bark", "banshee brown",
]);

/** Infer paint type from line/name when explicit type is missing */
export function inferPaintType(paint: { type: string; line: string; name: string }): PaintType {
  if (paint.type) return paint.type as PaintType;

  const nameLower = paint.name.toLowerCase();
  const text = `${paint.line} ${nameLower}`;

  // Citadel-specific lookups (highest accuracy)
  if (paint.line.toLowerCase().includes("citadel") ||
      paint.name.toLowerCase().startsWith("citadel")) {
    // Check against known sets
    for (const frag of CITADEL_WASHES) {
      if (nameLower.includes(frag)) return "wash";
    }
    for (const frag of CITADEL_CONTRAST) {
      if (nameLower.includes(frag)) return "contrast";
    }
    for (const frag of CITADEL_TECHNICAL) {
      if (nameLower.includes(frag)) return "technical";
    }
    for (const frag of CITADEL_METALLICS) {
      if (nameLower.includes(frag)) return "metallic";
    }
    for (const frag of CITADEL_DRY) {
      if (nameLower.includes(frag)) return "dry";
    }
  }

  // Universal regex patterns
  if (/\boil\b|oil paint/i.test(text)) return "oil";
  if (/wash|shade|agrax|nuln|reikland|druchii|carroburg|camoshade|earthshade/i.test(text)) return "wash";
  if (/\bcontrast\b|speed paint|speed coat/i.test(text)) return "contrast";
  if (/metallic|\bmetal\b|\bgold\b|\bsilver\b|\bcopper\b|\bbronze\b|leadbelcher|retributor|liberator|stormhost|runefang|ironbreaker|auric|chainmail|boltgun/i.test(text))
    return "metallic";
  if (/\benamel\b/i.test(text)) return "enamel";
  if (/\bpigment\b/i.test(text)) return "pigment";
  if (/glaze|technical|ardcoat|lahmian|blood for|nihilakh|typhus|spiritstone|waystone/i.test(text)) return "technical";
  if (/varnish|lacquer|purity seal|matt coat|gloss coat|\bmatt\b finish/i.test(text)) return "varnish";
  if (/\bdry\b|drybrush|necron compound|ryza rust/i.test(text)) return "dry";
  if (/texture|agrellan|stirland|astrogranite|martian|armageddon|valhallan|lustrian/i.test(text)) return "texture";
  if (/\bair\b|airbrush/i.test(text)) return "air";
  if (/transparent|translucent|fluorescent|ink\b/i.test(text)) return "transparent";

  return "opaque";
}

export type PaintTypeIcon = { symbol: string; label: string; color: string };

export const PAINT_TYPE_ICONS: Record<PaintType | string, PaintTypeIcon> = {
  opaque:      { symbol: "○",  label: "Opaque",      color: "#00ff41" },
  transparent: { symbol: "◐",  label: "Transparent",  color: "#00e5ff" },
  wash:        { symbol: "≋",  label: "Wash",         color: "#4a9eff" },
  contrast:    { symbol: "◆",  label: "Contrast",     color: "#ff00ff" },
  metallic:    { symbol: "✦",  label: "Metallic",     color: "#ffd700" },
  enamel:      { symbol: "⬡",  label: "Enamel",       color: "#ff8c00" },
  pigment:     { symbol: "·",  label: "Pigment",      color: "#c8a060" },
  technical:   { symbol: "⊕",  label: "Technical",    color: "#00ffaa" },
  varnish:     { symbol: "◻",  label: "Varnish",      color: "#888888" },
  base:        { symbol: "■",  label: "Base",         color: "#00ff41" },
  layer:       { symbol: "□",  label: "Layer",        color: "#00ff41" },
  shade:       { symbol: "▼",  label: "Shade",        color: "#4a9eff" },
  dry:         { symbol: "~",  label: "Dry",          color: "#cccccc" },
  texture:     { symbol: "▓",  label: "Texture",      color: "#a0784a" },
  air:         { symbol: "≈",  label: "Air",          color: "#00e5ff" },
  oil:         { symbol: "◉",  label: "Oil",          color: "#ff8c00" },
  other:       { symbol: "?",  label: "Other",        color: "#666666" },
  "":          { symbol: "○",  label: "Paint",        color: "#00ff41" },
};

/** All unique companies from paint list */
export function getCompanies(paints: Paint[]): string[] {
  return [...new Set(paints.map((p) => p.company))].sort();
}

/** All unique lines from paint list (optionally filtered by company) */
export function getLines(paints: Paint[], company?: string): string[] {
  const filtered = company ? paints.filter((p) => p.company === company) : paints;
  return [...new Set(filtered.map((p) => p.line).filter(Boolean))].sort();
}

/** Filter paints by search, company, line, type */
export function filterPaints(
  paints: Paint[],
  opts: {
    search?: string;
    company?: string;
    line?: string;
    type?: string;
    hueMin?: number;
    hueMax?: number;
    hexOnly?: boolean;
  }
): Paint[] {
  let result = paints;

  if (opts.hexOnly) {
    result = result.filter((p) => p.hex && p.hex.startsWith("#"));
  }

  if (opts.search) {
    const q = opts.search.trim().toLowerCase();
    // Hex search: "#FF" or "FF8C" style prefix
    if (q.startsWith("#") || /^[0-9a-f]{2,6}$/i.test(q)) {
      const hexQ = q.startsWith("#") ? q : `#${q}`;
      result = result.filter((p) => p.hex.toLowerCase().startsWith(hexQ.toLowerCase()));
    } else {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.company.toLowerCase().includes(q) ||
          p.line.toLowerCase().includes(q)
      );
    }
  }

  if (opts.company) {
    result = result.filter((p) => p.company === opts.company);
  }

  if (opts.line) {
    result = result.filter((p) => p.line === opts.line);
  }

  if (opts.type) {
    result = result.filter((p) => inferPaintType(p) === opts.type);
  }

  if (opts.hueMin !== undefined && opts.hueMax !== undefined && (opts.hueMin > 0 || opts.hueMax < 360)) {
    result = result.filter((p) => {
      if (!p.hex || !p.hex.startsWith("#")) return false;
      const hsl = hexToHslSimple(p.hex);
      if (!hsl) return false;
      const { h } = hsl;
      if (opts.hueMin! <= opts.hueMax!) {
        return h >= opts.hueMin! && h <= opts.hueMax!;
      }
      // Wrap-around (e.g. 330–30 red range)
      return h >= opts.hueMin! || h <= opts.hueMax!;
    });
  }

  return result;
}

/** Lightweight HSL conversion (no culori, for filtering) */
function hexToHslSimple(hex: string): { h: number; s: number; l: number } | null {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}
