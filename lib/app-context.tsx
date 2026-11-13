"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { get, Store } from "./api";

type Ctx = {
  stores: Store[]; store: Store | null; setStoreId: (id: number) => void; days: number; setDays: (d: number) => void;
  refreshStores: () => Promise<Store[]>; loaded: boolean; error: string | null; chatOpen: boolean; setChatOpen: (o: boolean) => void;
  readOnly: boolean; version: number; chatSeed: string | null; openChat: (q?: string) => void; clearSeed: () => void;
};
const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
};

const safe = {
  get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch {} },
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreIdState] = useState<number | null>(null);
  const [days, setDaysState] = useState(90);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [version, setVersion] = useState(0);
  const [chatSeed, setChatSeed] = useState<string | null>(null);
  const [readOnly, setReadOnly] = useState(false);

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
    get<{ read_only: boolean }>("/api/config/").then((c) => setReadOnly(c.read_only)).catch(() => {});
    refreshStores();
  }, [refreshStores]);

  // The live Shopify store is the default; a visitor can still switch to the demo shop within a visit.
  const store = useMemo(() => stores.find((s) => s.id === storeId) ?? stores.find((s) => s.platform === "shopify") ?? stores[0] ?? null, [stores, storeId]);
  const value: Ctx = {
    stores, store, loaded, error, refreshStores, chatOpen, setChatOpen, days, version, chatSeed, readOnly,
    openChat: (q) => { if (q) setChatSeed(q); setChatOpen(true); }, clearSeed: () => setChatSeed(null),
    setStoreId: (id) => { setStoreIdState(id); safe.set("store", String(id)); },
    setDays: (d) => { setDaysState(d); safe.set("days", String(d)); },
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
