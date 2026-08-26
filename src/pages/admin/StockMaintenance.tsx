import { useMemo } from "react";
import { Filter, Plus } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { stockMaintenanceData } from "@/data/stockMaintenanceData";
import { Toolbar,FilterChip } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { Badge } from "@/components/common/Badge";
import { KpiRow } from "@/components/common/KpiCard";
import { DataTable } from "@/components/common/DataTable";
import type { TableColumn } from "@/types/types";

const COLUMNS: TableColumn[] = [
  { key: "name", label: "Product" },
  { key: "system", label: "System Stock" },
  { key: "counted", label: "Physical Count" },
  { key: "diff", label: "Difference" },
  { key: "status", label: "Status" },
];

export default function StockMaintenance() {
  const { toggle } = useBusiness();
  const data = useMemo(() => stockMaintenanceData[toggle], [toggle]);

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
            <FilterChip icon={Filter}>Type ▾</FilterChip>
            <FilterChip>{toggle === "paints" ? "Paints" : "Interiors"}</FilterChip>
          </>
        }
        right={
          <>
            <Button variant="ghost" size="sm">Start Physical Count</Button>
            <Button variant="primary" size="sm" icon={Plus}>Log Correction</Button>
          </>
        }
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        title="Physical Stock Verification"
        subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business · cycle 22 Aug 2026`}
        paginationText="Showing all differences this cycle"
      />
    </div>
  );
}
