import { useMemo } from "react";
import { Filter, Plus } from "lucide-react";
import { purchasesData } from "@/data/tradeData";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { Toolbar,FilterChip } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/common/Badge";
import { KpiRow } from "@/components/common/KpiCard";
import type { TableColumn } from "@/types/types";


const COLUMNS: TableColumn[] = [
  { key: "po", label: "PO #" },
  { key: "date", label: "Date" },
  { key: "supplier", label: "Supplier" },
  { key: "items", label: "Items" },
  { key: "amount", label: "Amount", align: "num" },
  { key: "status", label: "Status" },
];

export default function Purchases() {
  const { toggle } = useBusiness();
  const data = useMemo(() => purchasesData[toggle], [toggle]);

  const rows = useMemo(
    () =>
      data.rows.map((r) => ({
        id: r.po,
        ...r,
        po: <span className="font-mono">{r.po}</span>,
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
            <FilterChip icon={Filter}>Supplier ▾</FilterChip>
            <FilterChip>{toggle === "paints" ? "Paints" : "Interiors"}</FilterChip>
          </>
        }
        right={<Button variant="primary" size="sm" icon={Plus}>New Purchase</Button>}
      />
      <DataTable columns={COLUMNS} rows={rows} title="Purchase History" subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business`} paginationText={data.pagination} />
    </div>
  );
}
