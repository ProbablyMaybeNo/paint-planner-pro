"use client";

import type { BodyZone, SilhouetteType } from "@/types/planner";

interface ZoneData {
  id: BodyZone;
  label: string;
  path: string;
}

const INFANTRY_ZONES: ZoneData[] = [
  { id: "head",      label: "HEAD",      path: "M 60,10 a 20,20 0 1,0 40,0 a 20,20 0 1,0 -40,0" },
  { id: "torso",     label: "TORSO",     path: "M 45,50 L 55,50 L 65,110 L 95,110 L 105,50 L 115,50 L 110,40 L 90,30 L 70,30 L 50,40 Z" },
  { id: "left-arm",  label: "L-ARM",     path: "M 45,50 L 30,55 L 20,90 L 28,92 L 38,58 L 52,54 Z" },
  { id: "right-arm", label: "R-ARM",     path: "M 115,50 L 130,55 L 140,90 L 132,92 L 122,58 L 108,54 Z" },
  { id: "left-leg",  label: "L-LEG",     path: "M 65,110 L 58,115 L 52,170 L 68,172 L 70,130 L 80,115 Z" },
  { id: "right-leg", label: "R-LEG",     path: "M 95,110 L 100,115 L 110,115 L 108,170 L 92,172 L 90,130 Z" },
  { id: "weapon",    label: "WEAPON",    path: "M 140,60 L 145,55 L 165,75 L 165,80 L 150,80 L 140,65 Z" },
  { id: "base",      label: "BASE",      path: "M 40,175 L 120,175 L 125,185 L 35,185 Z" },
];

const VEHICLE_ZONES: ZoneData[] = [
  { id: "turret",       label: "TURRET",   path: "M 50,20 L 110,20 L 115,45 L 45,45 Z" },
  { id: "gun",          label: "GUN",      path: "M 110,28 L 170,30 L 170,36 L 110,34 Z" },
  { id: "hull",         label: "HULL",     path: "M 25,45 L 135,45 L 150,65 L 145,95 L 15,95 L 10,65 Z" },
  { id: "hatch",        label: "HATCH",    path: "M 60,22 L 100,22 L 100,44 L 60,44 Z" },
  { id: "tracks",       label: "TRACKS",   path: "M 15,90 L 145,90 L 150,115 L 10,115 Z" },
  { id: "vehicle-base", label: "BASE",     path: "M 10,115 L 150,115 L 155,125 L 5,125 Z" },
];

const MONSTER_ZONES: ZoneData[] = [
  { id: "head-m",        label: "HEAD",   path: "M 55,5 L 105,5 L 120,30 L 40,30 Z" },
  { id: "body",          label: "BODY",   path: "M 35,30 L 125,30 L 130,100 L 30,100 Z" },
  { id: "wings",         label: "WINGS",  path: "M 10,35 L 35,35 L 30,70 L 5,65 Z M 125,35 L 150,35 L 155,65 L 130,70 Z" },
  { id: "claws",         label: "CLAWS",  path: "M 30,95 L 45,95 L 40,125 L 25,125 Z M 115,95 L 130,95 L 135,125 L 120,125 Z" },
  { id: "tail",          label: "TAIL",   path: "M 70,100 L 90,100 L 100,140 L 60,140 Z" },
  { id: "creature-base", label: "BASE",   path: "M 20,140 L 140,140 L 145,155 L 15,155 Z" },
];

const TERRAIN_ZONES: ZoneData[] = [
  { id: "structure",    label: "STRUCTURE", path: "M 20,10 L 140,10 L 145,80 L 15,80 Z" },
  { id: "details",      label: "DETAILS",   path: "M 35,20 L 65,20 L 65,40 L 35,40 Z M 95,20 L 125,20 L 125,40 L 95,40 Z" },
  { id: "rubble",       label: "RUBBLE",    path: "M 10,100 L 50,90 L 70,100 L 55,115 L 15,112 Z M 95,92 L 140,100 L 148,112 L 98,115 Z" },
  { id: "flora",        label: "FLORA",     path: "M 60,60 L 100,60 L 110,80 L 50,80 Z" },
  { id: "ground",       label: "GROUND",    path: "M 5,115 L 155,115 L 158,130 L 2,130 Z" },
  { id: "terrain-base", label: "BASE",      path: "M 5,130 L 155,130 L 158,145 L 2,145 Z" },
];

const SILHOUETTE_DATA: Record<SilhouetteType, { zones: ZoneData[]; viewBox: string; label: string }> = {
  infantry: { zones: INFANTRY_ZONES, viewBox: "0 0 170 190", label: "INFANTRY" },
  vehicle:  { zones: VEHICLE_ZONES,  viewBox: "0 0 165 130", label: "VEHICLE" },
  monster:  { zones: MONSTER_ZONES,  viewBox: "0 0 165 160", label: "CREATURE" },
  terrain:  { zones: TERRAIN_ZONES,  viewBox: "0 0 165 150", label: "TERRAIN" },
};

interface BodySilhouetteProps {
  type: SilhouetteType;
  zoneColors: Partial<Record<BodyZone, string>>;
  activeZone: BodyZone | null;
  onZoneClick: (zone: BodyZone) => void;
}

export default function BodySilhouette({ type, zoneColors, activeZone, onZoneClick }: BodySilhouetteProps) {
  const { zones, viewBox, label } = SILHOUETTE_DATA[type];

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm text-green-dim tracking-widest mb-1">{label} DIAGRAM</div>
      <svg
        viewBox={viewBox}
        className="w-full max-w-[160px]"
        style={{ filter: "drop-shadow(0 0 4px rgba(0,255,65,0.2))" }}
      >
        {zones.map((zone) => {
          const hex = zoneColors[zone.id];
          const isActive = activeZone === zone.id;
          return (
            <g key={zone.id} onClick={() => onZoneClick(zone.id)} className="cursor-pointer">
              <path
                d={zone.path}
                fill={hex || "rgba(0,255,65,0.05)"}
                stroke={isActive ? "#00e5ff" : hex ? "rgba(255,255,255,0.3)" : "rgba(0,255,65,0.4)"}
                strokeWidth={isActive ? 1.5 : 0.75}
                style={{
                  filter: isActive ? "drop-shadow(0 0 4px #00e5ff)" : hex ? "none" : "none",
                  transition: "all 0.15s ease",
                }}
              />
              {/* Zone label */}
            </g>
          );
        })}
      </svg>
      {/* Zone labels below */}
      <div className="mt-1 flex flex-wrap justify-center gap-1">
        {zones.map((zone) => {
          const hex = zoneColors[zone.id];
          return (
            <button
              key={zone.id}
              onClick={() => onZoneClick(zone.id)}
              className={`text-sm px-1 py-0.5 border transition-all
                ${activeZone === zone.id
                  ? "border-cyan text-cyan"
                  : hex
                    ? "border-green/40 text-green"
                    : "border-border text-green-dim"
                }`}
            >
              {zone.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
