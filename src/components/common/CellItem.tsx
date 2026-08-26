import { memo, type ReactNode } from "react";

export interface CellItemProps {
  icon: ReactNode;
  name: string;
  sub?: string;
  mono?: boolean;
}

/**
 * CellItem - the "icon + name + sub-label" pattern repeated inside table
 * cells across Products, Customers, Suppliers, Stock and Bank tables.
 */
function CellItemBase({ icon, name, sub, mono = false }: CellItemProps) {
  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <div>
        <div className="font-semibold text-ink">{name}</div>
        {sub ? (
          <div className={`text-[11.5px] text-ink-3 ${mono ? "font-mono" : ""}`}>
            {sub}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const CellItem = memo(CellItemBase);
