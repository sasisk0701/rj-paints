import { useMemo } from "react";
import { Filter, Plus } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { stockData } from "@/data/stockData";
import { Toolbar,FilterChip } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { Badge } from "@/components/common/Badge";
import { KpiRow } from "@/components/common/KpiCard";
import { DataTable } from "@/components/common/DataTable";
import type { TableColumn } from "@/types/types";

const COLUMNS: TableColumn[] = [
  { key: "name", label: "Product" },
  { key: "opening", label: "Opening Stock", align: "num" },
  { key: "available", label: "Available Stock", align: "num" },
  { key: "min", label: "Min. Level", align: "num" },
  { key: "status", label: "Status" },
];

export default function StockOverview() {
  const { toggle } = useBusiness();
  const data = useMemo(() => stockData[toggle], [toggle]);

  const rows = useMemo(
    () =>
      data.rows.map((r) => ({
        id: r.name,
        ...r,
        status: <Badge tone={r.statusTone}>{r.status}</Badge>,
      })),
    [data.rows]
  );

  return (
    <div>
      <KpiRow items={data.kpis} />
      <Toolbar
        left={
          <>
            <FilterChip icon={Filter}>Category ▾</FilterChip>
            <FilterChip>{toggle === "paints" ? "Paints" : "Interiors"}</FilterChip>
          </>
        }
        right={
          <>
            <Button variant="ghost" size="sm">Stock History</Button>
            <Button variant="primary" size="sm" icon={Plus}>Stock Adjustment</Button>
          </>
        }
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        title="Product-wise Stock"
        subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business`}
        paginationText={data.pagination}
      />
    </div>
  );
}
