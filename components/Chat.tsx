"use client";
import { useEffect } from "react";
import { useApp } from "@/lib/app-context";
import { useChat } from "@/lib/chat-context";
import ChatView from "./ChatView";

/** Slide-over version of the analyst, available on every page. */
export default function Chat() {
  const { chatOpen, setChatOpen, days, chatSeed, clearSeed } = useApp();
  const { send } = useChat();
  useEffect(() => { if (chatOpen && chatSeed) { const q = chatSeed; clearSeed(); send(q); } }, [chatOpen, chatSeed, clearSeed, send]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setChatOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setChatOpen]);

  return (
    <>
      <div onClick={() => setChatOpen(false)} aria-hidden
        className={`fixed inset-0 z-30 bg-ink/20 transition-opacity duration-150 ${chatOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside role="dialog" aria-label="Profit analyst" aria-hidden={!chatOpen} inert={!chatOpen}
        className={`fixed right-0 top-0 z-40 flex h-screen w-[460px] max-w-full flex-col border-l border-line bg-panel shadow-[0_8px_40px_rgba(60,50,20,0.12)] transition-transform duration-200 ${chatOpen ? "translate-x-0 ease-out" : "translate-x-full ease-in"}`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="serif text-[19px] leading-6">Profit analyst</h2>
            <p className="label">Last {days} days · answers from your numbers</p>
          </div>
          <button className="btn" onClick={() => setChatOpen(false)}>Close</button>
        </div>
        <div className="min-h-0 flex-1"><ChatView compact /></div>
      </aside>
    </>
  );
}
