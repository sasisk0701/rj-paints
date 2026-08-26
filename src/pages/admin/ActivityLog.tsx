import { useMemo } from "react";
import { Filter, Download } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { activityLogData } from "@/data/adminData.ts";
import { Toolbar,FilterChip } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { DataTable } from "@/components/common/DataTable.tsx";
import { Badge } from "@/components/common/Badge.tsx";
import type { TableColumn } from "@/types/types.ts";

const COLUMNS: TableColumn[] = [
  { key: "time", label: "Timestamp" },
  { key: "user", label: "User" },
  { key: "action", label: "Action" },
  { key: "module", label: "Module" },
  { key: "reference", label: "Reference" },
];

export default function ActivityLog() {
  const { toggle } = useBusiness();
  const logs = useMemo(() => activityLogData[toggle], [toggle]);

  const rows = useMemo(
    () =>
      logs.map((l, i) => ({
        id: i,
        ...l,
        action: <Badge tone="neutral">{l.action}</Badge>,
        reference: <span className="font-mono">{l.reference}</span>,
      })),
    [logs]
  );

  return (
    <div>
      <Toolbar
        left={
          <>
            <FilterChip icon={Filter}>{toggle === "paints" ? "Paints" : "Interiors"}</FilterChip>
            <FilterChip>User ▾</FilterChip>
          </>
        }
        right={<Button variant="ghost" size="sm" icon={Download}>Export Log</Button>}
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        title="Activity Log"
        subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business events`}
        paginationText="Showing recent events"
      />
    </div>
  );
}
