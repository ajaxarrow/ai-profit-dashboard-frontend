"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { get, patch, post } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import { useData } from "@/lib/use-data";
import { ago, money } from "@/lib/format";
import Icon from "@/components/Icon";
import SignalCard, { Signal } from "@/components/SignalCard";
import { HealthRing, Health, Loop, LoopStrip } from "@/components/CommandParts";
import Simulator, { SimCampaign } from "@/components/Simulator";
import { Empty, ErrorBox, PageHeader, Panel, Skeleton } from "@/components/ui";

type Snapshot = {
  run: { id: number; created_at: string; trigger: string; health: Health; brief: { headline?: string; bullets?: string[] }; stats: { new: number; worsened: number; resolved: number; wins: number; at_stake: number }; provider: string };
  signals: Signal[]; wins: Signal[]; loop: Loop;
};
type Resp = { snapshot: Snapshot | null; currency: string };
const TABS = [["all", "All"], ["problem", "Problems"], ["opportunity", "Opportunities"], ["risk", "Early warnings"]] as const;

export default function CommandCenter() {
  const { store, days, version, openChat } = useApp();
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("all");
  const [all, setAll] = useState(false);
  const auto = useRef<number | null>(null);
  const camps = useData<{ campaigns: SimCampaign[] }>("campaigns");

  const run = useCallback(async () => {
    if (!store) return;
    setRunning(true); setErr(null);
    try { setData(await post<Resp>(`/api/command/?store=${store.id}&days=${days}`)); } catch (e) { setErr((e as Error).message); }
    setRunning(false);
  }, [store, days]);

  useEffect(() => {
    if (!store) return;
    let live = true;
    get<Resp>(`/api/command/?store=${store.id}&days=${days}`).then((d) => {
      if (!live) return;
      setData(d);
      if (!d.snapshot && auto.current !== store.id) { auto.current = store.id; run(); } // first visit: analyse straight away
    }).catch((e) => live && setErr(e.message));
    return () => { live = false; };
  }, [store, days, version, run]);

  async function setStatus(id: number, status: string) {
    setBusy(true);
    try { await patch(`/api/signals/${id}/`, { status }); const d = await get<Resp>(`/api/command/?store=${store!.id}&days=${days}`); setData(d); } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  if (err && !data) return <ErrorBox message={err} />;
  if (!data) return <div className="space-y-4"><Skeleton className="h-12 w-72" /><Skeleton className="h-44" /><Skeleton className="h-64" /></div>;
  const c = data.currency, snap = data.snapshot;

  if (!snap) {
    return (
      <>
        <PageHeader title="Command center" />
        <Panel>
          {running ? <div className="space-y-3 p-6"><p className="serif text-[20px]">Reading every order, product and campaign…</p><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" /></div> :
            <Empty title="No analysis yet" body="Run the monitor and the AI will look through all your data and list what is costing you money and where you can earn more."
              action={<button className="btn btn-primary" onClick={run}>Run the monitor</button>} />}
        </Panel>
      </>
    );
  }

  const { run: r, signals, loop } = snap;
  const filtered = signals.filter((s) => tab === "all" || s.group === tab);
  const shown = all ? filtered : filtered.slice(0, 5);
  const count = (g: string) => signals.filter((s) => g === "all" || s.group === g).length;
  const upside = signals.filter((s) => s.group === "opportunity").reduce((a, s) => a + s.impact, 0);

  return (
    <>
      <PageHeader title="Command center" sub={`The AI watches ${store?.name ?? "your store"} and tells you what to do next. Checked ${ago(r.created_at)}.`}
        right={<button className="btn btn-primary" onClick={run} disabled={running}><Icon name="play" className="size-3.5" />{running ? "Analysing…" : "Run monitor now"}</button>} />
      {err && <div className="mb-4"><ErrorBox message={err} /></div>}

      <div className="grid grid-cols-1 gap-5">
        <section className="card isolate grid grid-cols-[auto_1fr] items-center gap-8 p-6 max-lg:grid-cols-1">
          <HealthRing h={r.health} />
          <div className="min-w-0 border-l border-line pl-8 max-lg:border-0 max-lg:pl-0">
            <div className="cap flex items-center gap-1.5"><Icon name="sparkle" className="size-3.5" />Morning brief</div>
            <h2 className="serif mt-1.5 max-w-[34ch] text-[26px] leading-[1.2]">{r.brief.headline}</h2>
            <ul className="mt-3 grid gap-1.5">
              {r.brief.bullets?.map((b) => <li key={b} className="flex gap-2 text-[13.5px] text-ink2"><span className="mt-[8px] size-1.5 shrink-0 rounded-full bg-ink" />{b}</li>)}
            </ul>
          </div>
          <dl className="col-span-2 grid grid-cols-3 gap-6 border-t border-line pt-5 max-lg:col-span-1">
            <div><dt className="cap">At stake</dt><dd className="serif num mt-1 text-[28px] leading-none">{money(r.stats.at_stake, c, { compact: true })}</dd></div>
            <div><dt className="cap">Upside</dt><dd className="serif num mt-1 text-[28px] leading-none text-pos">{money(upside, c, { compact: true })}</dd></div>
            <div><dt className="cap">New</dt><dd className="serif num mt-1 text-[28px] leading-none">{r.stats.new}</dd></div>
          </dl>
        </section>

        <LoopStrip loop={loop} ago={ago(r.created_at)} currency={c} />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex gap-1.5" role="tablist" aria-label="Signal type">
            {TABS.map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors duration-100 ${tab === k ? "bg-pill font-medium" : "text-ink2 hover:bg-[#efebd9]"}`}>{l}<span className="num ml-1.5 text-ink3">{count(k)}</span></button>
            ))}
          </div>
          <p className="label">Ranked by severity, then money. Approve what you want fixed; the monitor tracks it.</p>
        </div>

        {running && <p className="label" role="status">Re-checking everything…</p>}
        {shown.length === 0 ? <Panel><Empty title="Nothing here" body="No signals in this group. Everything in view is dismissed, snoozed or fixed." /></Panel> :
          shown.map((s) => <SignalCard key={s.id} s={s} currency={c} busy={busy} onStatus={setStatus} onAsk={(q) => openChat(q)} />)}
        {filtered.length > 5 && <button className="btn mx-auto" onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show ${filtered.length - 5} more signals`}</button>}

        {camps.data && camps.data.campaigns.length > 0 && <Simulator campaigns={camps.data.campaigns} currency={c} days={days} />}

        {snap.wins.length > 0 && (
          <Panel title="Wins" sub="Problems you approved that the monitor no longer finds">
            <ul className="pb-2">{snap.wins.map((w, i) => (
              <li key={w.id} className={`flex items-center gap-3 px-6 py-3 ${i ? "border-t border-line" : ""}`}>
                <span className="flex size-7 items-center justify-center rounded-full bg-posbg text-pos"><Icon name="check" className="size-4" /></span>
                <span className="flex-1 text-[13.5px]">{w.ai.headline || w.title}</span>
                <span className="serif num text-[16px] text-pos">{money(w.approved_impact ?? w.impact, c, { compact: true })}</span>
              </li>))}</ul>
          </Panel>
        )}

        <p className="label pb-2 pt-1">
          <Link href="/dashboard" className="underline underline-offset-2">Dashboard</Link> has the full numbers behind every card. Approving records the decision and tracks whether the problem goes away; it does not change ad budgets or prices in your shop by itself (yet).
        </p>
      </div>
    </>
  );
}
