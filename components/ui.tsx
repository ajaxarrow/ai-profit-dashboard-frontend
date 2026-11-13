"use client";
import { ReactNode } from "react";
import { useApp } from "@/lib/app-context";

const PERIODS = [7, 30, 90, 180];

/** Period picker drawn as the stepper from the design: connected circles, the active one ringed and labelled. */
export function PeriodStepper() {
  const { days, setDays } = useApp();
  return (
    <div className="flex items-start" role="radiogroup" aria-label="Period">
      {PERIODS.map((p, i) => {
        const on = p === days;
        return (
          <div key={p} className="flex items-start">
            {i > 0 && <div className="mt-[17px] h-px w-6 bg-line2" aria-hidden />}
            <div className="flex w-10 flex-col items-center gap-1.5">
              <button role="radio" aria-checked={on} aria-label={`Last ${p} days`} onClick={() => setDays(p)}
                className={`num flex size-[34px] items-center justify-center rounded-full border text-[11px] font-medium transition-colors duration-100 ${on ? "border-ink bg-panel text-ink" : "border-line2 text-ink3 hover:border-ink3 hover:text-ink"}`}>
                {p}d
              </button>
              {on && <span className="rounded bg-lavbg px-1.5 text-[9.5px] font-medium leading-[14px] text-lav">Viewing</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PageHeader({ title, sub, right, stepper = true }: { title: string; sub?: ReactNode; right?: ReactNode; stepper?: boolean }) {
  return (
    <header className="flex items-start justify-between gap-6 pb-8">
      <div className="min-w-0">
        <h1 className="serif text-[34px] font-normal leading-[1.1]">{title}</h1>
        {sub && <p className="mt-2 max-w-[62ch] text-[13px] text-ink2">{sub}</p>}
      </div>
      <div className="flex shrink-0 items-start gap-5">
        <div className="no-print flex items-start gap-3">{right}</div>
        {stepper && <div className="no-print"><PeriodStepper /></div>}
      </div>
    </header>
  );
}

export function Panel({ title, sub, right, children, className = "", note }: {
  title?: string; sub?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; note?: ReactNode;
}) {
  return (
    <section className={`card isolate flex flex-col ${className}`}>
      {title && (
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div>
            <h2 className="serif text-[19px] font-normal leading-6">{title}</h2>
            {sub && <p className="label mt-0.5 max-w-[60ch]">{sub}</p>}
          </div>
          {right}
        </div>
      )}
      <div className="flex-1">{children}</div>
      {note}
    </section>
  );
}

/** The "AI read" under a chart: what it shows and what to do about it. */
export function AiNote({ text, loading, ai = true }: { text?: string; loading?: boolean; ai?: boolean }) {
  if (!loading && !text) return null;
  return (
    <div className="mx-6 mb-5 mt-1 flex items-start gap-3 rounded-xl bg-[#f6f2e4] px-4 py-3">
      <span className={`mt-px shrink-0 rounded px-1.5 text-[10px] font-semibold uppercase leading-[18px] tracking-[0.06em] ${ai ? "bg-lavbg text-lav" : "bg-[#e8e4d6] text-ink2"}`}>{ai ? "AI read" : "Summary"}</span>
      {loading && !text ? (
        <div className="flex-1 space-y-1.5 pt-1"><div className="skeleton h-3 w-full" /><div className="skeleton h-3 w-2/3" /></div>
      ) : (
        <p className="text-[13px] leading-[1.55] text-ink2">{text}</p>
      )}
    </div>
  );
}

export function Stat({ label, value, sub, accent = true }: { label: string; value: ReactNode; sub?: ReactNode; accent?: boolean }) {
  return (
    <div className={accent ? "border-l-[3px] border-tan pl-3.5" : ""}>
      <div className="cap">{label}</div>
      <div className="serif num mt-1 text-[26px] leading-[1.15]">{value}</div>
      <div className="mt-0.5 min-h-4">{sub}</div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-neg/25 bg-negbg px-4 py-3 text-[13px] text-neg">{message}</div>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 px-6 py-10">
      <p className="serif text-[18px]">{title}</p>
      <p className="max-w-[52ch] text-[13px] text-ink2">{body}</p>
      {action}
    </div>
  );
}

const tone = {
  pos: "bg-posbg text-pos", neg: "bg-negbg text-neg", warn: "bg-warnbg text-warn", mute: "bg-[#eeead9] text-ink2",
  lav: "bg-lavbg text-lav", peach: "bg-peachbg text-peach", blue: "bg-bluebg text-blue",
};
export function Tag({ tone: t = "mute", children }: { tone?: keyof typeof tone; children: ReactNode }) {
  return <span className={`inline-block rounded-md px-1.5 py-px text-[11px] font-medium leading-4 ${tone[t]}`}>{children}</span>;
}

export const sevTone = { high: "neg", medium: "warn", low: "mute" } as const;
