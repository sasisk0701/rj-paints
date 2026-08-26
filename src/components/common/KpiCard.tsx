import { memo, useMemo } from "react";
import clsx from "clsx";
import type { DeltaTone, KpiItem } from "@/types/types";

const DELTA_CLASSES: Record<DeltaTone, string> = {
  up: "text-success",
  down: "text-danger",
  neutral: "text-ink-3",
};

export interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: DeltaTone;
}

/**
 * KpiCard - a single metric card (label, big value, delta line).
 */
function KpiCardBase({ label, value, delta, deltaTone = "neutral" }: KpiCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">
        {label}
      </div>
      <div className="font-display text-[26px] font-semibold mt-1.5">
        {value}
      </div>
      {delta ? (
        <div
          className={clsx(
            "text-xs font-semibold mt-1.5",
            DELTA_CLASSES[deltaTone]
          )}
        >
          {delta}
        </div>
      ) : null}
    </div>
  );
}
export const KpiCard = memo(KpiCardBase);

export interface KpiRowProps {
  items: KpiItem[];
}

/**
 * KpiRow - responsive grid of KpiCards.
 *
 * The grid markup is memoized on `items` so re-renders triggered by
 * unrelated state (e.g. a filter chip elsewhere on the page) don't force
 * every KPI card to re-mount.
 */
function KpiRowBase({ items }: KpiRowProps) {
  const cards = useMemo(
    () =>
      items.map((item) => (
        <KpiCard
          key={item.label}
          label={item.label}
          value={item.value}
          delta={item.delta}
          deltaTone={item.deltaTone}
        />
      )),
    [items]
  );

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5 mb-5">
      {cards}
    </div>
  );
}
export const KpiRow = memo(KpiRowBase);
