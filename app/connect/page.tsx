"use client";
import { useState } from "react";
import { del, patch, post, Store, upload } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import { ago, num } from "@/lib/format";
import { ErrorBox, PageHeader, Panel, Tag } from "@/components/ui";

const FUTURE = ["Google Ads", "Meta Ads", "TikTok Ads", "Google Merchant Center", "Google Analytics 4"];
const ASSUME: [string, string, string][] = [
  ["payment_fee_pct", "Payment fee, %", "Charged on every order"],
  ["payment_fee_fixed", "Payment fee, fixed", "Per order"],
  ["default_shipping_cost", "Shipping cost per order", "What the carrier costs you"],
  ["return_handling_cost", "Handling per returned unit", "Labour, return shipping, repackaging"],
];

export default function ConnectPage() {
  const { stores, store, refreshStores, setStoreId, readOnly } = useApp();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [f, setF] = useState({ domain: "", access_token: "", client_id: "", client_secret: "" });
  const [mode, setMode] = useState<"token" | "client">("token");
  const [confirmId, setConfirmId] = useState<number | null>(null);

  async function remove(s: Store) {
    setBusy(`del${s.id}`); setMsg(null);
    try {
      await del(`/api/stores/${s.id}/`);
      const left = await refreshStores();
      if (left.length) setStoreId(left[0].id);
      setConfirmId(null);
      setMsg({ ok: true, text: `Removed ${s.name} from this app. Nothing was changed in Shopify. You can connect it again above.` });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    setBusy(null);
  }

  async function run<T extends { message: string; store?: Store }>(key: string, fn: () => Promise<T>) {
    setBusy(key); setMsg(null);
    try { const r = await fn(); await refreshStores(); if (r.store) setStoreId(r.store.id); setMsg({ ok: true, text: r.message }); return r; }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setBusy(null); }
  }

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    const r = await run("connect", () => post<{ message: string; store: Store }>("/api/stores/shopify/", f));
    if (r?.store) await run("sync", () => post<{ message: string; store: Store }>(`/api/stores/${r.store.id}/sync/`, { days: 90 }));
  }

  return (
    <>
      <PageHeader title="Data sources" sub="Every source is a connector that writes into one shared data model, so new sources never change the dashboard or the AI." />
      {msg && <div className="mb-4">{msg.ok ? <div role="status" className="rounded-lg border border-pos/30 bg-posbg px-4 py-3 text-[13px] text-pos">{msg.text}</div> : <ErrorBox message={msg.text} />}</div>}

      {readOnly && (
        <div role="note" className="mb-4 rounded-xl border border-line2 bg-[#f6f2e4] px-4 py-3 text-[13px] text-ink2">
          This is a read-only demo of a Shopify store that is already connected, with its ad data imported. Connecting, syncing, importing and removing are switched off here.
        </div>
      )}
      <fieldset disabled={readOnly} className="contents">
      <div className="grid grid-cols-[1.1fr_1fr] items-start gap-6 max-lg:grid-cols-1">
        <Panel title="Shopify" sub="Products, orders, refunds, discounts and cost per item. Read-only access.">
          <form className="grid gap-3 px-5 pb-5" onSubmit={connect}>
            <div><label className="label" htmlFor="dom">Store domain</label><input id="dom" required className="field" value={f.domain} onChange={(e) => setF({ ...f, domain: e.target.value })} placeholder="your-store.myshopify.com" /></div>
            <div className="flex gap-1 text-[12px]" role="tablist">
              {([["token", "Admin API token"], ["client", "Client ID + secret"]] as const).map(([k, l]) => (
                <button type="button" key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)}
                  className={`rounded px-2 py-1 transition-colors duration-100 ${mode === k ? "bg-pill font-medium" : "text-ink2 hover:bg-[#efebd9]"}`}>{l}</button>
              ))}
            </div>
            {mode === "token" ? (
              <div><label className="label" htmlFor="tok">Access token</label><input id="tok" type="password" autoComplete="off" className="field" value={f.access_token} onChange={(e) => setF({ ...f, access_token: e.target.value })} placeholder="shpat_…" /></div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label" htmlFor="cid">Client ID</label><input id="cid" autoComplete="off" className="field" value={f.client_id} onChange={(e) => setF({ ...f, client_id: e.target.value })} /></div>
                <div><label className="label" htmlFor="cs">Client secret</label><input id="cs" type="password" autoComplete="off" className="field" value={f.client_secret} onChange={(e) => setF({ ...f, client_secret: e.target.value })} /></div>
              </div>
            )}
            <p className="label">Scopes needed: read_products, read_orders, read_inventory (add read_all_orders for history beyond 60 days).</p>
            <div><button className="btn btn-primary" disabled={!!busy}>{busy === "connect" ? "Connecting…" : busy === "sync" ? "Importing 90 days…" : "Connect and import"}</button></div>
          </form>
        </Panel>

        <Panel title="Connected stores">
          <ul>
            {stores.length === 0 && <li className="px-5 pb-5 text-[13px] text-ink2">Nothing connected yet.</li>}
            {stores.map((s, i) => (
              <li key={s.id} className={`px-5 py-3.5 ${i ? "border-t border-line" : ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium">{s.name} <Tag tone={s.platform === "demo" ? "warn" : "pos"}>{s.platform === "demo" ? "demo data" : "live"}</Tag></p>
                    <p className="label">{num(s.counts.orders)} orders · {num(s.counts.products)} products · {num(s.counts.campaigns)} campaigns · synced {ago(s.last_synced_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button className="btn" disabled={!!busy} onClick={() => run(`sync${s.id}`, () => post<{ message: string; store: Store }>(`/api/stores/${s.id}/sync/`, { days: 90 }))}>
                      {busy === `sync${s.id}` ? "Syncing…" : s.platform === "demo" ? "Reset demo" : "Sync now"}
                    </button>
                    {s.platform === "shopify" && (confirmId === s.id ? (
                      <>
                        <button className="btn !border-neg/40 !text-neg" disabled={!!busy} onClick={() => remove(s)}>{busy === `del${s.id}` ? "Removing…" : "Yes, remove"}</button>
                        <button className="btn" onClick={() => setConfirmId(null)}>Cancel</button>
                      </>
                    ) : <button className="btn" disabled={!!busy} onClick={() => setConfirmId(s.id)}>Remove</button>)}
                  </div>
                </div>
                {s.last_sync_message && <p className="label mt-1">{s.last_sync_message}</p>}
              </li>
            ))}
          </ul>
          {!stores.some((s) => s.platform === "demo") && (
            <div className="border-t border-line px-5 py-3"><button className="btn" disabled={!!busy} onClick={() => run("demo", () => post<{ message: string; store: Store }>("/api/stores/demo/"))}>{busy === "demo" ? "Loading…" : "Load demo data"}</button></div>
          )}
        </Panel>

        {store && (
          <>
            <Panel title="Import ad spend (CSV)" sub={`Into ${store.name}. Export from Google Ads, Meta or TikTok, then map the columns.`}>
              <div className="flex items-center gap-3 px-5 pb-5">
                <label className="btn cursor-pointer">
                  {busy === "csv" ? "Importing…" : "Choose CSV file"}
                  <input type="file" accept=".csv,text/csv" className="sr-only" disabled={!!busy}
                    onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) run("csv", () => upload<{ message: string; store: Store }>(`/api/stores/${store.id}/import-ads/`, file)); }} />
                </label>
                <a className="label underline underline-offset-2" href="/api/ads-template/">Download template</a>
              </div>
            </Panel>

            <Panel title="Cost assumptions" sub="Shopify does not know these. They drive every profit figure.">
              <form className="grid grid-cols-2 gap-3 px-5 pb-5" key={store.id}
                onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); run("assume", () => patch<Store & { message: string }>(`/api/stores/${store.id}/`, Object.fromEntries(fd)).then((s) => ({ message: "Assumptions saved", store: s }))); }}>
                {ASSUME.map(([k, l, h]) => (
                  <div key={k}><label className="label" htmlFor={k}>{l}</label><input id={k} name={k} type="number" step="0.01" min="0" className="field num" defaultValue={store.assumptions[k]} /><p className="label mt-0.5">{h}</p></div>
                ))}
                <div className="col-span-2"><button className="btn" disabled={!!busy}>Save assumptions</button></div>
              </form>
            </Panel>
          </>
        )}
      </div>

      </fieldset>
      <h2 className="serif mb-2 mt-10 text-[19px]">Next connectors</h2>
      <p className="mb-3 max-w-[70ch] text-[13px] text-ink2">Each one is a single file implementing the same interface as the Shopify connector, so nothing else changes when they are added.</p>
      <div className="flex flex-wrap gap-2">{FUTURE.map((n) => <Tag key={n}>{n} · planned</Tag>)}</div>
    </>
  );
}
