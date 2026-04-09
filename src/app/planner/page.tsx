"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  loadArmies, saveArmies, createArmy, createUnit, createModel, createScheme, createLayer,
  STATUS_LABELS, STATUS_COLORS, STATUS_FLOW, PRIORITY_ICONS, PRIORITY_COLORS,
  LAYER_ROLES, getModelProgress,
} from "@/lib/plannerStore";
import { useCloudSync } from "@/lib/useCloudSync";
import type { Army, Unit, Model, PaintScheme, SchemeLayer, ModelStatus, Priority, SilhouetteType, BodyZone, LayerRole } from "@/types/planner";
import TerminalBox from "@/components/ui/TerminalBox";
import BodySilhouette from "@/components/planner/BodySilhouette";
import PaintPicker from "@/components/planner/PaintPicker";

const SILHOUETTE_TYPES: SilhouetteType[] = ["infantry", "vehicle", "monster", "terrain"];

export default function PlannerPage() {
  const [armies, setArmies] = useState<Army[]>([]);
  const [selectedArmy, setSelectedArmy] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [tab, setTab] = useState<"scheme" | "silhouette" | "brainstorm">("scheme");
  const [activeZone, setActiveZone] = useState<BodyZone | null>(null);
  const [newArmyName, setNewArmyName] = useState("");
  const [newUnitName, setNewUnitName] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [newSchemeName, setNewSchemeName] = useState("");
  const [brainstormInput, setBrainstormInput] = useState("");
  const [wheelPalette, setWheelPalette] = useState<Array<{ hex: string }> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showTree, setShowTree] = useState(false);
  const [pickerForLayer, setPickerForLayer] = useState<string | null>(null);

  const { data: session, status: authStatus } = useSession();
  const isAuthenticated = authStatus === "authenticated";

  const { syncStatus, lastSynced, cloudLoaded, setCloudLoaded, loadFromCloud } =
    useCloudSync(armies, isAuthenticated, isReady);

  useEffect(() => {
    const local = loadArmies();
    setArmies(local);
    setIsReady(true);

    // Check for palette sent from colour wheel
    const raw = localStorage.getItem("ppp_wheel_palette");
    if (raw) {
      try { setWheelPalette(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  // On auth, load from cloud and merge with local
  useEffect(() => {
    if (!isAuthenticated || !isReady || cloudLoaded) return;
    loadFromCloud().then((cloudArmies) => {
      setCloudLoaded(true);
      if (!cloudArmies) return;
      if (cloudArmies.length > 0) {
        // Cloud wins — overwrite local
        setArmies(cloudArmies);
        saveArmies(cloudArmies);
      } else {
        // No cloud data — push local to cloud
        const local = loadArmies();
        if (local.length > 0) {
          fetch("/api/planner/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ armies: local }),
          }).catch(() => {});
        }
        setCloudLoaded(true);
      }
    });
  }, [isAuthenticated, isReady, cloudLoaded, loadFromCloud, setCloudLoaded]);

  const persist = useCallback((updated: Army[]) => {
    setArmies(updated);
    saveArmies(updated);
  }, []);

  // ── Export / Import ──
  const exportArmies = () => {
    const blob = new Blob([JSON.stringify(armies, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "paint-planner-armies.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importArmies = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          persist(parsed);
        }
      } catch { /* ignore bad JSON */ }
    });
    e.target.value = "";
  };

  // Derived selections
  const army = armies.find((a) => a.id === selectedArmy);
  const unit = army?.units.find((u) => u.id === selectedUnit);
  const model = unit?.models.find((m) => m.id === selectedModel);
  const scheme = model?.schemeId ? army?.schemes.find((s) => s.id === model.schemeId) : null;

  // ── Army CRUD ──
  const addArmy = () => {
    if (!newArmyName.trim()) return;
    const a = createArmy(newArmyName.trim());
    persist([...armies, a]);
    setSelectedArmy(a.id);
    setNewArmyName("");
  };

  const deleteArmy = (id: string) => {
    persist(armies.filter((a) => a.id !== id));
    if (selectedArmy === id) setSelectedArmy(null);
  };

  // ── Unit CRUD ──
  const addUnit = () => {
    if (!army || !newUnitName.trim()) return;
    const u = createUnit(newUnitName.trim());
    persist(armies.map((a) => a.id === army.id ? { ...a, units: [...a.units, u] } : a));
    setSelectedUnit(u.id);
    setNewUnitName("");
  };

  const deleteUnit = (id: string) => {
    if (!army) return;
    persist(armies.map((a) => a.id === army.id
      ? { ...a, units: a.units.filter((u) => u.id !== id) } : a));
    if (selectedUnit === id) setSelectedUnit(null);
  };

  // ── Model CRUD ──
  const addModel = () => {
    if (!army || !unit || !newModelName.trim()) return;
    const m = createModel(newModelName.trim());
    persist(armies.map((a) => a.id === army.id
      ? { ...a, units: a.units.map((u) => u.id === unit.id
          ? { ...u, models: [...u.models, m] } : u) } : a));
    setSelectedModel(m.id);
    setNewModelName("");
  };

  const deleteModel = (id: string) => {
    if (!army || !unit) return;
    persist(armies.map((a) => a.id === army.id
      ? { ...a, units: a.units.map((u) => u.id === unit.id
          ? { ...u, models: u.models.filter((m) => m.id !== id) } : u) } : a));
    if (selectedModel === id) setSelectedModel(null);
  };

  // ── Update model field ──
  const updateModel = useCallback((field: Partial<Model>) => {
    if (!army || !unit || !model) return;
    persist(armies.map((a) => a.id === army.id
      ? { ...a, units: a.units.map((u) => u.id === unit.id
          ? { ...u, models: u.models.map((m) => m.id === model.id ? { ...m, ...field } : m) } : u) } : a));
  }, [armies, army, unit, model, persist]);

  // ── Scheme ──
  const addScheme = () => {
    if (!army || !newSchemeName.trim()) return;
    const s = createScheme(newSchemeName.trim());
    persist(armies.map((a) => a.id === army.id ? { ...a, schemes: [...a.schemes, s] } : a));
    setNewSchemeName("");
    if (model) updateModel({ schemeId: s.id });
  };

  const assignScheme = (schemeId: string) => {
    updateModel({ schemeId });
  };

  // ── Layer ──
  const addLayer = (role: LayerRole) => {
    if (!army || !scheme) return;
    const layer = createLayer(role);
    const updated = { ...scheme, layers: [...scheme.layers, layer] };
    persist(armies.map((a) => a.id === army.id
      ? { ...a, schemes: a.schemes.map((s) => s.id === scheme.id ? updated : s) } : a));
  };

  const updateLayer = (layerId: string, field: Partial<SchemeLayer>) => {
    if (!army || !scheme) return;
    const updated = {
      ...scheme,
      layers: scheme.layers.map((l) => l.id === layerId ? { ...l, ...field } : l),
    };
    persist(armies.map((a) => a.id === army.id
      ? { ...a, schemes: a.schemes.map((s) => s.id === scheme.id ? updated : s) } : a));
  };

  const deleteLayer = (layerId: string) => {
    if (!army || !scheme) return;
    const updated = { ...scheme, layers: scheme.layers.filter((l) => l.id !== layerId) };
    persist(armies.map((a) => a.id === army.id
      ? { ...a, schemes: a.schemes.map((s) => s.id === scheme.id ? updated : s) } : a));
  };

  // ── Brainstorm ──
  const addBrainstorm = () => {
    if (!brainstormInput.trim() || !model) return;
    updateModel({ brainstorm: [...(model.brainstorm || []), brainstormInput.trim()] });
    setBrainstormInput("");
  };

  const removeBrainstorm = (i: number) => {
    if (!model) return;
    updateModel({ brainstorm: model.brainstorm.filter((_, idx) => idx !== i) });
  };

  // ── Silhouette zone colors ──
  const zoneColors: Partial<Record<BodyZone, string>> = {};
  if (scheme) {
    for (const layer of scheme.layers) {
      if (layer.zone && layer.paintHex) {
        zoneColors[layer.zone] = layer.paintHex;
      }
    }
  }

  const progress = model ? getModelProgress(model, armies) : 0;

  return (
    <>
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* ── Mobile: Army tree toggle bar ── */}
      <div className="md:hidden border-b border-border px-3 py-1.5 flex items-center justify-between shrink-0">
        <span className="text-[10px] text-green glow-green tracking-widest font-semibold">┌─[ TACTICAL PLANNER ]</span>
        <button
          className="btn-terminal text-[9px] px-2 py-0.5"
          onClick={() => setShowTree(!showTree)}
        >
          {showTree ? "▲ CLOSE" : "▼ ARMY TREE"}
        </button>
      </div>

      {/* ── LEFT: Army tree ── */}
      <div className={`w-full md:w-56 border-b md:border-b-0 md:border-r border-border flex-col flex-shrink-0 ${showTree ? "flex" : "hidden md:flex"}`}>
        <div className="border-b border-border px-3 py-2 hidden md:flex items-center gap-2">
          <span className="text-[10px] text-green glow-green tracking-widest font-semibold">
            ┌─[ TACTICAL PLANNER ]
          </span>
        </div>
        {/* Sync status bar */}
        <div className={`px-3 py-1 border-b border-border/40 flex items-center gap-2 text-[9px]
          ${syncStatus === "synced" ? "text-green-dim" :
            syncStatus === "syncing" ? "text-cyan-dim" :
            syncStatus === "error" ? "text-red/70" :
            "text-green-dim/40"}`}
        >
          {!isAuthenticated ? (
            <>
              <span>LOCAL ONLY</span>
              <Link href="/auth/signin" className="text-cyan hover:glow-cyan ml-auto">SIGN IN →</Link>
            </>
          ) : syncStatus === "syncing" ? (
            <><span className="blink">●</span><span>SYNCING<span className="blink">_</span></span></>
          ) : syncStatus === "synced" ? (
            <><span>✓</span><span>SYNCED {lastSynced ? new Date(lastSynced).toLocaleTimeString() : ""}</span></>
          ) : syncStatus === "error" ? (
            <><span>!</span><span>SYNC ERROR</span></>
          ) : syncStatus === "offline" ? (
            <><span>○</span><span>OFFLINE — LOCAL ONLY</span></>
          ) : (
            <span>{session?.user?.email?.split("@")[0] ?? "CLOUD"} SYNC ACTIVE</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {armies.map((a) => (
            <div key={a.id}>
              <div
                className={`flex items-center gap-1 px-2 py-1 cursor-pointer border text-[10px]
                  ${selectedArmy === a.id ? "border-green bg-green-faint text-green" : "border-transparent text-green-dim hover:text-green hover:border-border"}`}
                onClick={() => { setSelectedArmy(a.id); setSelectedUnit(null); setSelectedModel(null); }}
              >
                <span className="flex-1 truncate font-semibold">{a.name}</span>
                <span className="text-[8px]" style={{ color: PRIORITY_COLORS[a.priority] }}>
                  {PRIORITY_ICONS[a.priority]}
                </span>
                <button className="text-red opacity-60 hover:opacity-100 ml-1" onClick={(e) => { e.stopPropagation(); deleteArmy(a.id); }}>×</button>
              </div>

              {selectedArmy === a.id && (
                <div className="pl-3">
                  {a.units.map((u) => (
                    <div key={u.id}>
                      <div
                        className={`flex items-center gap-1 px-2 py-0.5 cursor-pointer border text-[9px]
                          ${selectedUnit === u.id ? "border-cyan/60 text-cyan" : "border-transparent text-green-dim hover:text-green"}`}
                        onClick={() => { setSelectedUnit(u.id); setSelectedModel(null); }}
                      >
                        <span className="flex-1 truncate">▸ {u.name}</span>
                        <button className="text-red opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteUnit(u.id); }}>×</button>
                      </div>

                      {selectedUnit === u.id && (
                        <div className="pl-3">
                          {u.models.map((m) => (
                            <div
                              key={m.id}
                              className={`flex items-center gap-1 px-2 py-0.5 cursor-pointer border text-[8px]
                                ${selectedModel === m.id ? "border-amber/60 text-amber" : "border-transparent text-green-dim hover:text-green"}`}
                              onClick={() => { setSelectedModel(m.id); setShowTree(false); }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[m.status] }} />
                              <span className="flex-1 truncate">» {m.name}</span>
                              <button className="text-red opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteModel(m.id); }}>×</button>
                            </div>
                          ))}

                          {/* Add model */}
                          <div className="flex gap-1 mt-0.5 pl-2">
                            <input
                              type="text" value={newModelName}
                              onChange={(e) => setNewModelName(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && addModel()}
                              placeholder="model name"
                              className="flex-1 text-[9px] py-0.5 px-1"
                            />
                            <button className="btn-terminal text-[8px] px-1" onClick={addModel}>+</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add unit */}
                  <div className="flex gap-1 mt-0.5">
                    <input
                      type="text" value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addUnit()}
                      placeholder="unit name"
                      className="flex-1 text-[9px] py-0.5 px-1"
                    />
                    <button className="btn-terminal text-[8px] px-1" onClick={addUnit}>+</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add army */}
        <div className="border-t border-border p-2 flex gap-1">
          <input
            type="text" value={newArmyName}
            onChange={(e) => setNewArmyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addArmy()}
            placeholder="new army"
            className="flex-1 text-[10px] py-1 px-2"
          />
          <button className="btn-terminal text-[10px] px-2" onClick={addArmy}>+</button>
        </div>

        {/* Export / Import */}
        <div className="border-t border-border/40 p-2 flex gap-1">
          <button
            className="btn-terminal text-[9px] px-2 py-1 flex-1"
            onClick={exportArmies}
            title="Export armies as JSON"
          >
            ↓ EXPORT
          </button>
          <label className="btn-terminal text-[9px] px-2 py-1 flex-1 text-center cursor-pointer" title="Import armies from JSON">
            ↑ IMPORT
            <input type="file" accept=".json" className="hidden" onChange={importArmies} />
          </label>
        </div>
      </div>

      {/* ── RIGHT: Model detail ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Wheel palette import banner */}
        {wheelPalette && wheelPalette.length > 0 && (
          <div className="border-b border-cyan/40 bg-cyan/5 px-4 py-2 flex items-center gap-3">
            <span className="text-cyan text-[10px] tracking-widest">COLOUR WHEEL PALETTE READY:</span>
            <div className="flex gap-1">
              {wheelPalette.map((c, i) => (
                <div key={i} className="w-6 h-6 border border-border/60" style={{ backgroundColor: c.hex }} title={c.hex} />
              ))}
            </div>
            <span className="text-green-dim text-[9px] ml-2">Select a scheme below then assign these colours to layers.</span>
            <button
              className="btn-terminal btn-cyan text-[9px] px-2 ml-auto"
              onClick={() => { localStorage.removeItem("ppp_wheel_palette"); setWheelPalette(null); }}
            >
              ✕ DISMISS
            </button>
          </div>
        )}

        {!model ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-green-dim text-xs tracking-widest">
              {armies.length === 0 ? "CREATE AN ARMY TO BEGIN" : "SELECT A MODEL"}
            </span>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Model header */}
            <div className="border border-border p-3 bg-surface">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-green glow-green text-sm font-semibold">{model.name}</h2>
                  <div className="text-green-dim text-[10px]">{army?.name} › {unit?.name}</div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Priority selector */}
                  <div className="flex gap-1">
                    {(["low", "med", "high"] as Priority[]).map((p) => (
                      <button
                        key={p}
                        className={`btn-terminal text-[9px] px-2 py-0.5 ${model.priority === p ? "active" : ""}`}
                        style={model.priority === p ? { borderColor: PRIORITY_COLORS[p], color: PRIORITY_COLORS[p] } : {}}
                        onClick={() => updateModel({ priority: p })}
                      >
                        {PRIORITY_ICONS[p]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status row */}
              <div className="flex flex-wrap gap-1 mb-3">
                {STATUS_FLOW.map((s) => (
                  <button
                    key={s}
                    className={`btn-terminal text-[9px] px-2 py-0.5 transition-all ${model.status === s ? "active" : ""}`}
                    style={model.status === s ? { borderColor: STATUS_COLORS[s], color: STATUS_COLORS[s] } : {}}
                    onClick={() => updateModel({ status: s })}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-green-dim">PROGRESS</span>
                <div className="flex-1 h-2 bg-surface-2 border border-border">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: STATUS_COLORS[model.status],
                      boxShadow: `0 0 6px ${STATUS_COLORS[model.status]}`,
                    }}
                  />
                </div>
                <span className="text-[9px] text-green font-mono w-8">{progress}%</span>
              </div>

              {/* Silhouette type selector */}
              <div className="flex gap-1 mt-3">
                <span className="text-[9px] text-green-dim self-center mr-1">TYPE:</span>
                {SILHOUETTE_TYPES.map((t) => (
                  <button
                    key={t}
                    className={`btn-terminal text-[9px] px-2 py-0.5 ${model.silhouetteType === t ? "active" : ""}`}
                    onClick={() => updateModel({ silhouetteType: t })}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1">
              {(["scheme", "silhouette", "brainstorm"] as const).map((t) => (
                <button
                  key={t}
                  className={`btn-terminal text-[10px] px-4 py-1 ${tab === t ? "active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Tab: Scheme */}
            {tab === "scheme" && (
              <div className="space-y-3">
                {/* Scheme selector */}
                <TerminalBox title="PAINT SCHEME">
                  <div className="flex gap-2 mb-3">
                    <select
                      value={model.schemeId || ""}
                      onChange={(e) => assignScheme(e.target.value)}
                      className="flex-1 text-xs"
                    >
                      <option value="">— no scheme —</option>
                      {army?.schemes.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <input
                      type="text" value={newSchemeName}
                      onChange={(e) => setNewSchemeName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addScheme()}
                      placeholder="new scheme name"
                      className="flex-1 text-xs"
                    />
                    <button className="btn-terminal text-[10px] px-2" onClick={addScheme}>CREATE</button>
                  </div>

                  {/* Layers */}
                  {scheme && (
                    <div>
                      <div className="overflow-x-auto">
                      <div className="min-w-[480px]">
                      <div className="grid grid-cols-[24px_1fr_80px_100px_32px_28px] gap-x-2 text-[9px] text-green-dim mb-1 px-1">
                        <span>#</span><span>ROLE</span><span>PAINT</span><span>HEX</span><span>ZONE</span><span></span>
                      </div>
                      {scheme.layers.map((layer, i) => (
                        <div
                          key={layer.id}
                          className={`grid grid-cols-[24px_1fr_80px_100px_32px_28px] gap-x-2 items-center py-1 px-1 border-b border-border/30
                            ${layer.done ? "opacity-50" : ""}`}
                        >
                          <button
                            className={`w-5 h-5 border text-center text-[9px] ${layer.done ? "border-green bg-green/20 text-green" : "border-border text-green-dim"}`}
                            onClick={() => updateLayer(layer.id, { done: !layer.done })}
                          >
                            {layer.done ? "✓" : String(i + 1).padStart(2, "0")}
                          </button>
                          <span className="text-[9px] text-green uppercase">{layer.role}</span>
                          <div className="flex items-center gap-0.5">
                            <input
                              type="text"
                              value={layer.paintName}
                              onChange={(e) => updateLayer(layer.id, { paintName: e.target.value })}
                              placeholder="paint name"
                              className="flex-1 text-[9px] py-0.5 px-1 border-border min-w-0"
                            />
                            <button
                              className="text-[9px] text-cyan hover:glow-cyan shrink-0 px-0.5"
                              title="Search paint library"
                              onClick={() => setPickerForLayer(layer.id)}
                            >⌕</button>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 border border-border/60 flex-shrink-0" style={{ backgroundColor: layer.paintHex || "#111" }} />
                            <input
                              type="text"
                              value={layer.paintHex}
                              onChange={(e) => updateLayer(layer.id, { paintHex: e.target.value.toUpperCase() })}
                              placeholder="#000000"
                              maxLength={7}
                              className="flex-1 text-[9px] py-0.5 px-1 font-mono border-border"
                            />
                          </div>
                          <select
                            value={layer.zone || ""}
                            onChange={(e) => updateLayer(layer.id, { zone: (e.target.value as BodyZone) || null })}
                            className="text-[8px] py-0 px-0.5 border-border"
                          >
                            <option value="">-</option>
                            <option value="head">HEAD</option>
                            <option value="torso">TORSO</option>
                            <option value="left-arm">L-ARM</option>
                            <option value="right-arm">R-ARM</option>
                            <option value="left-leg">L-LEG</option>
                            <option value="right-leg">R-LEG</option>
                            <option value="weapon">WEAPON</option>
                            <option value="base">BASE</option>
                            <option value="hull">HULL</option>
                            <option value="turret">TURRET</option>
                            <option value="tracks">TRACKS</option>
                            <option value="body">BODY</option>
                            <option value="wings">WINGS</option>
                            <option value="structure">STRUCT</option>
                            <option value="ground">GROUND</option>
                          </select>
                          <button
                            className="btn-terminal text-[9px] px-1 py-0"
                            onClick={() => deleteLayer(layer.id)}
                          >×</button>
                        </div>
                      ))}

                      </div>{/* min-w */}
                      </div>{/* overflow-x-auto */}

                      {/* Add layer */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {LAYER_ROLES.map((role) => (
                          <button
                            key={role}
                            className="btn-terminal text-[9px] px-2 py-0.5"
                            onClick={() => addLayer(role)}
                          >
                            + {role}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </TerminalBox>
              </div>
            )}

            {/* Tab: Silhouette */}
            {tab === "silhouette" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TerminalBox title="MODEL DIAGRAM" color="cyan">
                  <BodySilhouette
                    type={model.silhouetteType}
                    zoneColors={zoneColors}
                    activeZone={activeZone}
                    onZoneClick={(zone) => setActiveZone(activeZone === zone ? null : zone)}
                  />
                  {activeZone && (
                    <div className="mt-3 text-[9px] text-green-dim">
                      SELECTED: <span className="text-cyan">{activeZone.toUpperCase()}</span>
                      {" "}— assign a paint hex in the SCHEME tab and link it to this zone.
                    </div>
                  )}
                </TerminalBox>

                {/* Zone legend */}
                <TerminalBox title="ZONE PAINT MAP">
                  <div className="space-y-1">
                    {Object.entries(zoneColors).map(([zone, hex]) => (
                      <div key={zone} className="flex items-center gap-2">
                        <div className="w-4 h-4 border border-border/60" style={{ backgroundColor: hex }} />
                        <span className="text-[9px] text-green uppercase">{zone}</span>
                        <span className="text-[9px] text-green-dim font-mono ml-auto">{hex}</span>
                      </div>
                    ))}
                    {Object.keys(zoneColors).length === 0 && (
                      <span className="text-[9px] text-green-dim">
                        No zones assigned yet. Add paint layers with zones in the SCHEME tab.
                      </span>
                    )}
                  </div>
                </TerminalBox>
              </div>
            )}

            {/* Tab: Brainstorm */}
            {tab === "brainstorm" && (
              <TerminalBox title="BRAINSTORM LIST">
                <div className="space-y-1 mb-3">
                  {(model.brainstorm || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 py-0.5">
                      <span className="text-green-dim text-[10px]">›</span>
                      <span className="flex-1 text-[10px] text-green">{item}</span>
                      <button
                        className="text-[9px] text-red opacity-60 hover:opacity-100"
                        onClick={() => removeBrainstorm(i)}
                      >×</button>
                    </div>
                  ))}
                  {(model.brainstorm || []).length === 0 && (
                    <span className="text-[9px] text-green-dim">No ideas yet. Add some below.</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={brainstormInput}
                    onChange={(e) => setBrainstormInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addBrainstorm()}
                    placeholder="idea, technique, color note..."
                    className="flex-1 text-xs py-1"
                  />
                  <button className="btn-terminal text-[10px] px-3" onClick={addBrainstorm}>ADD</button>
                </div>
              </TerminalBox>
            )}
          </div>
        )}
      </div>
    </div>

      {/* Paint picker modal */}
      {pickerForLayer && (
        <PaintPicker
          onClose={() => setPickerForLayer(null)}
          onSelect={(paint) => {
            updateLayer(pickerForLayer, {
              paintName: paint.name,
              paintHex: paint.hex,
            });
            setPickerForLayer(null);
          }}
        />
      )}
    </>
  );
}
