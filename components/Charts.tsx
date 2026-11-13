"use client";
import { useState } from "react";
import { DayPoint, Totals } from "@/lib/api";
import { money, shortDate } from "@/lib/format";

const W = 470, H = 200, PL = 44, PB = 22, PT = 10;

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="pointer-events-none absolute right-0 top-0 rounded-lg border border-line bg-panel px-3 py-2 text-[12px] shadow-[0_4px_16px_rgba(60,50,20,0.08)]">{children}</div>;
}

function XLabels({ series, bw }: { series: DayPoint[]; bw: number }) {
  return (
    <>
      {[0, Math.floor(series.length / 2), series.length - 1].map((i) => series[i] && (
        <text key={i} x={PL + i * bw + bw / 2} y={H - 5} textAnchor={i === 0 ? "start" : i === series.length - 1 ? "end" : "middle"} fontSize="9" fill="var(--ink-3)">{shortDate(series[i].date)}</text>
      ))}
    </>
  );
}

/** Daily profit bars: green above zero, red below. */
export function ProfitBars({ series, currency }: { series: DayPoint[]; currency: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...series.map((d) => d.profit));
  const min = Math.min(0, ...series.map((d) => d.profit));
  const span = max - min || 1;
  const y = (v: number) => PT + ((max - v) / span) * (H - PT - PB);
  const bw = (W - PL) / series.length;
  const h = hover !== null ? series[hover] : null;
  return (
    <div className="relative px-6">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Daily profit">
        {[max, 0, ...(min < 0 ? [min] : [])].map((t) => (
          <g key={t}>
            <line x1={PL} x2={W} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray={t === 0 ? "" : "2 4"} />
            <text x={PL - 8} y={y(t) + 3} textAnchor="end" fontSize="9" fill="var(--ink-3)" className="num">{money(t, "", { compact: true }).trim()}</text>
          </g>
        ))}
        {series.map((d, i) => (
          <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <rect x={PL + i * bw} y={0} width={bw} height={H - PB} fill="transparent" />
            <rect x={PL + i * bw + bw * 0.16} y={Math.min(y(d.profit), y(0))} width={bw * 0.68} height={Math.max(1, Math.abs(y(d.profit) - y(0)))} rx={2}
              fill={d.profit < 0 ? "var(--neg)" : "var(--pos)"} opacity={hover === null || hover === i ? 1 : 0.4} />
          </g>
        ))}
        <XLabels series={series} bw={bw} />
      </svg>
      {h && <Tip><div className="font-medium">{shortDate(h.date)}</div>
        <div className="num text-ink2">Profit <span className={h.profit < 0 ? "text-neg" : "text-pos"}>{money(h.profit, currency)}</span></div>
        <div className="num text-ink2">{h.orders} orders</div></Tip>}
    </div>
  );
}

