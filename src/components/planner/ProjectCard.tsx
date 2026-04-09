"use client";

import {
  STATUS_LABELS, STATUS_COLORS,
  PROJECT_TYPE_LABELS, PROJECT_TYPE_ICONS,
  PRIORITY_COLORS, PRIORITY_LABELS,
  getProgressPct,
} from "@/lib/plannerStore";
import type { Project } from "@/types/planner";

interface ProjectCardProps {
  project: Project;
  parentName?: string;
  onClick: (project: Project) => void;
}

export default function ProjectCard({ project, parentName, onClick }: ProjectCardProps) {
  const statusColor = STATUS_COLORS[project.status];
  const pct = getProgressPct(project);

  return (
    <div
      className="border border-border hover:border-green cursor-pointer transition-colors bg-bg group"
      onClick={() => onClick(project)}
    >
      {/* Palette strip */}
      <div className="flex h-10">
        {project.palette.length > 0 ? (
          project.palette.map((slot, i) => (
            <div
              key={i}
              className="flex-1 h-full"
              style={{ backgroundColor: slot.hex }}
              title={slot.paintName || slot.hex}
            />
          ))
        ) : (
          <div className="flex-1 h-full bg-surface-2 flex items-center justify-center">
            <span className="text-green-dim text-[9px] tracking-wider">NO PALETTE</span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-2 space-y-1.5">
        <div className="flex items-start justify-between gap-1">
          <span className="text-[13px] text-green font-semibold leading-tight truncate flex-1">
            {project.name}
          </span>
          <span className="text-[10px] text-green-dim shrink-0 mt-0.5">
            {PROJECT_TYPE_ICONS[project.type]}
          </span>
        </div>

        {parentName && (
          <div className="text-[10px] text-green-dim truncate">↳ {parentName}</div>
        )}

        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
          <span className="text-[10px] truncate" style={{ color: statusColor }}>
            {STATUS_LABELS[project.status]}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-surface-2 border border-border/20">
          <div
            className="h-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: statusColor }}
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[10px]" style={{ color: PRIORITY_COLORS[project.priority] }}>
            {PRIORITY_LABELS[project.priority]}
          </span>
          <span className="text-[10px] text-green-dim">
            {project.modelsCompleted}/{project.modelCount}
          </span>
        </div>
      </div>
    </div>
  );
}
