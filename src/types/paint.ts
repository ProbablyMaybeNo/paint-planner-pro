export type PaintType =
  | "opaque"
  | "transparent"
  | "wash"
  | "contrast"
  | "metallic"
  | "enamel"
  | "pigment"
  | "technical"
  | "varnish"
  | "base"
  | "layer"
  | "shade"
  | "dry"
  | "texture"
  | "air"
  | "oil"
  | "other"
  | "";

export interface Paint {
  id: number;
  name: string;
  company: string;
  line: string;
  type: PaintType;
  hex: string;
  source: string;
}

export type HarmonyMode =
  | "analogous"
  | "monochromatic"
  | "triad"
  | "complementary"
  | "split-complementary"
  | "square"
  | "compound"
  | "shades";

export interface ColorStop {
  id: string;
  hue: number;       // 0–360
  saturation: number; // 0–100
  lightness: number;  // 0–100
  isPrimary?: boolean;
}
