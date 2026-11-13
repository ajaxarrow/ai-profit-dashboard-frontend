export function money(n: number | null | undefined, currency = "CHF", opts: { compact?: boolean; sign?: boolean } = {}) {
  if (n === null || n === undefined) return "–";
  const abs = Math.abs(n);
  const body =
    opts.compact && abs >= 10000
      ? `${(abs / 1000).toFixed(abs >= 100000 ? 0 : 1)}k`
      : abs.toLocaleString("de-CH", { maximumFractionDigits: 0 }).replace(/’/g, "’");
  const sign = n < 0 ? "−" : opts.sign && n > 0 ? "+" : "";
  return `${sign}${currency} ${body}`;
}
export const num = (n: number | null | undefined, d = 0) =>
  n === null || n === undefined ? "–" : n.toLocaleString("de-CH", { minimumFractionDigits: d, maximumFractionDigits: d });
export const pct = (n: number | null | undefined, d = 1) => (n === null || n === undefined ? "–" : `${n.toFixed(d)}%`);
export function delta(cur: number, prev: number | null | undefined) {
  if (prev === null || prev === undefined || prev === 0) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}
export const shortDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
export function ago(iso?: string | null) {
  if (!iso) return "never";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}
