export type Priority = "low" | "med" | "high";

export type ModelStatus =
  | "planned"
  | "primed"
  | "base"
  | "shaded"
  | "highlighted"
  | "edge"
  | "complete";

export type LayerRole =
  | "undercoat"
  | "basecoat"
  | "shade"
  | "layer"
  | "highlight"
  | "edge-highlight"
  | "glaze"
  | "drybrush"
  | "detail"
  | "varnish";

export type SilhouetteType = "infantry" | "vehicle" | "monster" | "terrain";

export type BodyZone =
  // Infantry
  | "head" | "torso" | "left-arm" | "right-arm" | "left-leg" | "right-leg" | "base" | "weapon"
  // Vehicle
  | "hull" | "turret" | "tracks" | "gun" | "hatch" | "vehicle-base"
  // Monster
  | "head-m" | "body" | "wings" | "tail" | "claws" | "creature-base"
  // Terrain
  | "structure" | "ground" | "details" | "flora" | "rubble" | "terrain-base";

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
  status: ModelStatus;
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
