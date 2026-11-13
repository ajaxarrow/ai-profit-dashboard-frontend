"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { get, Store } from "./api";

type Ctx = {
  stores: Store[]; store: Store | null; setStoreId: (id: number) => void; days: number; setDays: (d: number) => void;
  refreshStores: () => Promise<Store[]>; loaded: boolean; error: string | null; chatOpen: boolean; setChatOpen: (o: boolean) => void;
  version: number; chatSeed: string | null; openChat: (q?: string) => void; clearSeed: () => void;
};
const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
};

const safe = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} },
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreIdState] = useState<number | null>(null);
  const [days, setDaysState] = useState(30);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [version, setVersion] = useState(0);
  const [chatSeed, setChatSeed] = useState<string | null>(null);

  const refreshStores = useCallback(async () => {
    try {
      const s = await get<Store[]>("/api/stores/");
      setStores(s);
      setError(null);
      setVersion((v) => v + 1);
      return s;
    } catch (e) {
      setError((e as Error).message);
      return [];
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    const sid = Number(safe.get("store"));
    const d = Number(safe.get("days"));
    if (sid) setStoreIdState(sid);
    if (d) setDaysState(d);
    refreshStores();
  }, [refreshStores]);

  const store = useMemo(() => stores.find((s) => s.id === storeId) ?? stores[0] ?? null, [stores, storeId]);
  const value: Ctx = {
    stores, store, loaded, error, refreshStores, chatOpen, setChatOpen, days, version, chatSeed,
    openChat: (q) => { if (q) setChatSeed(q); setChatOpen(true); }, clearSeed: () => setChatSeed(null),
    setStoreId: (id) => { setStoreIdState(id); safe.set("store", String(id)); },
    setDays: (d) => { setDaysState(d); safe.set("days", String(d)); },
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
