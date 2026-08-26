import { useMemo } from "react";
import { Filter, Plus } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { cashData } from "@/data/financeData";
import { Toolbar,FilterChip } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/common/Badge.tsx";
import type { TableColumn } from "@/types/types";
import { KpiRow } from "@/components/common/KpiCard";

const COLUMNS: TableColumn[] = [
  { key: "date", label: "Date" },
  { key: "type", label: "Type" },
  { key: "description", label: "Description" },
  { key: "amount", label: "Amount", align: "num" },
  { key: "dir", label: "Dir." },
];

export default function Cash() {
  const { toggle } = useBusiness();
  const data = useMemo(() => cashData[toggle], [toggle]);

  const rows = useMemo(
    () =>
      data.rows.map((r, i) => ({
        id: i,
        ...r,
        type: <Badge tone="neutral">{r.type}</Badge>,
        dir: <Badge tone={r.dir === "Credit" ? "success" : "danger"}>{r.dir}</Badge>,
      })),
    [data.rows]
  );

  return (
    <div>
      <KpiRow items={data.kpis} />
      <Toolbar
        left={<FilterChip icon={Filter}>{toggle === "paints" ? "Paints" : "Interiors"}</FilterChip>}
        right={<Button variant="primary" size="sm" icon={Plus}>Record Cash Entry</Button>}
      />
      <DataTable columns={COLUMNS} rows={rows} title="Cash Transaction History" subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business`} paginationText="Showing recent entries" />
    </div>
  );
}
