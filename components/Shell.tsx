"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { get } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import { ago, money, pct } from "@/lib/format";
import Chat from "./Chat";
import Logo from "./Logo";
import Onboarding from "./Onboarding";
import { ErrorBox } from "./ui";

const I = (d: string) => (
  <svg viewBox="0 0 20 20" className="size-[17px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);
const NAV = [
  { href: "/", label: "Command center", icon: I("M10 3v3M10 14v3M3 10h3M14 10h3M5.5 5.5l2 2M12.5 12.5l2 2M14.5 5.5l-2 2M7.5 12.5l-2 2") },
  { href: "/dashboard", label: "Dashboard", icon: I("M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z M8 17v-5h4v5") },
  { href: "/products", label: "Products", icon: I("M3 6.5 10 3l7 3.5v7L10 17l-7-3.5v-7Z M3 6.5 10 10l7-3.5 M10 10v7") },
  { href: "/campaigns", label: "Advertising", icon: I("M3 11V8l11-4v12L3 12 M6 12l1.5 4h2L8.5 12.5") },
  { href: "/ask", label: "Ask AI", icon: I("M4 4h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z") },
  { href: "/connect", label: "Data sources", icon: I("M4 5c0-1.1 2.7-2 6-2s6 .9 6 2-2.7 2-6 2-6-.9-6-2Zm0 0v10c0 1.1 2.7 2 6 2s6-.9 6-2V5 M4 10c0 1.1 2.7 2 6 2s6-.9 6-2") },
];

type Summary = { totals: { profit: number; margin_pct: number | null } };

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { stores, store, setStoreId, days, setChatOpen, loaded, error, version } = useApp();
  const [sum, setSum] = useState<Summary | null>(null);
  const needsData = loaded && !error && stores.length === 0 && path !== "/connect";

  useEffect(() => {
    if (!store) return;
    let live = true;
    get<Summary>(`/api/overview/?store=${store.id}&days=${days}`).then((d) => live && setSum(d)).catch(() => live && setSum(null));
    return () => { live = false; };
  }, [store, days, version]);

  const c = store?.currency ?? "CHF";
  return (
    <div className="grid min-h-screen grid-cols-[264px_minmax(0,1fr)] gap-0 p-4 max-md:grid-cols-1 print:block print:p-0">
      <aside className="no-print sticky top-4 flex h-[calc(100vh-32px)] flex-col px-4 pb-4 pt-3 max-md:static max-md:h-auto">
        <Link href="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.01em]">
          <Logo className="size-7" /> Profit Desk
        </Link>

        <div className="mt-9">
          <p className="serif text-[26px] leading-[1.15]">Welcome back,</p>
          <p className="serif text-[24px] font-semibold leading-[1.15]">{store ? store.name : "friend"}!</p>
          <label htmlFor="store" className="sr-only">Store</label>
          <select id="store" className="mt-2 w-full cursor-pointer appearance-none bg-transparent text-[12.5px] text-ink2 outline-offset-4 hover:text-ink"
            value={store?.id ?? ""} onChange={(e) => setStoreId(Number(e.target.value))} disabled={!stores.length}>
            {stores.length === 0 && <option>No store connected</option>}
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}{s.platform === "demo" ? " · demo data" : " · live"} ▾</option>)}
          </select>
        </div>

        <nav className="mt-8 flex flex-col gap-1" aria-label="Main">
          {NAV.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] transition-colors duration-100 ${active ? "bg-pill font-medium text-ink" : "text-ink2 hover:bg-[#efebd9] hover:text-ink"}`}>
                {n.icon}{n.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <button className="btn btn-primary mb-5 w-full" onClick={() => setChatOpen(true)}>Quick question</button>
          <div className="cap !text-pos">Net profit · {days} days</div>
          <div className="serif num mt-0.5 text-[34px] leading-[1.1] text-pos">{sum ? money(sum.totals.profit, c) : "–"}</div>
          <div className="mt-3 flex items-baseline justify-between border-t border-line2/70 pt-3">
            <span className="cap">Margin % of revenue</span>
            <span className="num text-[14px]">{sum ? pct(sum.totals.margin_pct, 1) : "–"}</span>
          </div>
          {store && <p className="label mt-3">Synced {ago(store.last_synced_at)}</p>}
        </div>
      </aside>

      <main className="min-w-0 rounded-[28px] border border-[#efebdd] bg-panel px-14 py-10 shadow-[0_1px_2px_rgba(60,50,20,0.04),0_12px_32px_rgba(60,50,20,0.05)] max-md:px-5">
        <div className="mx-auto max-w-[1080px]">
          {error && <ErrorBox message={error} />}
          {needsData ? <Onboarding /> : children}
        </div>
      </main>
      <div className="no-print"><Chat /></div>
    </div>
  );
}
