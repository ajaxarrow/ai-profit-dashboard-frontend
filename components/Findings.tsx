import { Finding } from "@/lib/api";
import { money } from "@/lib/format";
import { Tag, sevTone } from "./ui";

export default function Findings({ items, currency, showAction = false }: { items: Finding[]; currency: string; showAction?: boolean }) {
  return (
    <ul>
      {items.map((f, i) => (
        <li key={f.id} className={`px-6 py-4 ${i ? "border-t border-line" : ""}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Tag tone={sevTone[f.severity]}>{f.severity}</Tag>
                <p className="text-[13.5px] font-medium">{f.title}</p>
              </div>
              <p className="mt-1 max-w-[70ch] text-[13px] text-ink2">{f.detail}</p>
              {showAction && <p className="mt-1 max-w-[70ch] text-[13px]"><span className="text-ink3">Do: </span>{f.action}</p>}
            </div>
            {f.impact > 0 && (
              <div className="shrink-0 text-right">
                <div className="serif num text-[17px]">{money(f.impact, currency)}</div>
                <div className="label">at stake</div>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
