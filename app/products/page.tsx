"use client";
import { Fragment, useMemo, useState } from "react";
import { Product } from "@/lib/api";
import { useData } from "@/lib/use-data";
import { money, num, pct } from "@/lib/format";
import { useNotes } from "@/lib/use-notes";
import { AiNote, Empty, ErrorBox, PageHeader, Panel, Skeleton, Tag } from "@/components/ui";

type Resp = { currency: string; products: Product[] };
type Key = "title" | "revenue" | "units" | "refund_rate_pct" | "ad_spend" | "profit" | "margin_pct";

export default function ProductsPage() {
  const { data, error, loading } = useData<Resp>("products");
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "profit", dir: -1 });
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const n = useNotes();

  const rows = useMemo(() => {
    if (!data) return [];
    const f = data.products.filter((p) => `${p.title} ${p.sku} ${p.category}`.toLowerCase().includes(q.toLowerCase()));
    return [...f].sort((a, b) => {
      const av = a[sort.key] ?? -Infinity, bv = b[sort.key] ?? -Infinity;
      return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
    });
  }, [data, sort, q]);

  if (error) return <ErrorBox message={error} />;
  const c = data?.currency ?? "CHF";
  const maxAbs = Math.max(1, ...(data?.products.map((p) => Math.abs(p.profit)) ?? []));

  const H = ({ k, children, left }: { k: Key; children: React.ReactNode; left?: boolean }) => (
    <th className={`th ${left ? "!text-left" : ""}`} aria-sort={sort.key === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button className="cursor-pointer transition-colors duration-100 hover:text-ink" onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? (-s.dir as 1 | -1) : -1 }))}>
        {children}{sort.key === k ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );

  return (
    <>
      <PageHeader title="Products" sub="True profit per product: revenue after refunds, minus product cost, fees, shipping, return handling and its own ad spend."
        right={<><label htmlFor="search" className="sr-only">Search products</label><input id="search" className="field !w-60" placeholder="Search product or SKU" value={q} onChange={(e) => setQ(e.target.value)} /></>} />
      <Panel note={<AiNote text={n.notes?.products} loading={n.loading} ai={n.ai} />}>
        {loading || !data ? <div className="space-y-2 p-5">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div> :
          rows.length === 0 ? <Empty title="No products match" body="Try a different search, or a longer period." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead><tr>
                <H k="title" left>Product</H><H k="units">Units</H><H k="revenue">Revenue</H><H k="refund_rate_pct">Returns</H>
                <H k="ad_spend">Ad spend</H><H k="profit">Profit</H><H k="margin_pct">Margin</H>
              </tr></thead>
              <tbody>
                {rows.map((p) => {
                  const k = p.sku || p.title;
                  return (
                    <Fragment key={k}>
                      <tr className="cursor-pointer" onClick={() => setOpen(open === k ? null : k)}>
                        <td className="td !text-left">
                          <button className="flex flex-col items-start text-left" aria-expanded={open === k}>
                            <span className="max-w-[320px] truncate font-medium">{p.title}</span>
                            <span className="label">{p.category}{p.missing_cost && <> · <Tag tone="warn">no cost price</Tag></>}</span>
                          </button>
                        </td>
                        <td className="td num text-ink2">{num(p.units)}</td>
                        <td className="td num">{money(p.revenue, c)}</td>
                        <td className={`td num ${p.refund_rate_pct >= 15 ? "font-medium text-neg" : "text-ink2"}`}>{pct(p.refund_rate_pct)}</td>
                        <td className="td num text-ink2">{p.ad_spend ? money(p.ad_spend, c) : "–"}</td>
                        <td className="td">
                          <div className="flex items-center justify-end gap-3">
                            <div className="h-1.5 w-20 rounded-sm bg-[#f0ecdd]"><div className="h-full rounded-sm" style={{ width: `${(Math.abs(p.profit) / maxAbs) * 100}%`, background: p.profit < 0 ? "var(--neg)" : "var(--pos)" }} /></div>
                            <span className={`num w-20 font-medium ${p.profit < 0 ? "text-neg" : ""}`}>{money(p.profit, c)}</span>
                          </div>
                        </td>
                        <td className={`td num ${p.margin_pct !== null && p.margin_pct < 0 ? "text-neg" : "text-ink2"}`}>{pct(p.margin_pct)}</td>
                      </tr>
                      {open === k && (
                        <tr className="hover:!bg-transparent"><td colSpan={7} className="border-t border-line bg-[#f6f2e4] px-5 py-4 !text-left">
                          <div className="grid max-w-[720px] grid-cols-3 gap-x-10 gap-y-2 text-[12px] max-sm:grid-cols-1">
                            {([["Sales after discounts", p.net_revenue], ["Refunds", -p.refunds], ["Product cost", -p.cogs], ["Payment fees", -p.fees],
                              ["Shipping (net)", -p.shipping], ["Return handling", -p.return_cost], ["Own ad spend", -p.ad_spend]] as [string, number][]).map(([l, v]) => (
                              <div key={l} className="flex justify-between border-b border-line2/60 py-1"><span className="text-ink2">{l}</span><span className="num">{money(v, c)}</span></div>
                            ))}
                            <div className="flex justify-between py-1 font-medium"><span>Profit</span><span className={`num ${p.profit < 0 ? "text-neg" : "text-pos"}`}>{money(p.profit, c)}</span></div>
                          </div>
                          <p className="label mt-3">Discount rate {pct(p.discount_rate_pct)} · {p.orders} orders</p>
                        </td></tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
