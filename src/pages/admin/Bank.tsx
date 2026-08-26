import { useMemo } from "react";
import { Filter, Plus } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { bankData } from "@/data/financeData.ts";
import { Toolbar,FilterChip } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { DataTable } from "@/components/common/DataTable.tsx";
import { Badge } from "@/components/common/Badge.tsx";
import type { TableColumn } from "@/types/types.ts";
import { KpiRow } from "@/components/common/KpiCard";
import { Panel } from "@/components/common/Panel.tsx";

const COLUMNS: TableColumn[] = [
  { key: "date", label: "Date" },
  { key: "type", label: "Type" },
  { key: "description", label: "Description" },
  { key: "account", label: "Account" },
  { key: "amount", label: "Amount", align: "num" },
  { key: "dir", label: "Dir." },
];

export default function Bank() {
  const { toggle } = useBusiness();
  const data = useMemo(() => bankData[toggle], [toggle]);

  const accountCards = useMemo(
    () =>
      data.accounts.map((a) => (
        <Panel key={a.acc} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold">{a.name}</div>
              <div className="font-mono text-[11.5px] text-ink-3">A/C {a.acc} · IFSC {a.ifsc}</div>
            </div>
            <div className="font-display text-[19px] font-semibold">{a.balance}</div>
          </div>
        </Panel>
      )),
    [data.accounts]
  );

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
      <div
        className="grid gap-3.5 mb-4"
        style={{ gridTemplateColumns: `repeat(${data.accounts.length}, 1fr)` }}
      >
        {accountCards}
      </div>
      <Toolbar
        left={<FilterChip icon={Filter}>{toggle === "paints" ? "Paints" : "Interiors"} accounts</FilterChip>}
        right={
          <>
            <Button variant="ghost" size="sm">Bank Transfer</Button>
            <Button variant="primary" size="sm" icon={Plus}>Add Account</Button>
          </>
        }
      />
      <DataTable columns={COLUMNS} rows={rows} title="Bank Transaction History" subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business`} paginationText="Showing recent entries" />
    </div>
  );
}
