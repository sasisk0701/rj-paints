import { useMemo } from "react";
import { Filter, Plus } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { suppliersData } from "@/data/contactsData";
import { Avatar } from "@/components/common/Swatch";
import { CellItem } from "@/components/common/CellItem";
import { BusinessBadge } from "@/components/common/Badge";
import { Toolbar,FilterChip } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { SearchBox } from "@/components/common/Toolbar.tsx";
import { DataTable } from "@/components/common/DataTable";
import type { TableColumn } from "@/types/types";

const COLUMNS: TableColumn[] = [
  { key: "supplier", label: "Supplier" },
  { key: "business", label: "Business" },
  { key: "outstanding", label: "Outstanding", align: "num" },
  { key: "gst", label: "GST Number" },
  { key: "actions", label: "" },
];

export default function Suppliers() {
  const { toggle } = useBusiness();
  const data = useMemo(() => suppliersData[toggle], [toggle]);

  const rows = useMemo(
    () =>
      data.suppliers.map((s) => ({
        id: s.name,
        supplier: <CellItem icon={<Avatar initials={s.initials} size={30} bg="#C4762E" />} name={s.name} sub={s.city} />,
        business: <BusinessBadge business={toggle} />,
        outstanding: s.outstanding,
        gst: <span className="font-mono text-ink-3 text-[11.5px]">{s.gst}</span>,
        actions: <Button variant="ghost" size="sm">Statement</Button>,
      })),
    [data.suppliers, toggle]
  );

  return (
    <div>
      <Toolbar
        left={
          <>
            <FilterChip icon={Filter}>{toggle === "paints" ? "Paints" : "Interiors"}</FilterChip>
            <SearchBox placeholder="Search suppliers…" />
          </>
        }
        right={<Button variant="primary" size="sm" icon={Plus}>Add Supplier</Button>}
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        title="Suppliers"
        subtitle={`${data.count} suppliers · ${toggle === "paints" ? "Paints" : "Interiors"} business`}
        paginationText={`Showing 1–${data.suppliers.length} of ${data.count} suppliers`}
      />
    </div>
  );
}
