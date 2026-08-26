import { useMemo } from "react";
import { Filter, Plus } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { salesData } from "@/data/tradeData";
import { Toolbar,FilterChip } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/common/Badge";
import { KpiRow } from "@/components/common/KpiCard";
import type { TableColumn } from "@/types/types";


const COLUMNS: TableColumn[] = [
  { key: "invoice", label: "Invoice #" },
  { key: "date", label: "Date" },
  { key: "customer", label: "Customer" },
  { key: "items", label: "Items" },
  { key: "amount", label: "Amount", align: "num" },
  { key: "status", label: "Status" },
];

export default function Sales() {
  const { toggle } = useBusiness();
  const data = useMemo(() => salesData[toggle], [toggle]);

  const rows = useMemo(
    () =>
      data.rows.map((r) => ({
        id: r.invoice,
        ...r,
        invoice: <span className="font-mono">{r.invoice}</span>,
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
            <FilterChip icon={Filter}>Customer ▾</FilterChip>
            <FilterChip>{toggle === "paints" ? "Paints" : "Interiors"}</FilterChip>
          </>
        }
        right={<Button variant="primary" size="sm" icon={Plus}>New Sale</Button>}
      />
      <DataTable columns={COLUMNS} rows={rows} title="Sales History" subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business`} paginationText={data.pagination} />
    </div>
  );
}
