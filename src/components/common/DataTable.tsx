import { memo, useMemo, type ReactNode } from "react";
import clsx from "clsx";
import { Panel, PanelHeader } from "./Panel";
import type { TableColumn, TableRow } from "@/types/types";

export interface DataTableProps {
  columns: TableColumn[];
  rows: TableRow[];
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  paginationText?: string;
  loading?: boolean;
}

/**
 * DataTable
 * ---------
 * Generic table used across every module page (Products, Purchases,
 * Sales, Bank, etc.) so table markup, header styling and pagination
 * footer only exist in one place.
 *
 * Performance: the <thead> and <tbody> markup are each memoized so that
 * a re-render caused by something outside the table (e.g. the toolbar's
 * search input) doesn't force every row/cell to be recreated — only a
 * change to `columns` or `rows` does.
 */
function DataTableBase({ columns, rows, title, subtitle, actions, paginationText, loading }: DataTableProps) {
  const headerCells = useMemo(
    () =>
      columns.map((col) => (
        <th
          key={col.key}
          className={clsx(
            "text-left text-[11px] uppercase tracking-wide font-bold text-ink-3 px-3.5 py-2.5 border-b border-border bg-surface-2 whitespace-nowrap",
            col.align === "num" && "text-right"
          )}
        >
          {col.label}
        </th>
      )),
    [columns]
  );

  const bodyRows = useMemo(
    () =>
      rows.map((row, idx) => (
        <tr key={row.id ?? idx} className="hover:bg-surface-2">
          {columns.map((col) => (
            <td
              key={col.key}
              className={clsx(
                "px-3.5 py-3 border-b border-border align-middle text-[13px] text-ink last:border-b-0",
                col.align === "num" && "text-right font-mono"
              )}
            >
              {row[col.key]}
            </td>
          ))}
        </tr>
      )),
    [columns, rows]
  );

  return (
    <Panel>
      {title ? <PanelHeader title={title} subtitle={subtitle} actions={actions} /> : null}
      <div className="overflow-x-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-surface/60 flex items-center justify-center z-10">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
          </div>
        )}
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>{headerCells}</tr>
          </thead>
          <tbody>{bodyRows}</tbody>
        </table>
      </div>
      {paginationText ? (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border text-xs text-ink-3">
          <div>{paginationText}</div>
          <div className="flex gap-1">
            {["‹", "1", "2", "3", "›"].map((label, i) => (
              <div
                key={i}
                className={clsx(
                  "w-7 h-7 rounded-md border border-border flex items-center justify-center text-xs",
                  label === "1" ? "bg-primary border-primary text-white" : "text-ink-2"
                )}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

export const DataTable = memo(DataTableBase);
