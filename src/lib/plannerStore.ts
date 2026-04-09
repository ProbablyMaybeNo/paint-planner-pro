"use client";

import type { Project, ProjectType, ProjectStatus, Priority, PaletteLayer } from "@/types/planner";

const STORAGE_KEY = "ppp_projects_v2";

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createProject(name: string, type: ProjectType): Project {
  return {
    id: makeId(),
    name,
    type,
    modelCount: 1,
    modelsCompleted: 0,
    status: "built",
    priority: "med",
    images: [],
    palette: [],
    parentId: null,
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const PROJECT_TYPES: ProjectType[] = ["model", "unit", "army", "terrain"];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  model: "MODEL",
  unit: "UNIT",
  army: "ARMY",
  terrain: "TERRAIN",
};

export const PROJECT_TYPE_ICONS: Record<ProjectType, string> = {
  model: "◈",
  unit: "◈◈",
  army: "◈◈◈",
  terrain: "⬡",
};

export const STATUS_FLOW: ProjectStatus[] = [
  "built", "primed", "undercoated", "basecoated",
  "shaded", "highlighted", "detailed", "edge-highlighted", "completed",
];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  built: "BUILT",
  primed: "PRIMED",
  undercoated: "UNDERCOATED",
  basecoated: "BASECOATED",
  shaded: "SHADED",
  highlighted: "HIGHLIGHTED",
  detailed: "DETAILED",
  "edge-highlighted": "EDGE HIGHLIGHTED",
  completed: "COMPLETED",
};

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  built: "#555555",
  primed: "#888888",
  undercoated: "#aaaaaa",
  basecoated: "#00ff41",
  shaded: "#4a9eff",
  highlighted: "#ff8c00",
  detailed: "#ff00ff",
  "edge-highlighted": "#00ffaa",
  completed: "#ffffff",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "LOW",
  med: "MED",
  high: "HIGH",
};

export const PRIORITY_ICONS: Record<Priority, string> = {
  low: "[■□□]",
  med: "[■■□]",
  high: "[■■■]",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "#555",
  med: "#ff8c00",
  high: "#ff3131",
};

export const PALETTE_LAYERS: PaletteLayer[] = [
  "undercoat", "basecoat", "midcoat", "highlight",
  "shade", "edge-highlight", "detail",
];

export const PALETTE_LAYER_LABELS: Record<PaletteLayer, string> = {
  undercoat: "UNDERCOAT",
  basecoat: "BASECOAT",
  midcoat: "MIDCOAT",
  highlight: "HIGHLIGHT",
  shade: "SHADE",
  "edge-highlight": "EDGE HIGHLIGHT",
  detail: "DETAIL",
};

export function getStatusIndex(status: ProjectStatus): number {
  return STATUS_FLOW.indexOf(status);
}

export function getProgressPct(project: Project): number {
  const statusPct = Math.round((getStatusIndex(project.status) / (STATUS_FLOW.length - 1)) * 100);
  const modelPct = project.modelCount > 0
    ? Math.round((project.modelsCompleted / project.modelCount) * 100)
    : 0;
  // Average of status progress and model completion
  return Math.round((statusPct + modelPct) / 2);
}
