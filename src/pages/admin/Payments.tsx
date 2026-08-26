import { useMemo } from "react";
import { Filter, Plus } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { paymentsData } from "@/data/financeData";
import { Toolbar,FilterChip } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/common/Badge";
import type { TableColumn } from "@/types/types";

const COLUMNS: TableColumn[] = [
  { key: "ref", label: "Ref #" },
  { key: "date", label: "Date" },
  { key: "type", label: "Type" },
  { key: "party", label: "Party" },
  { key: "mode", label: "Mode" },
  { key: "amount", label: "Amount", align: "num" },
];

export default function Payments() {
  const { toggle } = useBusiness();
  const data = useMemo(() => paymentsData[toggle], [toggle]);

  const rows = useMemo(
    () =>
      data.rows.map((r) => ({
        id: r.ref,
        ...r,
        ref: <span className="font-mono">{r.ref}</span>,
        type: <Badge tone={r.type === "Receipt" ? "success" : "warn"}>{r.type}</Badge>,
      })),
    [data.rows]
  );

  return (
    <div>
      <Toolbar
        left={<FilterChip icon={Filter}>{toggle === "paints" ? "Paints" : "Interiors"}</FilterChip>}
        right={
          <>
            <Button variant="ghost" size="sm" icon={Plus}>Record Payment</Button>
            <Button variant="primary" size="sm" icon={Plus}>Record Receipt</Button>
          </>
        }
      />
      <DataTable columns={COLUMNS} rows={rows} title="Payments & Receipts" subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business`} paginationText={data.pagination} />
    </div>
  );
}
