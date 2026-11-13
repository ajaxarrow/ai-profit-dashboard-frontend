"use client";
import { useEffect, useState } from "react";
import { get } from "./api";
import { useApp } from "./app-context";

export function useData<T>(path: string, extra = "") {
  const { store, days, version } = useApp();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!store) return;
    let live = true;
    setLoading(true);
    get<T>(`/api/${path}/?store=${store.id}&days=${days}${extra}`)
      .then((d) => { if (live) { setData(d); setError(null); } })
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [store, days, path, extra, version]);
  return { data, error, loading };
}
