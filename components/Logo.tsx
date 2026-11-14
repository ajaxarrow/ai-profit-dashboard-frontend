/** The Profit Desk mark: three rising bars, the last one green. Same artwork as app/icon.svg (the browser-tab icon). */
export default function Logo({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Profit Desk">
      <rect width="64" height="64" rx="14" fill="#1d1c18" />
      <rect x="14" y="34" width="10" height="14" rx="2" fill="#f5f1e3" />
      <rect x="27" y="26" width="10" height="22" rx="2" fill="#f5f1e3" />
      <rect x="40" y="16" width="10" height="32" rx="2" fill="#7cc462" />
    </svg>
  );
}
