"use client";

import { useState, useRef } from "react";
import {
  STATUS_FLOW, STATUS_LABELS, STATUS_COLORS,
  PRIORITY_ICONS, PRIORITY_COLORS,
  PALETTE_LAYERS, PALETTE_LAYER_LABELS,
  PROJECT_TYPES, PROJECT_TYPE_LABELS,
  makeId,
} from "@/lib/plannerStore";
import type { Project, ProjectType, ProjectStatus, Priority, PaletteSlot, PaletteLayer } from "@/types/planner";
import PaintPicker from "./PaintPicker";
import type { Paint } from "@/types/paint";

interface NewProjectModalProps {
  projects: Project[];
  initialProject?: Project;
  onConfirm: (project: Project) => void;
  onClose: () => void;
}

const EMPTY_SLOT: PaletteSlot = { hex: "", paintName: "", paintId: null, layer: "" };
const PALETTE_SIZE = 10;

export default function NewProjectModal({
  projects,
  initialProject,
  onConfirm,
  onClose,
}: NewProjectModalProps) {
  const isEdit = !!initialProject;

  const [name, setName] = useState(initialProject?.name ?? "");
  const [type, setType] = useState<ProjectType>(initialProject?.type ?? "model");
  const [modelCount, setModelCount] = useState(initialProject?.modelCount ?? 1);
  const [modelsCompleted, setModelsCompleted] = useState(initialProject?.modelsCompleted ?? 0);
  const [status, setStatus] = useState<ProjectStatus>(initialProject?.status ?? "built");
  const [priority, setPriority] = useState<Priority>(initialProject?.priority ?? "med");
  const [parentId, setParentId] = useState<string | null>(initialProject?.parentId ?? null);
  const [images, setImages] = useState<string[]>(initialProject?.images ?? []);
  const [notes, setNotes] = useState(initialProject?.notes ?? "");

  // Palette: always 10 slots (fill from initial, pad with empties)
  const [palette, setPalette] = useState<PaletteSlot[]>(() => {
    const base = initialProject?.palette ?? [];
    const slots = base.slice(0, PALETTE_SIZE);
    while (slots.length < PALETTE_SIZE) slots.push({ ...EMPTY_SLOT });
    return slots;
  });

  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.slice(0, 3 - images.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages((prev) => [...prev, ev.target!.result as string].slice(0, 3));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handlePaintSelect = (paint: Paint) => {
    if (pickerSlot === null) return;
    setPalette((prev) =>
      prev.map((s, i) =>
        i === pickerSlot
          ? { ...s, hex: paint.hex || "", paintName: paint.name, paintId: paint.id }
          : s
      )
    );
    setPickerSlot(null);
  };

  const clearSlot = (i: number) => {
    setPalette((prev) => prev.map((s, idx) => idx === i ? { ...EMPTY_SLOT } : s));
  };

  const setSlotHex = (i: number, hex: string) => {
    setPalette((prev) => prev.map((s, idx) => idx === i ? { ...s, hex: hex.toUpperCase() } : s));
  };

  const setSlotLayer = (i: number, layer: string) => {
    setPalette((prev) =>
      prev.map((s, idx) => idx === i ? { ...s, layer: layer as PaletteLayer | "" } : s)
    );
  };

  const handleConfirm = () => {
    if (!name.trim()) return;
    const filledPalette = palette.filter((s) => s.hex);
    const now = new Date().toISOString();
    onConfirm({
      id: initialProject?.id ?? makeId(),
      name: name.trim(),
      type,
      modelCount,
      modelsCompleted: Math.min(modelsCompleted, modelCount),
      status,
      priority,
      images,
      palette: filledPalette,
      parentId,
      notes,
      createdAt: initialProject?.createdAt ?? now,
      updatedAt: now,
    });
  };

  const parentOptions = projects.filter(
    (p) => p.id !== initialProject?.id && (p.type === "army" || p.type === "unit")
  );

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
        onClick={onClose}
      >
        <div
          className="bg-bg border border-green/60 box-glow w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-bg border-b border-border px-4 py-3 flex items-center justify-between z-10">
            <span className="text-green glow-green text-[13px] tracking-widest font-semibold">
              ┌─[ {isEdit ? "EDIT PROJECT" : "NEW PROJECT"} ]
            </span>
            <button onClick={onClose} className="text-green-dim hover:text-green">✕</button>
          </div>

          <div className="p-5 space-y-6">
            {/* Name */}
            <div>
              <label className="text-[13px] text-green-dim tracking-widest block mb-1">PROJECT NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                placeholder="e.g. Tactical Squad Alpha"
                className="w-full text-[13px] py-1.5 px-2"
                autoFocus
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-[13px] text-green-dim tracking-widest block mb-2">TYPE</label>
              <div className="flex gap-1 flex-wrap">
                {PROJECT_TYPES.map((t) => (
                  <button
                    key={t}
                    className={`btn-terminal text-[13px] px-5 py-1 ${type === t ? "active" : ""}`}
                    onClick={() => setType(t)}
                  >
                    {PROJECT_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Model count + completed */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] text-green-dim tracking-widest block mb-1">MODEL COUNT</label>
                <input
                  type="number"
                  min={1}
                  value={modelCount}
                  onChange={(e) => setModelCount(Math.max(1, Number(e.target.value)))}
                  className="w-full text-[13px] py-1.5 px-2"
                />
              </div>
              <div>
                <label className="text-[13px] text-green-dim tracking-widest block mb-1">COMPLETED</label>
                <input
                  type="number"
                  min={0}
                  max={modelCount}
                  value={modelsCompleted}
                  onChange={(e) =>
                    setModelsCompleted(Math.min(modelCount, Math.max(0, Number(e.target.value))))
                  }
                  className="w-full text-[13px] py-1.5 px-2"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-[13px] text-green-dim tracking-widest block mb-2">CURRENT PROGRESS</label>
              <div className="flex flex-wrap gap-1">
                {STATUS_FLOW.map((s) => (
                  <button
                    key={s}
                    className={`btn-terminal text-xs px-2 py-0.5 transition-all ${status === s ? "active" : ""}`}
                    style={status === s ? { borderColor: STATUS_COLORS[s], color: STATUS_COLORS[s] } : {}}
                    onClick={() => setStatus(s)}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[13px] text-green-dim tracking-widest block mb-2">PRIORITY</label>
              <div className="flex gap-1">
                {(["low", "med", "high"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    className={`btn-terminal text-[13px] px-5 py-1 ${priority === p ? "active" : ""}`}
                    style={priority === p ? { borderColor: PRIORITY_COLORS[p], color: PRIORITY_COLORS[p] } : {}}
                    onClick={() => setPriority(p)}
                  >
                    {PRIORITY_ICONS[p]} {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Parent project */}
            {parentOptions.length > 0 && (
              <div>
                <label className="text-[13px] text-green-dim tracking-widest block mb-1">
                  ASSIGN TO PARENT PROJECT
                </label>
                <select
                  value={parentId ?? ""}
                  onChange={(e) => setParentId(e.target.value || null)}
                  className="w-full text-[13px] py-1.5 px-2"
                >
                  <option value="">— none —</option>
                  {parentOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({PROJECT_TYPE_LABELS[p.type]})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-[13px] text-green-dim tracking-widest block mb-1">NOTES</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="techniques, references, inspiration..."
                rows={2}
                className="w-full text-[13px] py-1.5 px-2 resize-none"
              />
            </div>

            {/* Reference images */}
            <div>
              <label className="text-[13px] text-green-dim tracking-widest block mb-2">
                REFERENCE IMAGES (UP TO 3)
              </label>
              <div className="flex gap-2 items-center flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 border border-border shrink-0">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      className="absolute top-0 right-0 bg-black/80 text-red text-xs px-1 leading-tight hover:opacity-100"
                      onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {images.length < 3 && (
                  <button
                    className="w-20 h-20 border border-border border-dashed text-green-dim hover:border-green hover:text-green text-2xl flex items-center justify-center shrink-0"
                    onClick={() => imageRef.current?.click()}
                  >
                    +
                  </button>
                )}
                <input
                  ref={imageRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            {/* Palette */}
            <div>
              <label className="text-[13px] text-green-dim tracking-widest block mb-1">
                COLOUR PALETTE
                <span className="text-[11px] ml-2 text-green-dim/60">
                  ({palette.filter((s) => s.hex).length}/10 — click a square to add a paint)
                </span>
              </label>

              {/* 10 colour squares */}
              <div className="flex gap-1 mb-3">
                {palette.map((slot, i) => (
                  <button
                    key={i}
                    className="flex-1 aspect-square border border-border hover:border-green relative group transition-colors"
                    style={{ backgroundColor: slot.hex || "#111" }}
                    onClick={() => setPickerSlot(i)}
                    title={slot.paintName || (slot.hex ? slot.hex : "Click to add colour")}
                  >
                    {!slot.hex && (
                      <span className="absolute inset-0 flex items-center justify-center text-green-dim text-sm group-hover:text-green">
                        +
                      </span>
                    )}
                    {slot.hex && (
                      <button
                        className="absolute top-0 right-0 bg-black/80 text-red text-[10px] leading-tight px-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); clearSlot(i); }}
                      >
                        ×
                      </button>
                    )}
                  </button>
                ))}
              </div>

              {/* Hex input row for filled slots */}
              {palette.some((s) => s.hex) && (
                <div className="space-y-1.5 mt-3">
                  <div className="text-[11px] text-green-dim tracking-widest mb-1">LAYER ASSIGNMENTS</div>
                  {palette.map((slot, i) =>
                    slot.hex ? (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 border border-border/60 shrink-0 cursor-pointer hover:border-green"
                          style={{ backgroundColor: slot.hex }}
                          onClick={() => setPickerSlot(i)}
                          title="Click to change paint"
                        />
                        <span className="text-[11px] text-green truncate flex-1 min-w-0">
                          {slot.paintName || slot.hex}
                        </span>
                        <input
                          type="text"
                          value={slot.hex}
                          onChange={(e) => setSlotHex(i, e.target.value)}
                          maxLength={7}
                          className="w-20 text-[11px] py-0 px-1 font-mono border-border shrink-0"
                        />
                        <select
                          value={slot.layer}
                          onChange={(e) => setSlotLayer(i, e.target.value)}
                          className="text-[11px] py-0 px-1 border-border shrink-0"
                        >
                          <option value="">— layer —</option>
                          {PALETTE_LAYERS.map((l) => (
                            <option key={l} value={l}>{PALETTE_LAYER_LABELS[l]}</option>
                          ))}
                        </select>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-bg border-t border-border px-5 py-3 flex justify-between items-center">
            <button className="btn-terminal text-[13px] px-4" onClick={onClose}>
              CANCEL
            </button>
            <button
              className="btn-terminal btn-cyan text-[13px] px-8 py-1.5"
              onClick={handleConfirm}
              disabled={!name.trim()}
            >
              {isEdit ? "SAVE CHANGES" : "CONFIRM →"}
            </button>
          </div>
        </div>
      </div>

      {/* Paint picker — rendered via portal in PaintPicker itself */}
      {pickerSlot !== null && (
        <PaintPicker
          onSelect={handlePaintSelect}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </>
  );
}
