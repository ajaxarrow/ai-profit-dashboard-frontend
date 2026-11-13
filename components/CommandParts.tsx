import { money } from "@/lib/format";
import Icon from "./Icon";

export type Health = { score: number; label: string; parts: { label: string; score: number }[] };
export type Loop = { detected: number; recommended: number; approved: number; approved_impact: number; fixed: number; fixed_impact: number };

const tone = (n: number) => (n >= 75 ? "var(--pos)" : n >= 50 ? "#b9851b" : "var(--neg)");

/** Overall profit health as a ring, with the five things it is made of. */
export function HealthRing({ h }: { h: Health }) {
  const R = 46, C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-6">
      <div className="relative size-[132px] shrink-0">
        <svg viewBox="0 0 110 110" className="size-full -rotate-90" role="img" aria-label={`Profit health ${h.score} out of 100`}>
          <circle cx="55" cy="55" r={R} fill="none" stroke="#efebdc" strokeWidth="10" />
          <circle cx="55" cy="55" r={R} fill="none" stroke={tone(h.score)} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(h.score / 100) * C} ${C}`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="serif num text-[38px] leading-none">{h.score}</span>
          <span className="mt-1 text-[10.5px] text-ink3">{h.label}</span>
        </div>
      </div>
      <ul className="grid w-[190px] gap-2 max-lg:hidden">
        {h.parts.map((p) => (
          <li key={p.label}>
            <div className="flex justify-between text-[11.5px] text-ink2"><span>{p.label}</span><span className="num">{p.score}</span></div>
            <div className="mt-0.5 h-1.5 rounded-full bg-[#efebdc]"><div className="h-full rounded-full" style={{ width: `${p.score}%`, background: tone(p.score) }} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The workflow, with live counts: every signal moves left to right. */
export function LoopStrip({ loop, ago, currency }: { loop: Loop; ago: string; currency: string }) {
  const steps = [
    { icon: "eye", label: "Monitor", big: ago, sub: "last check", on: true },
    { icon: "search", label: "Detect", big: String(loop.detected), sub: "open signals", on: loop.detected > 0 },
    { icon: "bulb", label: "Recommend", big: String(loop.recommended), sub: "with a plan", on: loop.recommended > 0 },
    { icon: "thumbs", label: "Approve", big: String(loop.approved), sub: loop.approved ? `${money(loop.approved_impact, currency, { compact: true })} tracked` : "waiting on you", on: loop.approved > 0 },
    { icon: "check", label: "Fixed", big: String(loop.fixed), sub: loop.fixed ? `${money(loop.fixed_impact, currency, { compact: true })} won` : "wins appear here", on: loop.fixed > 0 },
  ];
  return (
    <ol className="grid grid-cols-5 items-stretch gap-0 max-md:grid-cols-1 max-md:gap-2" aria-label="Workflow">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex items-center">
          <div className={`flex-1 rounded-2xl border px-4 py-3 ${s.on ? "border-line2 bg-panel" : "border-dashed border-line bg-transparent"}`}>
            <div className="flex items-center gap-2 text-[12px] text-ink2"><Icon name={s.icon} className="size-4" />{s.label}</div>
            <div className="serif num mt-1 text-[24px] leading-none">{s.big}</div>
            <div className="label mt-1 truncate">{s.sub}</div>
          </div>
          {i < steps.length - 1 && <Icon name="arrow" className="mx-1 size-4 text-ink3 max-md:hidden" />}
        </li>
      ))}
    </ol>
  );
}
