"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { get, post } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import { useData } from "@/lib/use-data";
import { delta, money, num, pct } from "@/lib/format";
import { HBars, RevenueVsAds, Scatter } from "@/components/Charts";
import ChatView from "@/components/ChatView";
import { AiNote, Empty, ErrorBox, PageHeader, Panel, Skeleton, Stat, Tag } from "@/components/ui";

type Platform = {
  platform: string; name: string; spend: number; share_of_spend_pct: number; impressions: number; clicks: number; ctr_pct: number | null; cpc: number | null;
  conversions: number; cpa: number | null; reported_sales: number; roas: number | null; profit_after_ads: number;
  store_orders: number | null; store_revenue: number | null; claim_vs_store: number | null; conversions_vs_orders: number | null;
};
type Camp = {
  id: number; platform: string; name: string; objective: string; spend: number; share_of_spend_pct: number; roas: number | null; break_even_roas: number | null;
  profit_after_ads: number; cpc: number | null; conversions: number; conversion_value: number; spend_vs_roas_r: number | null;
  roas_first_half: number | null; roas_second_half: number | null; verdict: "loses money" | "scale" | "holding";
};
type Corr = { label: string; n: number; lag_days: number; r: number | null; r_adjusted: number | null; strength: string; direction: string | null; slope: number | null };
type Report = {
  has_ads: boolean; currency: string; period: { days: number; start: string; end: string };
  kpis: { spend: number; spend_prev: number | null; reported_sales: number; roas: number | null; break_even_roas: number | null; mer: number | null; mer_prev: number | null;
    profit_after_ads_reported: number; spend_share_of_revenue_pct: number | null; losing_spend: number; losing_amount: number };
  platforms: Platform[]; campaigns: Camp[]; correlations: Corr[];
  daily: { date: string; spend: number; revenue: number; orders: number; profit: number }[];
  scatter: { points: { date: string; spend: number; revenue: number }[]; slope?: number; intercept?: number };
  ai?: { notes: Record<string, string>; ai: boolean; provider: string | null };
};

const NAMES: Record<string, string> = { google: "Google Ads", meta: "Meta", tiktok: "TikTok" };
const sTone = (s: string) => (s === "strong" || s === "very strong" ? "pos" : s === "moderate" ? "blue" : s === "weak" ? "warn" : "mute") as "pos" | "blue" | "warn" | "mute";

function ExportMenu({ storeId, days }: { storeId: number; days: number }) {
  const base = `/api/ads-report/export/?store=${storeId}&days=${days}`;
  const item = "block rounded-lg px-3 py-2 text-[13px] hover:bg-[#f4f0e1]";
  return (
    <details className="relative">
      <summary className="btn btn-primary cursor-pointer list-none">Export report</summary>
      <div className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-line bg-panel p-1.5 shadow-[0_8px_28px_rgba(60,50,20,0.12)]">
        <a className={item} href={`${base}&fmt=xlsx`}>Excel workbook<span className="label block">Summary, platforms, campaigns, daily, weekly, correlations + AI notes</span></a>
        <div className="my-1 border-t border-line" />
        {(["campaigns", "platforms", "daily", "correlations"] as const).map((t) => <a key={t} className={item} href={`${base}&fmt=csv&table=${t}`}>CSV · {t}</a>)}
        <div className="my-1 border-t border-line" />
        <button className={`${item} w-full text-left`} onClick={() => window.print()}>Print or save as PDF</button>
      </div>
    </details>
  );
}

