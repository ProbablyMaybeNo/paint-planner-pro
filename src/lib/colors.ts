"use client";

import { parse, formatHex, oklch, converter, differenceEuclidean, differenceCiede2000 } from "culori";

const toOklch = converter("oklch");
const toLab = converter("lab");

/** Parse any hex string to a culori color object (or null if invalid) */
export function parseHex(hex: string) {
  if (!hex) return null;
  const cleaned = hex.startsWith("#") ? hex : `#${hex}`;
  return parse(cleaned) ?? null;
}

/** Convert h/s/l (0-360, 0-100, 0-100) to hex string */
export function hslToHex(h: number, s: number, l: number): string {
  const r = (v: number) => {
    const k = (v + h / 30) % 12;
    const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
    return l / 100 - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
  };
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${toHex(r(0))}${toHex(r(8))}${toHex(r(4))}`.toUpperCase();
}

/** Get HSL components from hex */
export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const c = parseHex(hex);
  if (!c) return null;
  const lab = toLab(c);
  if (!lab) return null;
  // Use culori hsl converter
  const toHsl = converter("hsl");
  const hsl = toHsl(c);
  if (!hsl) return null;
  return {
    h: hsl.h ?? 0,
    s: (hsl.s ?? 0) * 100,
    l: (hsl.l ?? 0) * 100,
  };
}

/** CIEDE2000 color difference between two hex strings (0 = identical) */
export function deltaE(hex1: string, hex2: string): number {
  const c1 = parseHex(hex1);
  const c2 = parseHex(hex2);
  if (!c1 || !c2) return Infinity;
  return differenceCiede2000()(c1, c2);
}

/** Find N closest paints to a target hex from a list */
export function findClosestPaints<T extends { hex: string }>(
  targetHex: string,
  paints: T[],
  n = 5,
  excludeHex?: string
): Array<{ paint: T; deltaE: number }> {
  const target = parseHex(targetHex);
  if (!target) return [];
  const diff = differenceCiede2000();

  const scored = paints
    .filter((p) => p.hex && p.hex !== excludeHex)
    .map((p) => {
      const c = parseHex(p.hex);
      if (!c) return null;
      return { paint: p, deltaE: diff(target, c) };
    })
    .filter((x): x is { paint: T; deltaE: number } => x !== null)
    .sort((a, b) => a.deltaE - b.deltaE);

  return scored.slice(0, n);
}

/** Color harmony: returns hue offsets for each mode */
export const HARMONY_CONFIGS: Record<
  string,
  { label: string; offsets: number[]; description: string }
> = {
  analogous: {
    label: "ANALOGOUS",
    offsets: [-30, 0, 30],
    description: "Adjacent hues — harmonious, natural",
  },
  monochromatic: {
    label: "MONOCHROMATIC",
    offsets: [0, 0, 0],
    description: "Same hue, varied lightness",
  },
  triad: {
    label: "TRIADIC",
    offsets: [0, 120, 240],
    description: "Three evenly spaced hues",
  },
  complementary: {
    label: "COMPLEMENTARY",
    offsets: [0, 180],
    description: "Opposite hues — high contrast",
  },
  "split-complementary": {
    label: "SPLIT COMP",
    offsets: [0, 150, 210],
    description: "Primary + two flanking complements",
  },
  square: {
    label: "SQUARE",
    offsets: [0, 90, 180, 270],
    description: "Four equally spaced hues",
  },
  compound: {
    label: "COMPOUND",
    offsets: [0, 30, 180, 210],
    description: "Complementary pair + analogous",
  },
  shades: {
    label: "SHADES",
    offsets: [0, 0, 0, 0, 0],
    description: "Single hue across lightness range",
  },
};

/** Calculate harmony stops given primary hue and mode */
export function getHarmonyColors(
  primaryHue: number,
  saturation: number,
  lightness: number,
  mode: string
): Array<{ hue: number; saturation: number; lightness: number; hex: string }> {
  const config = HARMONY_CONFIGS[mode];
  if (!config) return [];

  return config.offsets.map((offset, i) => {
    let h = (primaryHue + offset) % 360;
    if (h < 0) h += 360;
    let s = saturation;
    let l = lightness;

    if (mode === "monochromatic") {
      l = Math.max(10, Math.min(90, lightness + (i - 2) * 18));
      s = Math.max(20, saturation - i * 5);
    } else if (mode === "shades") {
      l = 15 + i * 17;
      s = Math.max(30, saturation - i * 5);
    }

    return { hue: h, saturation: s, lightness: l, hex: hslToHex(h, s, l) };
  });
}

/** Suggest painting technique colors based on a base hex */
export function getTechniqueColors(baseHex: string) {
  const hsl = hexToHsl(baseHex);
  if (!hsl) return null;
  const { h, s, l } = hsl;

  return {
    undercoat: hslToHex(h, Math.max(0, s - 20), Math.max(5, l - 35)),
    basecoat: baseHex,
    shade: hslToHex(h, Math.min(100, s + 15), Math.max(5, l - 25)),
    layer: hslToHex(h, Math.max(0, s - 10), Math.min(90, l + 10)),
    highlight: hslToHex(h, Math.max(0, s - 20), Math.min(95, l + 25)),
    edgeHighlight: hslToHex(h, Math.max(0, s - 35), Math.min(98, l + 40)),
    drybrush: hslToHex(h, Math.max(0, s - 30), Math.min(92, l + 30)),
  };
}

/** Is a hex color "light" (use dark text on it)? */
export function isLightColor(hex: string): boolean {
  const c = parseHex(hex);
  if (!c) return false;
  const lab = toLab(c);
  if (!lab) return false;
  return (lab.l ?? 0) > 55;
}
