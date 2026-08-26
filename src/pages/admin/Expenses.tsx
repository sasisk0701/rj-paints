import { useMemo } from "react";
import { Filter, Plus } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { expensesData } from "@/data/financeData";
import { Toolbar,FilterChip } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { Badge } from "@/components/common/Badge.tsx";
import { KpiRow } from "@/components/common/KpiCard";
import type { TableColumn } from "@/types/types";
import { DataTable } from "@/components/common/DataTable";

const COLUMNS: TableColumn[] = [
  { key: "date", label: "Date" },
  { key: "category", label: "Category" },
  { key: "description", label: "Description" },
  { key: "mode", label: "Mode" },
  { key: "amount", label: "Amount", align: "num" },
];

export default function Expenses() {
  const { toggle } = useBusiness();
  const data = useMemo(() => expensesData[toggle], [toggle]);

  const rows = useMemo(
    () =>
      data.rows.map((r, i) => ({
        id: i,
        ...r,
        category: <Badge tone="neutral">{r.category}</Badge>,
      })),
    [data.rows]
  );

  return (
    <div>
      <KpiRow items={data.kpis} />
      <Toolbar
        left={<FilterChip icon={Filter}>{toggle === "paints" ? "Paints" : "Interiors"}</FilterChip>}
        right={<Button variant="primary" size="sm" icon={Plus}>Add Expense</Button>}
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        title="Expense History"
        subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business`}
        paginationText="Showing recent entries"
      />
    </div>
  );
}
