const P: Record<string, string> = {
  package: "M3 6.5 10 3l7 3.5v7L10 17l-7-3.5v-7Z M3 6.5 10 10l7-3.5 M10 10v7",
  megaphone: "M3 11V8l11-4v12L3 12 M6 12l1.5 4h2L8.5 12.5",
  return: "M8 5 4 9l4 4 M4 9h8a4 4 0 0 1 0 8h-2",
  tag: "M3 3h7l7 7-7 7-7-7V3Z M7 7h.01",
  scale: "M10 3v14 M5 17h10 M4 7h12 M4 7l-2 5a2.5 2.5 0 0 0 4 0L4 7Z M16 7l-2 5a2.5 2.5 0 0 0 4 0l-2-5Z",
  rocket: "M10 17c0-3 1-5 4-8 1.5-1.5 3-2 3-2s-.5 1.5-2 3c-3 3-5 4-5 7Z M6 12c-1 0-3 1-3 5 4 0 5-2 5-3 M12 6l2 2",
  database: "M4 5c0-1.1 2.7-2 6-2s6 .9 6 2-2.7 2-6 2-6-.9-6-2Zm0 0v10c0 1.1 2.7 2 6 2s6-.9 6-2V5 M4 10c0 1.1 2.7 2 6 2s6-.9 6-2",
  trend: "M3 14l5-5 3 3 6-6 M13 6h4v4",
  trenddown: "M3 6l5 5 3-3 6 6 M13 14h4v-4",
  alert: "M10 3 2 17h16L10 3Z M10 8v4 M10 14.5h.01",
  check: "M4 10.5 8 14.5 16 6",
  sparkle: "M10 3v3M10 14v3M3 10h3M14 10h3M5.5 5.5l2 2M12.5 12.5l2 2M14.5 5.5l-2 2M7.5 12.5l-2 2",
  eye: "M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  search: "M9 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z M14 14l3 3",
  bulb: "M7 14h6 M8 17h4 M10 3a5 5 0 0 0-3 9c.6.6 1 1.2 1 2h4c0-.8.4-1.4 1-2a5 5 0 0 0-3-9Z",
  thumbs: "M7 9v8H4V9h3Z M7 9l3-6c1.5 0 2 1 2 2v3h4a1 1 0 0 1 1 1.2l-1 5.5a1 1 0 0 1-1 .8H7",
  flag: "M5 17V3 M5 4h9l-2 3 2 3H5",
  clock: "M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M10 6v4l3 2",
  play: "M6 4l10 6-10 6V4Z",
  arrow: "M4 10h12 M12 6l4 4-4 4",
  chat: "M4 4h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z",
  chevron: "M6 8l4 4 4-4",
  x: "M5 5l10 10M15 5 5 15",
};

export default function Icon({ name, className = "size-[18px]" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`${className} shrink-0`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={P[name] ?? P.sparkle} />
    </svg>
  );
}

export const KIND: Record<string, { icon: string; label: string; tone: string }> = {
  loss_product: { icon: "package", label: "Product losing money", tone: "bg-negbg text-neg" },
  loss_campaign: { icon: "megaphone", label: "Campaign losing money", tone: "bg-negbg text-neg" },
  returns: { icon: "return", label: "High returns", tone: "bg-warnbg text-warn" },
  discount: { icon: "tag", label: "Discount leak", tone: "bg-peachbg text-peach" },
  store_mer: { icon: "scale", label: "Ad efficiency", tone: "bg-negbg text-neg" },
  scale_campaign: { icon: "rocket", label: "Scale opportunity", tone: "bg-posbg text-pos" },
  data_quality: { icon: "database", label: "Missing data", tone: "bg-warnbg text-warn" },
  trend_profit: { icon: "trenddown", label: "Profit trend", tone: "bg-warnbg text-warn" },
  trend_campaign: { icon: "trenddown", label: "Campaign decaying", tone: "bg-warnbg text-warn" },
  trend_refund: { icon: "return", label: "Returns rising", tone: "bg-warnbg text-warn" },
};
