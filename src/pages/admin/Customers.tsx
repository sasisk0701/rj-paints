import { useMemo } from "react";
import { Filter, Plus } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { customersData } from "@/data/contactsData";
import { Toolbar,FilterChip } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { DataTable } from "@/components/common/DataTable";
import { CellItem } from "@/components/common/CellItem";
import { Avatar } from "@/components/common/Swatch";
import { SearchBox } from "@/components/common/Toolbar.tsx";
import { BusinessBadge } from "@/components/common/Badge";
import type { TableColumn } from "@/types/types";

const COLUMNS: TableColumn[] = [
  { key: "customer", label: "Customer" },
  { key: "business", label: "Business" },
  { key: "outstanding", label: "Outstanding", align: "num" },
  { key: "credit", label: "Credit Limit", align: "num" },
  { key: "actions", label: "" },
];

export default function Customers() {
  const { toggle } = useBusiness();
  const data = useMemo(() => customersData[toggle], [toggle]);

  const rows = useMemo(
    () =>
      data.people.map((p) => ({
        id: p.name,
        customer: <CellItem icon={<Avatar initials={p.initials} size={30} />} name={p.name} sub={p.city} />,
        business: <BusinessBadge business={toggle} />,
        outstanding: p.outstanding,
        credit: p.credit,
        actions: <Button variant="ghost" size="sm">Statement</Button>,
      })),
    [data.people, toggle]
  );

  return (
    <div>
      <Toolbar
        left={
          <>
            <FilterChip icon={Filter}>{toggle === "paints" ? "Paints" : "Interiors"}</FilterChip>
            <SearchBox placeholder="Search customers…" />
          </>
        }
        right={<Button variant="primary" size="sm" icon={Plus}>Add Customer</Button>}
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        title="Customers"
        subtitle={`${data.count} customers · ${toggle === "paints" ? "Paints" : "Interiors"} business`}
        paginationText={`Showing 1–${data.people.length} of ${data.count} customers`}
      />
    </div>
  );
}
