"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { post } from "./api";
import { useApp } from "./app-context";

export type Msg = { role: "user" | "assistant"; content: string; provider?: string; followUps?: string[]; error?: boolean };
export type Scope = "general" | "ads";
type Convo = Record<Scope, Msg[]>;
type Ctx = {
  convo: Convo; busy: Record<Scope, boolean>;
  send: (scope: Scope, q: string) => Promise<void>; regenerate: (scope: Scope) => Promise<void>; clear: (scope: Scope) => void;
};
const ChatCtx = createContext<Ctx | null>(null);

export function useChat(scope: Scope = "general") {
  const c = useContext(ChatCtx);
  if (!c) throw new Error("useChat outside provider");
  return {
    msgs: c.convo[scope], busy: c.busy[scope],
    send: (q: string) => c.send(scope, q), regenerate: () => c.regenerate(scope), clear: () => c.clear(scope),
  };
}

const key = (id: number, scope: Scope) => `chat:${id}:${scope}`;
const read = (id: number, scope: Scope): Msg[] => { try { return JSON.parse(localStorage.getItem(key(id, scope)) || "[]"); } catch { return []; } };
const write = (id: number, scope: Scope, m: Msg[]) => { try { localStorage.setItem(key(id, scope), JSON.stringify(m.slice(-40))); } catch {} };
const empty: Convo = { general: [], ads: [] };

/** One conversation per store and topic (general / advertising), shared by every place the chat appears, kept across reloads. */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { store, days } = useApp();
  const [convo, setConvo] = useState<Convo>(empty);
  const [busy, setBusy] = useState<Record<Scope, boolean>>({ general: false, ads: false });
  const sid = store?.id;
  const loadedFor = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (sid === undefined) return;
    setConvo({ general: read(sid, "general"), ads: read(sid, "ads") });
    loadedFor.current = sid;
  }, [sid]);
  useEffect(() => {
    if (sid === undefined || loadedFor.current !== sid) return;
    write(sid, "general", convo.general);
    write(sid, "ads", convo.ads);
  }, [convo, sid]);

  const ask = useCallback(async (scope: Scope, history: Msg[]) => {
    if (!store) return;
    const set = (m: Msg[]) => setConvo((c) => ({ ...c, [scope]: m }));
    set(history);
    setBusy((b) => ({ ...b, [scope]: true }));
    try {
      const r = await post<{ reply: string; provider: string; follow_ups: string[] }>(
        `/api/chat/?store=${store.id}&days=${days}${scope === "ads" ? "&scope=ads" : ""}`,
        { messages: history.filter((m) => !m.error).map(({ role, content }) => ({ role, content })) },
      );
      set([...history, { role: "assistant", content: r.reply, provider: r.provider, followUps: r.follow_ups }]);
    } catch (e) {
      set([...history, { role: "assistant", content: (e as Error).message, error: true }]);
    }
    setBusy((b) => ({ ...b, [scope]: false }));
  }, [store, days]);

  const send = useCallback(async (scope: Scope, q: string) => {
    const text = q.trim();
    if (!text || busy[scope]) return;
    await ask(scope, [...convo[scope].map(({ followUps, ...m }) => m), { role: "user", content: text }]);
  }, [ask, busy, convo]);

  const regenerate = useCallback(async (scope: Scope) => {
    if (busy[scope]) return;
    const h = [...convo[scope]];
    while (h.length && h[h.length - 1].role === "assistant") h.pop();
    if (h.length) await ask(scope, h);
  }, [ask, busy, convo]);

  const clear = useCallback((scope: Scope) => setConvo((c) => ({ ...c, [scope]: [] })), []);
  return <ChatCtx.Provider value={{ convo, busy, send, regenerate, clear }}>{children}</ChatCtx.Provider>;
}
