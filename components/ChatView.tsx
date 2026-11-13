"use client";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useApp } from "@/lib/app-context";
import { Scope, useChat } from "@/lib/chat-context";

type Group = { title: string; qs: string[] };
const GENERAL: Group[] = [
  { title: "Profit", qs: ["Which products are the most profitable after all costs?", "Why did profit change versus the previous period?"] },
  { title: "Losses", qs: ["Where are we currently losing money?", "Which products have a returns or discount problem?"] },
  { title: "Marketing", qs: ["Which marketing budgets should we optimize?", "Which campaign should get more budget?"] },
];

const ADS: Group[] = [
  { title: "Does it work?", qs: ["Is ad spend actually driving sales, or is it a coincidence?", "Do sales respond the same day or after a delay?"] },
  { title: "Money", qs: ["Which campaigns should I cut and where should the budget go?", "How much am I wasting on campaigns that lose money?"] },
  { title: "Trust the numbers", qs: ["Do the ad platforms over-claim compared with my store?", "Which campaigns get worse as I spend more?"] },
];

const STEPS = ["Reading your orders…", "Comparing with the previous period…", "Checking ad spend against margin…", "Writing the answer…"];

function Thinking() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => Math.min(x + 1, STEPS.length - 1)), 1600); return () => clearInterval(t); }, []);
  return <p className="label flex items-center gap-2" role="status"><span className="skeleton inline-block size-2 rounded-full" />{STEPS[i]}</p>;
}

export default function ChatView({ compact = false, scope = "general", heading }: { compact?: boolean; scope?: Scope; heading?: string }) {
  const { store, days } = useApp();
  const { msgs, busy, send, regenerate, clear } = useChat(scope);
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs, busy]);

  const submit = (q: string) => { setInput(""); send(q); };
  const last = msgs[msgs.length - 1];
  const groups = scope === "ads" ? ADS : GENERAL;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`min-h-0 flex-1 overflow-y-auto ${compact ? "px-5 py-4" : "px-1 py-2"}`}>
        {msgs.length === 0 ? (
          <div className="flex flex-col gap-5">
            <div>
              <p className="serif text-[22px] leading-tight">{heading ?? `Ask about ${store?.name ?? "your shop"}`}</p>
              <p className="mt-1 text-[13px] text-ink2">Answers come from your calculated numbers for the last {days} days, with the figures quoted.</p>
            </div>
            {groups.map((g) => (
              <div key={g.title}>
                <div className="cap mb-2">{g.title}</div>
                <div className="flex flex-col gap-2">
                  {g.qs.map((q) => (
                    <button key={q} onClick={() => submit(q)} className="rounded-xl border border-line bg-panel px-3.5 py-2.5 text-left text-[13px] transition-colors duration-100 hover:border-line2 hover:bg-[#f7f4ea]">{q}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {msgs.map((m, i) => m.role === "user" ? (
              <div key={i} className="ml-12 self-end rounded-2xl rounded-br-md bg-pill px-4 py-2.5 text-[13.5px]">{m.content}</div>
            ) : (
              <div key={i} className={m.error ? "rounded-xl bg-negbg px-4 py-3 text-[13px] text-neg" : "rounded-2xl border border-line bg-panel px-5 py-4"}>
                {m.error ? m.content : <div className="md"><Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown></div>}
                {!m.error && (
                  <div className="mt-3 flex items-center gap-3 border-t border-line pt-2.5">
                    <button className="label hover:text-ink" onClick={() => { navigator.clipboard?.writeText(m.content); setCopied(i); setTimeout(() => setCopied(null), 1500); }}>{copied === i ? "Copied" : "Copy"}</button>
                    {i === msgs.length - 1 && <button className="label hover:text-ink" onClick={regenerate} disabled={busy}>Regenerate</button>}
                    {m.provider && <span className="label ml-auto">via {m.provider}</span>}
                  </div>
                )}
              </div>
            ))}
            {busy && <Thinking />}
            {!busy && last?.role === "assistant" && last.followUps && last.followUps.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {last.followUps.map((f) => <button key={f} className="btn !h-auto py-1.5 text-[12.5px] font-normal" onClick={() => submit(f)}>{f}</button>)}
              </div>
            )}
            <div ref={end} />
          </div>
        )}
      </div>

      <form className={`flex items-end gap-2 border-t border-line ${compact ? "p-3" : "pt-4"}`} onSubmit={(e) => { e.preventDefault(); submit(input); }}>
        <label htmlFor={`q-${scope}-${compact ? "d" : "p"}`} className="sr-only">Question</label>
        <textarea id={`q-${scope}-${compact ? "d" : "p"}`} rows={1} value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); } }}
          className="field h-auto min-h-9 resize-none py-2" placeholder={scope === "ads" ? "Ask anything about your advertising" : "Ask about profit, products or ad spend"} />
        <button className="btn btn-primary" disabled={busy || !input.trim()}>Send</button>
        {msgs.length > 0 && <button type="button" className="btn" onClick={clear} aria-label="Clear conversation">Clear</button>}
      </form>
    </div>
  );
}
