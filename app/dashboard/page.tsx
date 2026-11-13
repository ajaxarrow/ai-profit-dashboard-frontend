"use client";
import Link from "next/link";
import { DayPoint, Finding, Product, Store, Totals } from "@/lib/api";
import { useData } from "@/lib/use-data";
import { useNotes } from "@/lib/use-notes";
import { delta, money, num, pct } from "@/lib/format";
import { Breakdown, HBars, ProfitBars, RevenueVsAds } from "@/components/Charts";
import Findings from "@/components/Findings";
import { AiNote, Empty, ErrorBox, PageHeader, Panel, Skeleton, Stat } from "@/components/ui";

type Overview = {
  store: Store; period: { days: number; start: string; end: string }; totals: Totals; previous: Totals; series: DayPoint[];
  channels: { name: string; revenue: number; contribution: number }[]; categories: { name: string; revenue: number; contribution: number }[];
  campaigns: { id: number; platform: string; name: string; spend: number; roas: number | null; profit_after_ads: number }[];
  top_products: Product[]; worst_products: Product[]; findings: Finding[]; findings_total: number;
};

function Delta({ cur, prev, invert = false }: { cur: number; prev?: number | null; invert?: boolean }) {
  const d = delta(cur, prev);
  if (d === null) return null;
  if (Math.abs(d) < 0.5) return <span className="num text-[12px] text-ink3">flat vs previous</span>;
  const good = invert ? d < 0 : d > 0;
  return <span className={`num text-[12px] ${good ? "text-pos" : "text-neg"}`}>{d > 0 ? "▲" : "▼"} {Math.abs(d).toFixed(0)}% vs previous</span>;
}

export default function OverviewPage() {
  const { data, error, loading } = useData<Overview>("overview");
  const n = useNotes();
  if (error) return <ErrorBox message={error} />;
  if (loading || !data) return <div className="flex flex-col gap-6"><Skeleton className="h-12 w-72" /><Skeleton className="h-28" /><Skeleton className="h-56" /></div>;

  const { totals: t, previous: p, store } = data;
  const c = store.currency;
  const hasAds = t.ad_spend > 0;
  const note = (k: string) => <AiNote text={n.notes?.[k]} loading={n.loading} ai={n.ai} />;

  if (t.orders === 0) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <Panel><Empty title="No orders in this period" body="Pick a longer period, or sync this store from Data sources." action={<Link className="btn" href="/connect">Data sources</Link>} /></Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" sub={`${store.name} · ${data.period.start} to ${data.period.end}. Every figure is after returns, costs and ad spend.`}
        right={<button className="btn" onClick={n.rewrite} disabled={n.loading}>{n.loading ? "Writing notes…" : "Refresh AI notes"}</button>} />

      <div className="grid grid-cols-1 gap-5">
        <section className="card isolate">
          <div className="flex items-end justify-between gap-6 px-6 pt-5 max-sm:flex-col max-sm:items-start">
            <h2 className="serif text-[22px]">Net profit</h2>
            <div className="text-right max-sm:text-left">
              <div className={`serif num text-[52px] leading-none ${t.profit < 0 ? "text-neg" : "text-pos"}`}>{money(t.profit, c)}</div>
              <div className="mt-2 flex items-center justify-end gap-3 text-[12.5px] text-ink2 max-sm:justify-start"><span className="num">{pct(t.margin_pct)} of revenue</span><Delta cur={t.profit} prev={p.profit} /></div>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-6 px-6 pb-5 pt-6 max-lg:grid-cols-3 max-sm:grid-cols-2">
            <Stat label="Revenue" value={money(t.revenue, c, { compact: true })} sub={<Delta cur={t.revenue} prev={p.revenue} />} />
            <Stat label="Orders" value={num(t.orders)} sub={<Delta cur={t.orders} prev={p.orders} />} />
            <Stat label="Avg. order" value={money(t.aov, c)} />
            <Stat label="Ad spend" value={hasAds ? money(t.ad_spend, c, { compact: true }) : "–"} sub={hasAds ? <Delta cur={t.ad_spend} prev={p.ad_spend} invert /> : <span className="label">no ad data</span>} />
            <Stat label="Refund rate" value={pct(t.refund_rate_pct)} sub={<Delta cur={t.refund_rate_pct} prev={p.refund_rate_pct} invert />} />
          </div>
          {note("summary")}
        </section>

        <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
          <Panel title="Where the sales go" sub={`Of ${money(t.gross_revenue, c)} gross sales`} note={note("breakdown")}><Breakdown t={t} currency={c} /></Panel>
          <Panel title="Needs attention" sub={`${data.findings_total} findings, found automatically`} right={<Link href="/" className="btn">Command center</Link>}>
            {data.findings.length ? <Findings items={data.findings.slice(0, 3)} currency={c} /> : <Empty title="Nothing flagged" body="No product or campaign is losing money in this period." />}
          </Panel>
        </div>

        <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
          <Panel title="Daily profit" sub="After cost, fees, shipping, returns and ads" note={note("daily")}><ProfitBars series={data.series} currency={c} /></Panel>
          <Panel title="Revenue vs ad spend" sub="The gap is what is left to pay for everything else" note={note("advertising")}><RevenueVsAds series={data.series} currency={c} /></Panel>
        </div>

        <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
          <Panel title="Revenue by channel" sub="Where orders come from" note={note("channels")}>
            <HBars rows={data.channels.map((x) => ({ label: x.name[0].toUpperCase() + x.name.slice(1), value: x.revenue }))} currency={c} tint="var(--blue-bg)" ink="var(--blue)" />
          </Panel>
          <Panel title="Revenue by category" sub="Net of refunds" note={note("categories")}>
            <HBars rows={data.categories.map((x) => ({ label: x.name, value: x.revenue }))} currency={c} tint="var(--lav-bg)" ink="var(--lav)" />
          </Panel>
        </div>

        {hasAds && (
          <Panel title="Campaign profit after ad cost" sub="Margin earned on reported sales, minus spend" right={<Link href="/campaigns" className="btn">All campaigns</Link>} note={note("campaigns")}>
            <HBars signed currency={c} rows={[...data.campaigns].sort((a, b) => b.profit_after_ads - a.profit_after_ads).map((x) => ({ label: x.name, value: x.profit_after_ads, sub: `spend ${money(x.spend, c, { compact: true })}` }))} />
          </Panel>
        )}

        <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
          <ProductList title="Most profitable" items={data.top_products} currency={c} note={note("top_products")} />
          <ProductList title="Least profitable" items={data.worst_products} currency={c} note={note("worst_products")} />
        </div>
      </div>
    </>
  );
}

function ProductList({ title, items, currency, note }: { title: string; items: Product[]; currency: string; note: React.ReactNode }) {
  return (
    <Panel title={title} right={<Link href="/products" className="label underline-offset-2 hover:underline">All products</Link>} note={note}>
      <table className="mb-2 w-full text-[13px]">
        <thead><tr><th className="th !text-left">Product</th><th className="th">Revenue</th><th className="th">Profit</th></tr></thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.title}>
              <td className="td !text-left"><div className="max-w-[230px] truncate">{p.title}</div></td>
              <td className="td num text-ink2">{money(p.revenue, currency)}</td>
              <td className={`td num font-medium ${p.profit < 0 ? "text-neg" : ""}`}>{money(p.profit, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