/** Revenue (filled area) against ad spend (line), same axis, so the gap between them is visible. */
export function RevenueVsAds({ series, currency }: { series: DayPoint[]; currency: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...series.map((d) => Math.max(d.revenue, d.ad_spend)));
  const y = (v: number) => PT + ((max - v) / max) * (H - PT - PB);
  const bw = (W - PL) / series.length;
  const x = (i: number) => PL + i * bw + bw / 2;
  const line = (k: "revenue" | "ad_spend") => series.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(d[k]).toFixed(1)}`).join(" ");
  const area = `${line("revenue")} L${x(series.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`;
  const h = hover !== null ? series[hover] : null;
  return (
    <div className="relative px-6">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Revenue and ad spend per day">
        {[max, max / 2, 0].map((t) => (
          <g key={t}>
            <line x1={PL} x2={W} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray={t === 0 ? "" : "2 4"} />
            <text x={PL - 8} y={y(t) + 3} textAnchor="end" fontSize="9" fill="var(--ink-3)" className="num">{money(t, "", { compact: true }).trim()}</text>
          </g>
        ))}
        <path d={area} fill="var(--blue-bg)" />
        <path d={line("revenue")} fill="none" stroke="var(--blue)" strokeWidth="1.5" strokeLinejoin="round" />
        <path d={line("ad_spend")} fill="none" stroke="var(--peach)" strokeWidth="1.5" strokeLinejoin="round" />
        {series.map((d, i) => <rect key={d.date} x={PL + i * bw} y={0} width={bw} height={H - PB} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />)}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PT} y2={y(0)} stroke="var(--ink-3)" strokeDasharray="2 3" />}
        <XLabels series={series} bw={bw} />
      </svg>
      <div className="mt-1 flex gap-5 text-[11.5px] text-ink2">
        <span className="flex items-center gap-1.5"><i className="h-0.5 w-4 bg-blue" />Revenue</span>
        <span className="flex items-center gap-1.5"><i className="h-0.5 w-4 bg-peach" />Ad spend</span>
      </div>
      {h && <Tip><div className="font-medium">{shortDate(h.date)}</div>
        <div className="num text-ink2">Revenue {money(h.revenue, currency)}</div><div className="num text-ink2">Ad spend {money(h.ad_spend, currency)}</div></Tip>}
    </div>
  );
}

/** Horizontal bars. Values can be negative (drawn red, growing left of a centre axis). */
export function HBars({ rows, currency, signed = false, tint = "var(--blue-bg)", ink = "var(--blue)", empty = "No data" }: {
  rows: { label: string; value: number; sub?: string }[]; currency: string; signed?: boolean; tint?: string; ink?: string; empty?: string;
}) {
  if (!rows.length) return <p className="px-6 pb-4 text-[13px] text-ink2">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
  const hasNeg = signed && rows.some((r) => r.value < 0);
  return (
    <ul className="px-6 pb-3">
      {rows.map((r) => {
        const w = (Math.abs(r.value) / max) * (hasNeg ? 50 : 100);
        const neg = r.value < 0;
        return (
          <li key={r.label} className="py-1.5">
            <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
              <span className="min-w-0 truncate">{r.label}{r.sub && <span className="label ml-2">{r.sub}</span>}</span>
              <span className={`num shrink-0 ${neg ? "text-neg" : "text-ink2"}`}>{money(r.value, currency, { compact: true, sign: signed && !neg })}</span>
            </div>
            <div className="relative mt-1 h-2 rounded-full bg-[#f0ecdd]">
              <div className="absolute top-0 h-full rounded-full" style={{
                width: `${w}%`, left: hasNeg ? (neg ? `${50 - w}%` : "50%") : 0,
                background: signed ? (neg ? "var(--neg)" : "var(--pos)") : tint, outline: signed ? "none" : `1px solid ${ink}22`,
              }} />
              {hasNeg && <div className="absolute left-1/2 top-[-2px] h-3 w-px bg-line2" />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Where every franc of sales goes, in the design's pastel tints. */
export function Breakdown({ t, currency }: { t: Totals; currency: string }) {
  const gross = t.gross_revenue || 1;
  const parts = [
    { k: "Discounts", v: t.discounts, c: "#fde5d2" },
    { k: "Refunds", v: t.refunds, c: "#f3cdbd" },
    { k: "Product cost", v: t.cogs, c: "#dfe6fb" },
    { k: "Fees, shipping, returns", v: t.fees + t.shipping + t.return_cost, c: "#ece4fb" },
    { k: "Advertising", v: t.ad_spend, c: "#d8c7ae" },
  ];
  return (
    <div className="px-6 pb-4">
      <div className="flex h-10 w-full overflow-hidden rounded-xl border border-line" role="img" aria-label={`Of ${money(gross, currency)} gross sales, ${money(t.profit, currency)} is profit`}>
        {parts.map((p) => <div key={p.k} style={{ width: `${(p.v / gross) * 100}%`, background: p.c }} title={`${p.k}: ${money(p.v, currency)}`} />)}
        {t.profit > 0 && <div style={{ width: `${(t.profit / gross) * 100}%`, background: "var(--pos)" }} title={`Profit: ${money(t.profit, currency)}`} />}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2">
        {parts.map((p) => (
          <li key={p.k} className="flex items-center gap-2 text-[12.5px]">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: p.c, outline: "1px solid #0000001a" }} />
            <span className="text-ink2">{p.k}</span>
            <span className="num ml-auto">{money(p.v, currency)}</span>
          </li>
        ))}
        <li className="flex items-center gap-2 text-[12.5px] font-medium">
          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: t.profit < 0 ? "var(--neg)" : "var(--pos)" }} />
          <span>Profit</span>
          <span className={`num ml-auto ${t.profit < 0 ? "text-neg" : "text-pos"}`}>{money(t.profit, currency)}</span>
        </li>
      </ul>
    </div>
  );
}

/** Each dot is one day: ad spend (x) against revenue (y), with the fitted line. A flat cloud means no visible link. */
export function Scatter({ points, slope, intercept, currency }: {
  points: { date: string; spend: number; revenue: number }[]; slope?: number; intercept?: number; currency: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const SW = 470, SH = 230, L = 46, B = 28, T = 10, R = 10;
  if (points.length < 2) return <p className="px-6 pb-4 text-[13px] text-ink2">Not enough days with spend.</p>;
  const mx = Math.max(...points.map((p) => p.spend)) * 1.05, my = Math.max(...points.map((p) => p.revenue)) * 1.08;
  const x = (v: number) => L + (v / mx) * (SW - L - R);
  const y = (v: number) => T + (1 - v / my) * (SH - T - B);
  const h = hover !== null ? points[hover] : null;
  return (
    <div className="relative px-6">
      <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full" role="img" aria-label="Daily ad spend against daily revenue">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={L} x2={SW - R} y1={y(my * f / 1.08)} y2={y(my * f / 1.08)} stroke="var(--line)" strokeDasharray={f ? "2 4" : ""} />
            <text x={L - 8} y={y(my * f / 1.08) + 3} textAnchor="end" fontSize="9" fill="var(--ink-3)" className="num">{money(my * f / 1.08, "", { compact: true }).trim()}</text>
            <text x={x(mx * f / 1.05)} y={SH - 10} textAnchor="middle" fontSize="9" fill="var(--ink-3)" className="num">{money(mx * f / 1.05, "", { compact: true }).trim()}</text>
          </g>
        ))}
        <text x={(SW + L) / 2} y={SH - 0} textAnchor="middle" fontSize="9" fill="var(--ink-3)">Daily ad spend</text>
        {slope !== undefined && intercept !== undefined && (
          <line x1={x(0)} y1={y(Math.max(0, intercept))} x2={x(mx)} y2={y(Math.min(my, intercept + slope * mx))} stroke="var(--peach)" strokeWidth="1.5" strokeDasharray="5 4" />
        )}
        {points.map((p, i) => (
          <circle key={p.date} cx={x(p.spend)} cy={y(p.revenue)} r={hover === i ? 5 : 3.2} fill="var(--blue)" fillOpacity={hover === null || hover === i ? 0.75 : 0.3}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
        ))}
      </svg>
      {h && <Tip><div className="font-medium">{shortDate(h.date)}</div><div className="num text-ink2">Spend {money(h.spend, currency)}</div><div className="num text-ink2">Revenue {money(h.revenue, currency)}</div></Tip>}
    </div>
  );
}
