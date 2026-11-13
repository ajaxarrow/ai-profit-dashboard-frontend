"use client";
import { useCallback, useEffect, useState } from "react";
import { get, post } from "./api";
import { useApp } from "./app-context";

export type Notes = Record<string, string>;
type Resp = { notes: Notes; provider: string | null; ai: boolean; created_at: string | null };

/** AI commentary for every chart. Server caches it per store/period/data, so this is cheap to call on each page. */
export function useNotes() {
  const { store, days, version } = useApp();
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [rewriting, setRewriting] = useState(false);

  useEffect(() => {
    if (!store) return;
    let live = true;
    setLoading(true);
    get<Resp>(`/api/chart-notes/?store=${store.id}&days=${days}`)
      .then((d) => live && setData(d))
      .catch(() => live && setData(null))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [store, days, version]);

  const rewrite = useCallback(async () => {
    if (!store) return;
    setRewriting(true);
    try { setData(await post<Resp>(`/api/chart-notes/?store=${store.id}&days=${days}`)); } catch {}
    setRewriting(false);
  }, [store, days]);

  return { notes: data?.notes ?? null, ai: data?.ai ?? false, provider: data?.provider ?? null, loading: loading || rewriting, rewrite };
}
