"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { Army } from "@/types/planner";

type SyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";

export function useCloudSync(
  armies: Army[],
  isAuthenticated: boolean,
  isReady: boolean
) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevArmiesRef = useRef<string>("");

  // Load from cloud on auth
  const loadFromCloud = useCallback(async (): Promise<Army[] | null> => {
    try {
      setSyncStatus("syncing");
      const res = await fetch("/api/planner/sync");
      if (res.status === 503) { setSyncStatus("offline"); return null; }
      if (!res.ok) { setSyncStatus("error"); return null; }
      const data = await res.json();
      setSyncStatus("synced");
      setLastSynced(data.updatedAt ? new Date(data.updatedAt) : new Date());
      return data.armies as Army[];
    } catch {
      setSyncStatus("error");
      return null;
    }
  }, []);

  // Push to cloud (debounced)
  const pushToCloud = useCallback(async (data: Army[]) => {
    try {
      setSyncStatus("syncing");
      const res = await fetch("/api/planner/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ armies: data }),
      });
      if (res.status === 503) { setSyncStatus("offline"); return; }
      if (!res.ok) { setSyncStatus("error"); return; }
      setSyncStatus("synced");
      setLastSynced(new Date());
    } catch {
      setSyncStatus("error");
    }
  }, []);

  // Auto-sync on army changes (debounced 2s)
  useEffect(() => {
    if (!isAuthenticated || !isReady || !cloudLoaded) return;
    const serialized = JSON.stringify(armies);
    if (serialized === prevArmiesRef.current) return;
    prevArmiesRef.current = serialized;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    setSyncStatus("idle");
    syncTimerRef.current = setTimeout(() => {
      pushToCloud(armies);
    }, 2000);
  }, [armies, isAuthenticated, isReady, cloudLoaded, pushToCloud]);

  return { syncStatus, lastSynced, cloudLoaded, setCloudLoaded, loadFromCloud };
}
