"use client";
import { useState } from "react";
import { money } from "@/lib/format";
import Icon, { KIND } from "./Icon";
import Viz from "./Viz";
import { Tag } from "./ui";

export type Signal = {
  id: number; kind: string; group: "problem" | "opportunity" | "risk"; severity: "high" | "medium" | "low"; title: string; entity: string; detail: string;
  impact: number; viz: Record<string, unknown>; status: string; active: boolean; new: boolean; approved_at: string | null; approved_impact: number | null;
  ai: { headline?: string; why?: string[]; steps?: string[]; effort?: string; confidence?: string };
};

const SEV = { high: "neg", medium: "warn", low: "mute" } as const;
const LEVEL = { low: "Low effort", medium: "Medium effort", high: "High effort" } as const;

export default function SignalCard({ s, currency, onStatus, onAsk, busy }: {
  s: Signal; currency: string; onStatus: (id: number, status: string) => void; onAsk: (q: string) => void; busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const k = KIND[s.kind] ?? { icon: "alert", label: s.kind, tone: "bg-warnbg text-warn" };
  const approved = s.status === "approved", snoozed = s.status === "snoozed";
  const hasViz = !!(s.viz as { type?: string })?.type;

  return (
    <article className={`card isolate p-5 transition-opacity duration-150 ${snoozed ? "opacity-60" : ""} ${approved ? "border-pos/40" : ""}`} aria-label={s.title}>
      <div className="flex items-start gap-4">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${k.tone}`}><Icon name={k.icon} className="size-[22px]" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="cap">{k.label}</span>
            <Tag tone={SEV[s.severity]}>{s.severity}</Tag>
            {s.new && <Tag tone="lav">new</Tag>}
            {approved && <Tag tone="pos">approved · tracking</Tag>}
            {snoozed && <Tag>snoozed</Tag>}
          </div>
          <h3 className="serif mt-1 text-[22px] leading-[1.2]">{s.ai.headline || s.title}</h3>
        </div>
        {s.impact > 0 && (
          <div className="shrink-0 text-right">
            <div className={`serif num text-[26px] leading-none ${s.group === "opportunity" ? "text-pos" : "text-ink"}`}>{money(s.impact, currency, { compact: true })}</div>
            <div className="label mt-1">{s.group === "opportunity" ? "upside" : "at stake"}</div>
          </div>
        )}
      </div>

      <div className={`mt-5 grid gap-6 ${hasViz ? "grid-cols-[1fr_1fr] max-md:grid-cols-1" : "grid-cols-1"}`}>
        {hasViz && <div className="rounded-xl bg-[#faf8f0] p-4"><Viz viz={s.viz} currency={currency} /></div>}
        <div className="grid content-start gap-4">
          {!!s.ai.why?.length && (
            <div>
              <div className="cap mb-1.5 flex items-center gap-1.5"><Icon name="search" className="size-3.5" />Why</div>
              <ul className="grid gap-1.5">{s.ai.why.map((w) => <li key={w} className="flex gap-2 text-[13px] leading-snug"><span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-ink3" />{w}</li>)}</ul>
            </div>
          )}
          {!!s.ai.steps?.length && (
            <div>
              <div className="cap mb-1.5 flex items-center gap-1.5"><Icon name="flag" className="size-3.5" />Do this</div>
              <ol className="grid gap-1.5">{s.ai.steps.map((t, i) => (
                <li key={t} className="flex gap-2.5 text-[13px] leading-snug"><span className="num flex size-5 shrink-0 items-center justify-center rounded-full bg-pill text-[11px]">{i + 1}</span>{t}</li>
              ))}</ol>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-3.5">
        {s.ai.effort && <Tag tone={s.ai.effort === "low" ? "pos" : s.ai.effort === "high" ? "warn" : "mute"}>{LEVEL[s.ai.effort as keyof typeof LEVEL]}</Tag>}
        {s.ai.confidence && <span className="label">{s.ai.confidence} confidence</span>}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button className="btn !h-8" onClick={() => setOpen(!open)} aria-expanded={open}>Details<Icon name="chevron" className={`size-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`} /></button>
          <button className="btn !h-8" onClick={() => onAsk(`Tell me more about this and exactly what to do: ${s.title}`)}><Icon name="chat" className="size-3.5" />Ask AI</button>
          {approved ? (
            <button className="btn !h-8" disabled={busy} onClick={() => onStatus(s.id, "new")}>Undo approval</button>
          ) : (
            <>
              <button className="btn !h-8" disabled={busy} onClick={() => onStatus(s.id, snoozed ? "new" : "snoozed")}>{snoozed ? "Unsnooze" : "Snooze"}</button>
              <button className="btn !h-8" disabled={busy} onClick={() => onStatus(s.id, "dismissed")}>Dismiss</button>
              <button className="btn btn-primary !h-8" disabled={busy} onClick={() => onStatus(s.id, "approved")}><Icon name="check" className="size-3.5" />Approve</button>
            </>
          )}
        </div>
      </div>
      {open && <p className="mt-3 max-w-[78ch] rounded-lg bg-[#f6f2e4] px-4 py-3 text-[12.5px] leading-relaxed text-ink2">{s.detail}</p>}
    </article>
  );
}
