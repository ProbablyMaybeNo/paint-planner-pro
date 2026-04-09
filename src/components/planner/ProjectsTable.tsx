"use client";

import {
  STATUS_LABELS, STATUS_COLORS,
  PROJECT_TYPE_LABELS,
  PRIORITY_COLORS, PRIORITY_LABELS,
} from "@/lib/plannerStore";
import type { Project } from "@/types/planner";

type SortCol = "name" | "type" | "status" | "priority" | "parent";

interface ProjectsTableProps {
  projects: Project[];
  allProjects: Project[];
  sortBy: SortCol;
  sortDir: "asc" | "desc";
  onSort: (col: SortCol) => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

function SortHeader({
  label, col, sortBy, sortDir, onSort,
}: {
  label: string;
  col: SortCol;
  sortBy: SortCol;
  sortDir: "asc" | "desc";
  onSort: (col: SortCol) => void;
}) {
  const active = sortBy === col;
  return (
    <th
      className="text-left px-3 py-2 text-[11px] text-green-dim tracking-widest cursor-pointer hover:text-green select-none whitespace-nowrap"
      onClick={() => onSort(col)}
    >
      {label}
      <span className="ml-1 text-[10px]">
        {active ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
      </span>
    </th>
  );
}

export default function ProjectsTable({
  projects,
  allProjects,
  sortBy,
  sortDir,
  onSort,
  onEdit,
  onDelete,
}: ProjectsTableProps) {
  const parentMap = Object.fromEntries(allProjects.map((p) => [p.id, p.name]));

  if (projects.length === 0) {
    return (
      <div className="border border-border/40 px-4 py-6 text-center text-green-dim text-[13px]">
        NO PROJECTS — CREATE ONE ABOVE
      </div>
    );
  }

  return (
    <div className="border border-border overflow-x-auto">
      <table className="w-full min-w-[640px] text-[13px]">
        <thead className="border-b border-border bg-surface/30">
          <tr>
            <SortHeader label="NAME" col="name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="TYPE" col="type" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="STATUS" col="status" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="PRIORITY" col="priority" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <th className="text-left px-3 py-2 text-[11px] text-green-dim tracking-widest whitespace-nowrap">
              MODELS
            </th>
            <SortHeader label="PARENT" col="parent" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <th className="text-left px-3 py-2 text-[11px] text-green-dim tracking-widest">
              PALETTE
            </th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const statusColor = STATUS_COLORS[project.status];
            const parentName = project.parentId ? parentMap[project.parentId] : null;
            const pct = project.modelCount > 0
              ? Math.round((project.modelsCompleted / project.modelCount) * 100)
              : 0;

            return (
              <tr
                key={project.id}
                className="border-b border-border/30 hover:bg-green-faint cursor-pointer transition-colors"
                onClick={() => onEdit(project)}
              >
                {/* Name */}
                <td className="px-3 py-2">
                  <span className="text-green font-semibold">{project.name}</span>
                </td>

                {/* Type */}
                <td className="px-3 py-2 text-green-dim whitespace-nowrap">
                  {PROJECT_TYPE_LABELS[project.type]}
                </td>

                {/* Status */}
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: statusColor }}
                    />
                    <span style={{ color: statusColor }}>{STATUS_LABELS[project.status]}</span>
                  </div>
                </td>

                {/* Priority */}
                <td className="px-3 py-2 whitespace-nowrap">
                  <span style={{ color: PRIORITY_COLORS[project.priority] }}>
                    {PRIORITY_LABELS[project.priority]}
                  </span>
                </td>

                {/* Models */}
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-green font-mono">
                      {project.modelsCompleted}/{project.modelCount}
                    </span>
                    <div className="w-16 h-1.5 bg-surface-2 border border-border/30">
                      <div
                        className="h-full"
                        style={{ width: `${pct}%`, backgroundColor: statusColor }}
                      />
                    </div>
                  </div>
                </td>

                {/* Parent */}
                <td className="px-3 py-2 text-green-dim">
                  {parentName ? (
                    <span className="text-green-dim">{parentName}</span>
                  ) : (
                    <span className="text-green-dim/30">—</span>
                  )}
                </td>

                {/* Palette */}
                <td className="px-3 py-2">
                  <div className="flex gap-0.5">
                    {project.palette.length > 0 ? (
                      project.palette.map((slot, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 border border-border/40 shrink-0"
                          style={{ backgroundColor: slot.hex }}
                          title={slot.paintName || slot.hex}
                        />
                      ))
                    ) : (
                      <span className="text-green-dim/30 text-[10px]">—</span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="text-red opacity-40 hover:opacity-100 text-sm transition-opacity"
                    title="Delete project"
                    onClick={() => {
                      if (confirm(`Delete "${project.name}"?`)) onDelete(project.id);
                    }}
                  >
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
