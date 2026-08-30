import { memo, type ReactNode } from "react";
import clsx from "clsx";
import type { Toggle, Tone } from "@/types/types";

const TONE_CLASSES: Record<Tone, string> = {
  success:   "bg-success-soft   text-success",
  warn:      "bg-warn-soft      text-warn",
  danger:    "bg-danger-soft    text-danger",
  neutral:   "bg-surface-2      text-ink-2    border border-border",
  paints:    "bg-paints-soft    text-paints",
  interiors: "bg-interiors-soft text-interiors",
};

export interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

function BadgeBase({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export const Badge = memo(BadgeBase);

function BusinessBadgeBase({ business }: { business: Toggle }) {
  return (
    <Badge tone={business === "paints" ? "paints" : "interiors"}>
      {business === "paints" ? "Paints" : "Interiors"}
    </Badge>
  );
}

export const BusinessBadge = memo(BusinessBadgeBase);