export default function AdvertisingPage() {
  const { store, days, version } = useApp();
  const [rep, setRep] = useState<Report | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rewriting, setRewriting] = useState(false);

  useEffect(() => {
    if (!store) return;
    let live = true;
    setLoading(true);
    get<Report>(`/api/ads-report/?store=${store.id}&days=${days}`)
      .then((d) => { if (!live) return; setRep(d); setErr(null); if (d.has_ads) get<Report>(`/api/ads-report/?store=${store.id}&days=${days}&notes=1`).then((n) => live && setRep(n)).catch(() => {}); })
      .catch((e) => live && setErr(e.message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [store, days, version]);

  async function rewrite() {
    if (!store) return;
    setRewriting(true);
    try { setRep(await post<Report>(`/api/ads-report/?store=${store.id}&days=${days}`)); } catch {}
    setRewriting(false);
  }

  if (err) return <ErrorBox message={err} />;
  if (loading || !rep || !store) return <div className="space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-32" /><Skeleton className="h-72" /></div>;

  if (!rep.has_ads) {
    return (
      <>
        <PageHeader title="Advertising" />
        <Panel><Empty title="No ad data for this store yet"
          body="Profit is calculated without advertising for now. Import ad spend from Google Ads, Meta or TikTok as a CSV and this page becomes a full report: efficiency per campaign, how spend relates to your sales, and where the platforms over-claim."
          action={<Link className="btn btn-primary" href="/connect">Import ad spend</Link>} /></Panel>
      </>
    );
  }

  const c = rep.currency, k = rep.kpis;
  const notes = rep.ai?.notes ?? {};
  const waiting = !rep.ai || rewriting;
  const note = (key: string) => <AiNote text={notes[key]} loading={waiting} ai={rep.ai?.ai ?? true} />;
  const spendDelta = delta(k.spend, k.spend_prev);
  const trend = rep.daily.map((d) => ({ date: d.date, revenue: d.revenue, ad_spend: d.spend, profit: d.profit, orders: d.orders }));

  return (
    <>
      <PageHeader title="Advertising report" sub={`${rep.period.start} to ${rep.period.end}. Spend, results, and how both relate to what your store actually recorded.`}
        right={<><button className="btn" onClick={rewrite} disabled={waiting}>{waiting ? "Writing notes…" : "Refresh AI notes"}</button><ExportMenu storeId={store.id} days={days} /></>} />

      <div className="grid grid-cols-1 gap-5">
        <section className="card isolate">
          <div className="grid grid-cols-6 gap-6 px-6 pb-4 pt-6 max-lg:grid-cols-3 max-sm:grid-cols-2">
            <Stat label="Ad spend" value={money(k.spend, c, { compact: true })} sub={spendDelta !== null && <span className="num text-[12px] text-ink3">{spendDelta > 0 ? "▲" : "▼"} {Math.abs(spendDelta).toFixed(0)}% vs previous</span>} />
            <Stat label="Platform-reported sales" value={money(k.reported_sales, c, { compact: true })} />
            <Stat label="ROAS vs break-even" value={`${k.roas ?? "–"} / ${k.break_even_roas ?? "–"}`} sub={<span className="label">needs the second to profit</span>} />
            <Stat label="Revenue per ad franc" value={k.mer?.toFixed(2) ?? "–"} sub={k.mer_prev ? <span className="label">was {k.mer_prev.toFixed(2)}</span> : null} />
            <Stat label="Spend / revenue" value={pct(k.spend_share_of_revenue_pct)} />
            <Stat label="On losing campaigns" value={money(k.losing_spend, c, { compact: true })} sub={<span className="num text-[12px] text-neg">loses {money(k.losing_amount, c, { compact: true })}</span>} />
          </div>
          {note("summary")}
        </section>

        <Panel title="Platforms" sub="What each platform claims against what the store recorded for that channel" note={note("attribution")}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead><tr><th className="th !text-left">Platform</th><th className="th">Spend</th><th className="th">Share</th><th className="th">CTR</th><th className="th">CPC</th><th className="th">ROAS</th><th className="th">Profit after ads</th>
                <th className="th">Claimed vs store sales</th><th className="th">Conversions vs store orders</th></tr></thead>
              <tbody>{rep.platforms.map((p) => (
                <tr key={p.platform}>
                  <td className="td !text-left font-medium">{p.name}</td>
                  <td className="td num">{money(p.spend, c)}</td><td className="td num text-ink2">{pct(p.share_of_spend_pct, 0)}</td>
                  <td className="td num text-ink2">{pct(p.ctr_pct, 2)}</td><td className="td num text-ink2">{p.cpc ? `${c} ${p.cpc.toFixed(2)}` : "–"}</td>
                  <td className="td num">{p.roas?.toFixed(2) ?? "–"}</td>
                  <td className={`td num font-medium ${p.profit_after_ads < 0 ? "text-neg" : "text-pos"}`}>{money(p.profit_after_ads, c, { sign: true })}</td>
                  <td className="td num">{p.claim_vs_store ? <span className={p.claim_vs_store > 1.25 ? "text-warn" : ""}>{p.claim_vs_store.toFixed(2)}×</span> : "–"}</td>
                  <td className="td num">{p.conversions_vs_orders ? <span className={p.conversions_vs_orders > 1.25 ? "text-warn" : ""}>{p.conversions_vs_orders.toFixed(2)}×</span> : "–"}</td>
                </tr>))}</tbody>
            </table>
          </div>
          <p className="label px-6 pb-3 pt-2">Above 1× means the platform reports more sales or conversions than the store has orders for that channel (platforms credit the same sale to several touchpoints).</p>
          {note("platforms")}
        </Panel>

        <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
          <Panel title="Does spend move sales?" sub="One dot per day: ad spend against revenue" note={note("spend_vs_results")}>
            <Scatter points={rep.scatter.points} slope={rep.scatter.slope} intercept={rep.scatter.intercept} currency={c} />
          </Panel>
          <Panel title="Spend and revenue over time" sub="Do the two lines move together?" note={note("lag")}>
            <RevenueVsAds series={trend} currency={c} />
          </Panel>
        </div>

        <Panel title="Correlation with your store data" sub="r runs from −1 to +1. Adjusted removes the Monday–Sunday rhythm that spend and orders share, which otherwise looks like cause and effect.">
          <div className="overflow-x-auto"><table className="mb-3 w-full text-[13px]">
            <thead><tr><th className="th !text-left">Relationship</th><th className="th">Days</th><th className="th">Spend leads by</th><th className="th">r raw</th><th className="th">r adjusted</th><th className="th !text-left">Evidence</th></tr></thead>
            <tbody>{rep.correlations.map((r) => (
              <tr key={r.label}>
                <td className="td !text-left">{r.label}</td><td className="td num text-ink2">{r.n}</td><td className="td num text-ink2">{r.lag_days === 0 ? "same day" : `${r.lag_days} d`}</td>
                <td className="td num text-ink2">{r.r?.toFixed(2) ?? "–"}</td><td className="td num font-medium">{r.r_adjusted?.toFixed(2) ?? "–"}</td>
                <td className="td !text-left"><Tag tone={sTone(r.strength)}>{r.strength}{r.direction && r.strength !== "none" ? ` · ${r.direction}` : ""}</Tag></td>
              </tr>))}</tbody>
          </table></div>
          <p className="label px-6 pb-3">Correlation shows association, not proof that spend caused the sales. “None” means extra spend cannot be shown to add sales in this data.</p>
        </Panel>

        <Panel title="Campaign profit after ad cost" sub="Margin earned on reported sales, minus spend" note={note("waste")}>
          <HBars signed currency={c} rows={[...rep.campaigns].sort((a, b) => b.profit_after_ads - a.profit_after_ads).map((x) => ({ label: x.name, value: x.profit_after_ads, sub: `spend ${money(x.spend, c, { compact: true })}` }))} />
        </Panel>

        <Panel title="All campaigns" sub="Including whether returns shrink as spend or time grows" note={<>{note("campaigns")}{note("diminishing")}</>}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead><tr><th className="th !text-left">Campaign</th><th className="th">Spend</th><th className="th">Reported sales</th><th className="th">ROAS</th><th className="th">Needs</th>
                <th className="th">ROAS 1st → 2nd half</th><th className="th">Spend vs ROAS r</th><th className="th">Profit after ads</th><th className="th !text-left">Verdict</th></tr></thead>
              <tbody>{rep.campaigns.map((x) => (
                <tr key={x.id}>
                  <td className="td !text-left"><div className="font-medium">{x.name}</div><div className="label">{NAMES[x.platform] ?? x.platform} · {x.objective}</div></td>
                  <td className="td num">{money(x.spend, c)}</td><td className="td num text-ink2">{money(x.conversion_value, c)}</td>
                  <td className="td num">{x.roas?.toFixed(2) ?? "–"}</td><td className="td num text-ink2">{x.break_even_roas?.toFixed(2) ?? "n/a"}</td>
                  <td className="td num text-ink2">{x.roas_first_half?.toFixed(2) ?? "–"} → <span className={x.roas_first_half && x.roas_second_half && x.roas_second_half < x.roas_first_half * 0.85 ? "text-neg" : ""}>{x.roas_second_half?.toFixed(2) ?? "–"}</span></td>
                  <td className="td num text-ink2">{x.spend_vs_roas_r?.toFixed(2) ?? "–"}</td>
                  <td className={`td num font-medium ${x.profit_after_ads < 0 ? "text-neg" : "text-pos"}`}>{money(x.profit_after_ads, c, { sign: true })}</td>
                  <td className="td !text-left">{x.verdict === "loses money" ? <Tag tone="neg">Losing money</Tag> : x.verdict === "scale" ? <Tag tone="pos">Scale up</Tag> : <Tag>Holding</Tag>}</td>
                </tr>))}</tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Ask about your advertising" sub="The analyst sees every campaign, daily spend, the correlations above, and your store's results" className="no-print">
          <div className="h-[560px] px-6 pb-5"><ChatView scope="ads" heading="Ask anything about your ads" /></div>
        </Panel>
      </div>
      <p className="label mt-4 hidden print:block">Generated by Profit Desk · {num(rep.daily.length)} days · correlation is association, not proof of cause.</p>
    </>
  );
}
