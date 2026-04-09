"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  loadProjects, saveProjects,
  STATUS_FLOW, PROJECT_TYPES, PROJECT_TYPE_LABELS,
} from "@/lib/plannerStore";
import type { Project, ProjectType, ProjectStatus, Priority } from "@/types/planner";
import ProjectCard from "@/components/planner/ProjectCard";
import ProjectsTable from "@/components/planner/ProjectsTable";
import NewProjectModal from "@/components/planner/NewProjectModal";

type SortCol = "name" | "type" | "status" | "priority" | "parent";

function sortProjects(
  projects: Project[],
  sortBy: SortCol,
  sortDir: "asc" | "desc",
  parentMap: Record<string, string>
): Project[] {
  const dir = sortDir === "asc" ? 1 : -1;
  return [...projects].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return dir * a.name.localeCompare(b.name);
      case "type":
        return dir * a.type.localeCompare(b.type);
      case "status":
        return dir * (STATUS_FLOW.indexOf(a.status) - STATUS_FLOW.indexOf(b.status));
      case "priority": {
        const rank = { high: 2, med: 1, low: 0 };
        return dir * (rank[a.priority] - rank[b.priority]);
      }
      case "parent": {
        const pa = (a.parentId ? parentMap[a.parentId] : "") ?? "";
        const pb = (b.parentId ? parentMap[b.parentId] : "") ?? "";
        return dir * pa.localeCompare(pb);
      }
      default:
        return 0;
    }
  });
}

export default function PlannerPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [sortBy, setSortBy] = useState<SortCol>("priority");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<ProjectType | "">("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setProjects(loadProjects());
    setIsReady(true);
  }, []);

  const persist = useCallback((updated: Project[]) => {
    setProjects(updated);
    saveProjects(updated);
  }, []);

  const handleConfirm = useCallback((project: Project) => {
    if (editProject) {
      persist(projects.map((p) => p.id === project.id ? project : p));
    } else {
      persist([...projects, project]);
    }
    setShowModal(false);
    setEditProject(null);
  }, [editProject, projects, persist]);

  const handleEdit = useCallback((project: Project) => {
    setEditProject(project);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    persist(projects.filter((p) => p.id !== id));
  }, [projects, persist]);

  const handleSort = useCallback((col: SortCol) => {
    if (sortBy === col) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  }, [sortBy]);

  const parentMap = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    [projects]
  );

  const filtered = useMemo(() => {
    const base = filterType ? projects.filter((p) => p.type === filterType) : projects;
    return sortProjects(base, sortBy, sortDir, parentMap);
  }, [projects, filterType, sortBy, sortDir, parentMap]);

  const exportProjects = () => {
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "paint-planner-projects.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProjects = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) persist(parsed);
      } catch { /* ignore */ }
    });
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header bar ── */}
      <div className="border-b border-border px-4 py-2 flex flex-wrap items-center gap-2 shrink-0">
        <span className="text-green glow-green text-base tracking-widest font-semibold shrink-0">
          ┌─[ PAINT PLANNER ]
        </span>

        {/* Type filter */}
        <div className="flex gap-1 flex-wrap">
          <button
            className={`btn-terminal text-xs px-2 py-0.5 ${filterType === "" ? "active" : ""}`}
            onClick={() => setFilterType("")}
          >
            ALL
          </button>
          {PROJECT_TYPES.map((t) => (
            <button
              key={t}
              className={`btn-terminal text-xs px-2 py-0.5 ${filterType === t ? "active" : ""}`}
              onClick={() => setFilterType(filterType === t ? "" : t)}
            >
              {PROJECT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Export / Import */}
        <button
          className="btn-terminal text-xs px-2 py-0.5"
          onClick={exportProjects}
          title="Export projects as JSON"
        >
          ↓ EXPORT
        </button>
        <label className="btn-terminal text-xs px-2 py-0.5 cursor-pointer" title="Import projects from JSON">
          ↑ IMPORT
          <input type="file" accept=".json" className="hidden" onChange={importProjects} />
        </label>

        {/* New project */}
        <button
          className="btn-terminal btn-cyan text-[13px] px-4 py-1 shrink-0"
          onClick={() => { setEditProject(null); setShowModal(true); }}
        >
          + NEW PROJECT
        </button>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        {!isReady ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-green-dim text-xs">LOADING<span className="blink">_</span></span>
          </div>
        ) : projects.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center h-full gap-5 p-8">
            <span className="text-green glow-green text-base tracking-widest font-semibold">
              ┌─[ PAINT PLANNER ]
            </span>
            <p className="text-green-dim text-[13px] text-center max-w-md leading-relaxed">
              Plan your paint projects — track progress, build colour palettes, and
              organise models, units, armies, or terrain all in one place.
            </p>
            <button
              className="btn-terminal btn-cyan text-[13px] px-8 py-2"
              onClick={() => setShowModal(true)}
            >
              + CREATE FIRST PROJECT
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* ── Project cards grid ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-green-dim tracking-widest">
                  PROJECTS ({filtered.length})
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {filtered.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    parentName={p.parentId ? parentMap[p.parentId] : undefined}
                    onClick={handleEdit}
                  />
                ))}
                {/* Add new card */}
                <button
                  className="border border-dashed border-border hover:border-green transition-colors flex flex-col items-center justify-center aspect-square text-green-dim hover:text-green gap-1"
                  onClick={() => { setEditProject(null); setShowModal(true); }}
                >
                  <span className="text-2xl leading-none">+</span>
                  <span className="text-[10px] tracking-wider">NEW</span>
                </button>
              </div>
            </div>

            {/* ── Projects table ── */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] text-green-dim tracking-widest">ALL PROJECTS</span>
                <div className="flex gap-1 ml-auto text-[11px] text-green-dim items-center">
                  <span>SORT:</span>
                  {(["priority", "status", "name", "type", "parent"] as SortCol[]).map((col) => (
                    <button
                      key={col}
                      className={`btn-terminal text-[11px] px-2 py-0 ${sortBy === col ? "active" : ""}`}
                      onClick={() => handleSort(col)}
                    >
                      {col.toUpperCase()}
                      {sortBy === col && (
                        <span className="ml-0.5">{sortDir === "asc" ? "▲" : "▼"}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <ProjectsTable
                projects={filtered}
                allProjects={projects}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={handleSort}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <NewProjectModal
          projects={projects}
          initialProject={editProject ?? undefined}
          onConfirm={handleConfirm}
          onClose={() => { setShowModal(false); setEditProject(null); }}
        />
      )}
    </div>
  );
}
