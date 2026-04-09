export type Priority = "low" | "med" | "high";

export type ProjectType = "model" | "unit" | "army" | "terrain";

export type ProjectStatus =
  | "built"
  | "primed"
  | "undercoated"
  | "basecoated"
  | "shaded"
  | "highlighted"
  | "detailed"
  | "edge-highlighted"
  | "completed";

export type PaletteLayer =
  | "undercoat"
  | "basecoat"
  | "midcoat"
  | "highlight"
  | "shade"
  | "edge-highlight"
  | "detail";

export interface PaletteSlot {
  hex: string;
  paintName: string;
  paintId: number | null;
  layer: PaletteLayer | "";
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  modelCount: number;
  modelsCompleted: number;
  status: ProjectStatus;
  priority: Priority;
  images: string[];
  palette: PaletteSlot[];
  parentId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ── Legacy types kept for cloud sync compatibility ──
export type LayerRole =
  | "undercoat" | "basecoat" | "shade" | "layer" | "highlight"
  | "edge-highlight" | "glaze" | "drybrush" | "detail" | "varnish";

export type SilhouetteType = "infantry" | "vehicle" | "monster" | "terrain";
export type BodyZone = string;

export interface SchemeLayer {
  id: string;
  role: LayerRole;
  paintId: number | null;
  paintHex: string;
  paintName: string;
  notes: string;
  zone: BodyZone | null;
  done: boolean;
}

export interface PaintScheme {
  id: string;
  name: string;
  layers: SchemeLayer[];
  createdAt: string;
}

export interface Model {
  id: string;
  name: string;
  silhouetteType: SilhouetteType;
  status: string;
  priority: Priority;
  schemeId: string | null;
  brainstorm: string[];
  notes: string;
  createdAt: string;
}

export interface Unit {
  id: string;
  name: string;
  models: Model[];
  priority: Priority;
  notes: string;
  createdAt: string;
}

export interface Army {
  id: string;
  name: string;
  faction: string;
  units: Unit[];
  schemes: PaintScheme[];
  priority: Priority;
  notes: string;
  createdAt: string;
}
