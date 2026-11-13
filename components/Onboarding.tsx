"use client";
import Link from "next/link";
import { useState } from "react";
import { post } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import { ErrorBox } from "./ui";

export default function Onboarding() {
  const { refreshStores } = useApp();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function demo() {
    setBusy(true);
    setErr(null);
    try { await post("/api/stores/demo/"); await refreshStores(); } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  return (
    <div className="max-w-[560px] pt-16">
      <h1 className="serif text-[44px] leading-[1.08]">What does your shop actually earn?</h1>
      <p className="mt-5 text-[15px] text-ink2">
        Revenue is easy to see. Profit is not: returns, discounts, payment fees, shipping and ad spend all take their cut.
        Connect a source and every number here is calculated after all of them.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/connect" className="btn btn-primary">Connect Shopify</Link>
        <button className="btn" onClick={demo} disabled={busy}>{busy ? "Loading demo…" : "Explore with demo data"}</button>
      </div>
      {err && <div className="mt-4"><ErrorBox message={err} /></div>}
    </div>
  );
}
