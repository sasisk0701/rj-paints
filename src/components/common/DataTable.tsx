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
  selectable?: boolean;
  selectedRowIds?: Array<string | number>;
  onSelectionChange?: (ids: Array<string | number>) => void;
}

/**
 * DataTable
 * ---------
 * Generic table used across every module page (Products, Purchases,
 * Sales, Bank, etc.) so table markup, header styling and pagination
 * footer only exist in one place.
 *
 * Selection is opt-in. Finance pages use it to generate a single bill
 * from multiple visible records, while every existing non-finance table
 * keeps the same markup/behaviour as before.
 */
function DataTableBase({
  columns,
  rows,
  title,
  subtitle,
  actions,
  paginationText,
  loading,
  selectable = false,
  selectedRowIds = [],
  onSelectionChange,
}: DataTableProps) {
  const selectedSet = useMemo(() => new Set(selectedRowIds), [selectedRowIds]);
  const selectableIds = useMemo(
    () => rows.map((row) => row.id).filter((id): id is string | number => id !== undefined),
    [rows]
  );
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedSet.has(id));
  const someSelected = selectableIds.some((id) => selectedSet.has(id));

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(Array.from(new Set([...selectedRowIds, ...selectableIds])));
      return;
    }
    const visibleIds = new Set(selectableIds);
    onSelectionChange(selectedRowIds.filter((id) => !visibleIds.has(id)));
  };

  const handleSelectOne = (id: string | number, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(Array.from(new Set([...selectedRowIds, id])));
    } else {
      onSelectionChange(selectedRowIds.filter((selectedId) => selectedId !== id));
    }
  };

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
            <tr>
              {selectable ? (
                <th className="w-10 px-3 py-2.5 border-b border-border bg-surface-2 text-center">
                  <input
                    type="checkbox"
                    aria-label="Select all visible records"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={(event) => handleSelectAll(event.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-blue-600"
                  />
                </th>
              ) : null}
              {headerCells}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rowId = row.id;
              const isSelected = rowId !== undefined && selectedSet.has(rowId);
              return (
                <tr key={rowId ?? idx} className={clsx("hover:bg-surface-2", isSelected && "bg-blue-50/60")}>
                  {selectable ? (
                    <td className="w-10 px-3 py-3 border-b border-border text-center align-middle">
                      {rowId !== undefined ? (
                        <input
                          type="checkbox"
                          aria-label={`Select record ${String(rowId)}`}
                          checked={isSelected}
                          onChange={(event) => handleSelectOne(rowId, event.target.checked)}
                          className="h-4 w-4 cursor-pointer accent-blue-600"
                        />
                      ) : null}
                    </td>
                  ) : null}
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
              );
            })}
          </tbody>
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
