import { memo, type ChangeEvent, type ReactNode } from "react";
import { Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

export interface ToolbarProps {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}

/** Toolbar - left slot (filters) / right slot (actions), wraps on small screens. */
function ToolbarBase({ left, right, className }: ToolbarProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-3 flex-wrap mb-4",
        className
      )}
    >
      <div className="flex items-center gap-2.5 flex-wrap">{left}</div>
      <div className="flex items-center gap-2.5 flex-wrap">{right}</div>
    </div>
  );
}
export const Toolbar = memo(ToolbarBase);

export interface FilterChipProps {
  icon?: LucideIcon;
  children: ReactNode;
}

/** FilterChip - a small pill representing an active/available filter. */
function FilterChipBase({ icon: Icon, children }: FilterChipProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg bg-surface text-xs text-ink-2">
      {Icon ? <Icon size={14} /> : null}
      {children}
    </div>
  );
}
export const FilterChip = memo(FilterChipBase);

export interface SearchBoxProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

/**
 * SearchBox - decorative by default; pass value/onChange to make it a
 * controlled input.
 */
function SearchBoxBase({ placeholder = "Search…", value, onChange, className }: SearchBoxProps) {
  const isControlled = typeof onChange === "function";
  return (
    <div
      className={clsx(
        "flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-2.5 py-[7px] w-[220px]",
        className
      )}
    >
      <Search size={14} className="text-ink-3 flex-none" />
      {isControlled ? (
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="bg-transparent outline-none text-xs text-ink placeholder:text-ink-3 w-full"
        />
      ) : (
        <span className="text-xs text-ink-3">{placeholder}</span>
      )}
    </div>
  );
}
export const SearchBox = memo(SearchBoxBase);
