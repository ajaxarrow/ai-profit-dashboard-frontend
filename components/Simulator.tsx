"use client";
import { useMemo, useState } from "react";
import { money } from "@/lib/format";
import Icon from "./Icon";
import { Panel } from "./ui";

export type SimCampaign = { id: number; platform: string; name: string; spend: number; roas: number | null; break_even_roas: number | null; profit_after_ads: number; margin_ratio_pct: number };

/** What if we move budget? Cut what loses money, give it to what earns, see the profit change.
 *  Cutting recovers the full loss per franc; adding to a winner earns only `eff` of its average return (diminishing returns). */
export default function Simulator({ campaigns, currency, days }: { campaigns: SimCampaign[]; currency: string; days: number }) {
  const [cut, setCut] = useState(60);
  const [eff, setEff] = useState(70);

  const sim = useMemo(() => {
    const perFranc = (c: SimCampaign) => (c.roas ?? 0) * (c.margin_ratio_pct / 100) - 1; // profit per franc spent
    const losers = campaigns.filter((c) => c.profit_after_ads < 0 && c.spend > 0);
    const winners = campaigns.filter((c) => c.profit_after_ads > 0 && c.break_even_roas && c.roas && c.roas >= c.break_even_roas * 1.8);
    const freed = losers.reduce((a, c) => a + (c.spend * cut) / 100, 0);
    const saved = losers.reduce((a, c) => a - ((c.spend * cut) / 100) * perFranc(c), 0);
    const wTotal = winners.reduce((a, c) => a + c.profit_after_ads, 0) || 1;
    const CAP = 0.5; // no winner gets more than +50% budget: scaling a small campaign 5x is not credible
    const rows = winners.map((c) => {
      const add = Math.min(freed * (c.profit_after_ads / wTotal), c.spend * CAP);
      return { c, add, gain: add * ((eff / 100) * (c.roas ?? 0) * (c.margin_ratio_pct / 100) - 1) };
    });
    const gained = rows.reduce((a, r) => a + Math.max(0, r.gain), 0);
    return { losers, winners, freed, saved, rows, gained, delta: saved + (winners.length ? gained : 0) };
  }, [campaigns, cut, eff]);

  if (!sim.losers.length || !sim.winners.length) return null;
  const base = campaigns.reduce((a, c) => a + c.profit_after_ads, 0);
  const max = Math.max(base, base + sim.delta, 1);

  return (
    <Panel title="What if we move budget?" sub={`Over the same ${days} days. Drag the sliders and watch profit change.`}
      right={<button className="btn" onClick={() => { setCut(60); setEff(70); }}><Icon name="sparkle" className="size-3.5" />AI suggestion</button>}>
      <div className="grid grid-cols-[1fr_1.1fr] gap-8 px-6 pb-6 max-lg:grid-cols-1">
        <div className="grid content-start gap-5">
          <label className="block">
            <div className="flex justify-between text-[13px]"><span>Cut losing campaigns by</span><span className="num font-medium">{cut}%</span></div>
            <input type="range" min={0} max={100} value={cut} onChange={(e) => setCut(+e.target.value)} className="mt-2 w-full accent-[#2b6a1c]" aria-label="Cut losing campaigns by percent" />
            <p className="label mt-1">{sim.losers.map((l) => l.name).join(" · ")}</p>
          </label>
          <label className="block">
            <div className="flex justify-between text-[13px]"><span>Winners keep this share of their return</span><span className="num font-medium">{eff}%</span></div>
            <input type="range" min={30} max={100} value={eff} onChange={(e) => setEff(+e.target.value)} className="mt-2 w-full accent-[#2b6a1c]" aria-label="Efficiency of added budget" />
            <p className="label mt-1">More budget rarely earns the same as the first franc. 70% is a cautious guess.</p>
          </label>
          <p className="rounded-xl bg-[#f6f2e4] px-4 py-3 text-[12.5px] leading-relaxed text-ink2">Frees <span className="num text-ink">{money(sim.freed, currency)}</span> from {sim.losers.length} losing campaigns and adds it to {sim.winners.length} winners, at most +50% each. Budget that cannot be placed is simply saved. A projection from past margins, not a promise.</p>
        </div>

        <div>
          <div className="grid gap-3">
            {[{ l: "Profit from ads today", v: base, c: "var(--ink-3)" }, { l: "After the move", v: base + sim.delta, c: "var(--pos)" }].map((b) => (
              <div key={b.l}>
                <div className="flex justify-between text-[12.5px]"><span className="text-ink2">{b.l}</span><span className="num font-medium">{money(b.v, currency)}</span></div>
                <div className="mt-1 h-3 rounded-full bg-[#f0ecdd]"><div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${Math.max(2, (b.v / max) * 100)}%`, background: b.c }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className={`serif num text-[40px] leading-none ${sim.delta >= 0 ? "text-pos" : "text-neg"}`}>{money(sim.delta, currency, { sign: true })}</span>
            <span className="label">projected profit change</span>
          </div>
          <p className="label mt-1">{money(sim.saved, currency)} from losses stopped + {money(sim.gained, currency)} from extra budget on winners</p>
          <ul className="mt-3 grid gap-1">
            {sim.rows.map((r) => (
              <li key={r.c.id} className="flex justify-between gap-3 text-[12.5px]"><span className="truncate text-ink2">{r.c.name}</span><span className="num shrink-0">+{money(r.add, currency, { compact: true })} budget</span></li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}
