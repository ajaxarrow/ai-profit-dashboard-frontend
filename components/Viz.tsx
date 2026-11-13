import { money } from "@/lib/format";

/* Small diagrams for a signal card. The backend sends `viz` as structured data; each type is drawn here. */
type V = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const TONES: Record<string, string> = { blue: "#dfe6fb", lav: "#ece4fb", tan: "#d8c7ae", peach: "#fde5d2" };

export default function Viz({ viz, currency }: { viz: V; currency: string }) {
  switch (viz?.type) {
    case "stack": return <Stack v={viz} c={currency} />;
    case "roas": return <Roas v={viz} c={currency} />;
    case "ring": return <Ring v={viz} />;
    case "spark": return <Spark v={viz} />;
    case "delta": return <Delta v={viz} />;
    case "chips": return <Chips v={viz} />;
    default: return null;
  }
}

/** Costs stacked against revenue: when the bar passes the revenue marker, the product loses money. */
function Stack({ v, c }: { v: V; c: string }) {
  const costs = v.parts.reduce((a: number, p: V) => a + p.value, 0);
  const scale = Math.max(v.revenue, costs) || 1;
  return (
    <div>
      <div className="relative h-9 overflow-hidden rounded-lg border border-line bg-[#f6f2e4]">
        <div className="flex h-full">
          {v.parts.map((p: V) => <div key={p.label} title={`${p.label}: ${money(p.value, c)}`} style={{ width: `${(p.value / scale) * 100}%`, background: TONES[p.tone] }} />)}
        </div>
        <div className="absolute top-0 h-full border-l-2 border-ink" style={{ left: `${(v.revenue / scale) * 100}%` }} />
      </div>
      <div className="relative mt-1 h-4 text-[11px] text-ink2">
        <span className="absolute -translate-x-full" style={{ left: `${(v.revenue / scale) * 100}%` }}>Revenue {money(v.revenue, c, { compact: true })}</span>
      </div>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {v.parts.filter((p: V) => p.value > 0).map((p: V) => (
          <li key={p.label} className="flex items-center gap-1.5 text-[11.5px] text-ink2"><i className="size-2.5 rounded-[3px] border border-black/10" style={{ background: TONES[p.tone] }} />{p.label} {money(p.value, c, { compact: true })}</li>
        ))}
      </ul>
      <p className={`mt-2 text-[12.5px] font-medium ${v.profit < 0 ? "text-neg" : "text-pos"}`}>{v.profit < 0 ? "Costs exceed revenue by" : "Profit"} {money(Math.abs(v.profit), c)}</p>
    </div>
  );
}

/** ROAS bar against the break-even tick: left of the tick = every franc spent loses money. */
function Roas({ v, c }: { v: V; c: string }) {
  const be = v.break_even, roas = v.roas ?? 0;
  const max = Math.max(roas * 1.15, (be ?? 0) * 1.4, 1);
  const ok = be ? roas >= be : roas >= 1;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[11.5px] text-ink2"><span>{v.label}</span><span className="num">{roas}{be ? ` · needs ${be}` : ""}</span></div>
      <div className="relative mt-1.5 h-3 rounded-full bg-[#f0ecdd]">
        <div className="h-full rounded-full" style={{ width: `${(roas / max) * 100}%`, background: ok ? "var(--pos)" : "var(--neg)" }} />
        {be && <div className="absolute -top-1 h-5 border-l-2 border-ink" style={{ left: `${(be / max) * 100}%` }} title={`Break-even ${be}`} />}
      </div>
      <div className="mt-1 h-4 text-[11px] text-ink2 relative">{be && <span className="absolute -translate-x-1/2" style={{ left: `${(be / max) * 100}%` }}>break-even</span>}</div>
      <p className="mt-1 text-[12.5px] text-ink2">Spent <span className="num text-ink">{money(v.spend, c, { compact: true })}</span>, margin earned back <span className={`num ${v.earned < v.spend ? "text-neg" : "text-pos"}`}>{money(v.earned, c, { compact: true })}</span></p>
    </div>
  );
}

