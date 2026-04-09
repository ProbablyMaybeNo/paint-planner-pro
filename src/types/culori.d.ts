declare module "culori" {
  export type Color = Record<string, unknown> & { mode: string };

  export function parse(color: string): Color | undefined;
  export function formatHex(color: Color): string;
  export function converter(mode: string): (color: Color | string) => Record<string, number | undefined> & { mode: string };
  export function oklch(color: Color): { l: number; c: number; h: number; mode: string };
  export function differenceCiede2000(): (a: Color, b: Color) => number;
  export function differenceEuclidean(mode?: string): (a: Color, b: Color) => number;
}
