"use client";

import type { Army, Model, Unit, PaintScheme, SchemeLayer, LayerRole, Priority, ModelStatus, SilhouetteType } from "@/types/planner";

const STORAGE_KEY = "ppp_armies";

export function loadArmies(): Army[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveArmies(armies: Army[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(armies));
}

export function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createArmy(name: string): Army {
  return {
    id: makeId(),
    name,
    faction: "",
    units: [],
    schemes: [],
    priority: "med",
    notes: "",
    createdAt: new Date().toISOString(),
  };
}

export function createUnit(name: string): Unit {
  return {
    id: makeId(),
    name,
    models: [],
    priority: "med",
    notes: "",
    createdAt: new Date().toISOString(),
  };
}

export function createModel(name: string, silhouetteType: SilhouetteType = "infantry"): Model {
  return {
    id: makeId(),
    name,
    silhouetteType,
    status: "planned",
    priority: "med",
    schemeId: null,
    brainstorm: [],
    notes: "",
    createdAt: new Date().toISOString(),
  };
}

export function createScheme(name: string): PaintScheme {
  return {
    id: makeId(),
    name,
    layers: [],
    createdAt: new Date().toISOString(),
  };
}

export function createLayer(role: LayerRole): SchemeLayer {
  return {
    id: makeId(),
    role,
    paintId: null,
    paintHex: "",
    paintName: "",
    notes: "",
    zone: null,
    done: false,
  };
}

export const LAYER_ROLES: LayerRole[] = [
  "undercoat", "basecoat", "shade", "layer", "highlight", "edge-highlight", "glaze", "drybrush", "detail", "varnish",
];

export const STATUS_FLOW: ModelStatus[] = [
  "planned", "primed", "base", "shaded", "highlighted", "edge", "complete",
];

export const STATUS_LABELS: Record<ModelStatus, string> = {
  planned:     "PLANNED",
  primed:      "PRIMED",
  base:        "BASE COATED",
  shaded:      "SHADED",
  highlighted: "HIGHLIGHTED",
  edge:        "EDGE HIGHLIGHTED",
  complete:    "COMPLETE",
};

export const STATUS_COLORS: Record<ModelStatus, string> = {
  planned:     "#444444",
  primed:      "#888888",
  base:        "#00ff41",
  shaded:      "#4a9eff",
  highlighted: "#ff8c00",
  edge:        "#ff00ff",
  complete:    "#00ffaa",
};

export const PRIORITY_ICONS: Record<Priority, string> = {
  low:  "[■□□]",
  med:  "[■■□]",
  high: "[■■■]",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low:  "#444",
  med:  "#ff8c00",
  high: "#ff3131",
};

export function getModelProgress(model: Model, armies: Army[]): number {
  const statusIdx = STATUS_FLOW.indexOf(model.status);
  return Math.round((statusIdx / (STATUS_FLOW.length - 1)) * 100);
}

export function getScheme(armies: Army[], armyId: string, schemeId: string): PaintScheme | null {
  const army = armies.find((a) => a.id === armyId);
  return army?.schemes.find((s) => s.id === schemeId) ?? null;
}