/** Donut for a percentage with a tick at the store average. */
function Ring({ v }: { v: V }) {
  const R = 30, C = 2 * Math.PI * R, cap = Math.min(100, v.value);
  const a = (v.benchmark / 100) * 2 * Math.PI - Math.PI / 2;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 80 80" className="size-[84px] shrink-0" role="img" aria-label={`${v.value}% ${v.label}`}>
        <circle cx="40" cy="40" r={R} fill="none" stroke="#f0ecdd" strokeWidth="9" />
        <circle cx="40" cy="40" r={R} fill="none" stroke="var(--neg)" strokeWidth="9" strokeDasharray={`${(cap / 100) * C} ${C}`} transform="rotate(-90 40 40)" strokeLinecap="butt" />
        <line x1={40 + (R - 7) * Math.cos(a)} y1={40 + (R - 7) * Math.sin(a)} x2={40 + (R + 7) * Math.cos(a)} y2={40 + (R + 7) * Math.sin(a)} stroke="var(--ink)" strokeWidth="2" />
        <text x="40" y="44" textAnchor="middle" className="serif num" fontSize="15" fill="var(--ink)">{v.value}%</text>
      </svg>
      <div className="text-[12.5px] text-ink2"><p>{v.label}</p><p className="mt-1">{v.bench_label}: <span className="num text-ink">{v.benchmark}%</span> <span className="label">(the tick)</span></p></div>
    </div>
  );
}

/** Daily line with the last week highlighted. */
function Spark({ v }: { v: V }) {
  const s: number[] = v.series, W = 300, H = 70, mn = Math.min(...s, 0), mx = Math.max(...s, 1);
  const x = (i: number) => (i / (s.length - 1)) * W, y = (n: number) => 6 + (1 - (n - mn) / (mx - mn || 1)) * (H - 12);
  const path = (from: number, to: number) => s.slice(from, to).map((n, i) => `${i ? "L" : "M"}${x(from + i).toFixed(1)} ${y(n).toFixed(1)}`).join(" ");
  const cut = s.length - v.split;
  const d = v.before ? ((v.after - v.before) / Math.abs(v.before)) * 100 : 0;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={v.label}>
        <rect x={x(cut)} y="0" width={W - x(cut)} height={H} fill="#f6f2e4" />
        <line x1="0" x2={W} y1={y(0)} y2={y(0)} stroke="var(--line-strong)" strokeDasharray="2 3" />
        <path d={path(0, cut + 1)} fill="none" stroke="var(--ink-3)" strokeWidth="1.8" strokeLinejoin="round" />
        <path d={path(cut, s.length)} fill="none" stroke="var(--neg)" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-ink2"><span>{v.label}</span><span className="num text-neg">{d > 0 ? "+" : ""}{d.toFixed(0)}% week on week</span></div>
    </div>
  );
}

function Delta({ v }: { v: V }) {
  const d = v.before ? ((v.after - v.before) / Math.abs(v.before)) * 100 : 0;
  const bad = v.bad === "down" ? v.after < v.before : v.after > v.before;
  return (
    <div>
      <p className="label">{v.label}</p>
      <div className="mt-2 flex items-center gap-4">
        <span className="serif num text-[28px] text-ink3">{v.before}{v.unit}</span>
        <svg viewBox="0 0 24 12" className="w-8 text-ink3" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 6h20M17 2l4 4-4 4" /></svg>
        <span className={`serif num text-[28px] ${bad ? "text-neg" : "text-pos"}`}>{v.after}{v.unit}</span>
        <span className={`num rounded-md px-1.5 py-0.5 text-[12px] ${bad ? "bg-negbg text-neg" : "bg-posbg text-pos"}`}>{v.unit === "%" ? `${v.after - v.before > 0 ? "+" : ""}${(v.after - v.before).toFixed(1)} pts` : `${d > 0 ? "+" : ""}${d.toFixed(0)}%`}</span>
      </div>
    </div>
  );
}

function Chips({ v }: { v: V }) {
  return <div className="flex flex-wrap gap-1.5">{v.items.map((i: string) => <span key={i} className="rounded-md bg-warnbg px-2 py-1 text-[12px] text-warn">{i}</span>)}</div>;
}
