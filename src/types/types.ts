import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** The only two businesses the portal currently scopes data by. */
export type Toggle = "paints" | "interiors";

/** Semantic tone used by <Badge> and KPI deltas. */
export type Tone = "success" | "warn" | "danger" | "neutral" | "paints" | "interiors";
export type DeltaTone = "up" | "down" | "neutral";

export interface KpiItem {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: DeltaTone;
}

/** A single column definition consumed by <DataTable>. */
export interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "num";
}

/**
 * A table row is a plain object keyed by column `key`, whose values may
 * be plain strings/numbers or pre-rendered JSX (e.g. a <Badge>). `id` is
 * optional and used as the React key when present.
 */
export type TableRow = { id?: string | number } & Record<string, ReactNode>;

export interface NavItemType {
  key: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroupType {
  label: string;
  keys: string[];
}

/** Convenience helper type for the `{ paints: T; interiors: T }` shape
 * used by nearly every file in `src/data/`. */
export type ByToggle<T> = Record<Toggle, T>;
