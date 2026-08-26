import { useMemo } from "react";
import { Filter, Plus } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { usersData } from "@/data/adminData";
import { CellItem } from "@/components/common/CellItem";
import { Avatar } from "@/components/common/Swatch";
import { Toolbar,FilterChip } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { Badge } from "@/components/common/Badge";
import { KpiRow } from "@/components/common/KpiCard";
import { DataTable } from "@/components/common/DataTable";
import type { TableColumn } from "@/types/types";

const COLUMNS: TableColumn[] = [
  { key: "user", label: "User" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

export default function Users() {
  const { toggle } = useBusiness();
  const data = useMemo(() => usersData[toggle], [toggle]);

  const rows = useMemo(
    () =>
      data.users.map((u) => ({
        id: u.email,
        user: <CellItem icon={<Avatar initials={u.initials} size={30} />} name={u.name} sub={u.email} />,
        role: u.role,
        status: <Badge tone={u.status === "Active" ? "success" : "neutral"}>{u.status}</Badge>,
        actions: <Button variant="ghost" size="sm">Permissions</Button>,
      })),
    [data.users]
  );

  return (
    <div>
      <Toolbar
        left={<FilterChip icon={Filter}>{toggle === "paints" ? "Paints" : "Interiors"} access</FilterChip>}
        right={<Button variant="primary" size="sm" icon={Plus}>Add User</Button>}
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        title="Portal Users"
        subtitle={data.subtitle}
        paginationText="Showing scoped users"
      />
    </div>
  );
}
