export type Store = {
  id: number; name: string; platform: "demo" | "shopify"; domain: string; currency: string;
  last_synced_at: string | null; last_sync_message: string; has_credentials: boolean;
  assumptions: Record<string, string>; counts: { products: number; orders: number; campaigns: number };
};
export type Totals = {
  orders: number; units: number; gross_revenue: number; discounts: number; net_revenue: number; refunds: number;
  revenue: number; cogs: number; fees: number; shipping: number; return_cost: number; contribution: number;
  ad_spend: number; ad_spend_unattributed: number; profit: number; margin_pct: number | null;
  contribution_margin_pct: number; aov: number | null; roas: number | null; mer: number | null; refund_rate_pct: number;
};
export type Product = {
  id: number | null; title: string; sku: string; category: string; units: number; orders: number; revenue: number;
  net_revenue: number; refunds: number; cogs: number; fees: number; shipping: number; return_cost: number;
  ad_spend: number; profit: number; margin_pct: number | null; refund_rate_pct: number; discount_rate_pct: number;
  missing_cost: boolean;
};
export type Campaign = {
  id: number; platform: string; name: string; objective: string; spend: number; impressions: number; clicks: number;
  conversions: number; conversion_value: number; roas: number | null; break_even_roas: number | null;
  profit_after_ads: number; cpc: number | null; cpa: number | null; margin_ratio_pct: number;
};
export type Finding = {
  id: string; kind: string; severity: "high" | "medium" | "low"; title: string; detail: string; impact: number;
  entity: string; action: string;
};
export type DayPoint = { date: string; revenue: number; ad_spend: number; profit: number; orders: number };

export class ApiError extends Error {}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try {
    r = await fetch(path, init);
  } catch {
    throw new ApiError("Cannot reach the backend. Is the Django server running on port 8000?");
  }
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(body.error || `Request failed (${r.status})`);
  return body as T;
}

export const get = <T,>(path: string) => req<T>(path);
export const post = <T,>(path: string, data?: unknown) =>
  req<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data ?? {}) });
export const patch = <T,>(path: string, data: unknown) =>
  req<T>(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
export const del = (path: string) => req<Record<string, never>>(path, { method: "DELETE" });
export const upload = <T,>(path: string, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return req<T>(path, { method: "POST", body: fd });
};
