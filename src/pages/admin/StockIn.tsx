import { useMemo } from "react";
import { Filter, Plus } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { stockInData } from "@/data/stockInData";
import { Toolbar,FilterChip } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { Badge } from "@/components/common/Badge";
import { KpiRow } from "@/components/common/KpiCard";
import { DataTable } from "@/components/common/DataTable";
import type { TableColumn } from "@/types/types";

const COLUMNS: TableColumn[] = [
  { key: "ref", label: "Stock In #" },
  { key: "date", label: "Date" },
  { key: "source", label: "Source" },
  { key: "party", label: "Supplier" },
  { key: "product", label: "Product" },
  { key: "qty", label: "Qty", align: "num" },
  { key: "amount", label: "Amount", align: "num" },
  { key: "reference", label: "Reference" },
];

export default function StockIn() {
  const { toggle } = useBusiness();
  const data = useMemo(() => stockInData[toggle], [toggle]);

  const rows = useMemo(
    () =>
      data.rows.map((r) => ({
        id: r.ref,
        ...r,
        ref: <span className="font-mono">{r.ref}</span>,
        source: <Badge tone="neutral">{r.source}</Badge>,
        reference: <span className="font-mono">{r.reference}</span>,
      })),
    [data.rows]
  );

  return (
    <div>
      <KpiRow items={data.kpis} />
      <Toolbar
        left={
          <>
            <FilterChip icon={Filter}>Source ▾</FilterChip>
            <FilterChip>{toggle === "paints" ? "Paints" : "Interiors"}</FilterChip>
          </>
        }
        right={<Button variant="primary" size="sm" icon={Plus}>New Stock In</Button>}
      />
      <DataTable columns={COLUMNS} rows={rows} title="Stock In History" subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business`} paginationText={data.pagination} />
    </div>
  );
}
