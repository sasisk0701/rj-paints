import { useMemo } from "react";
import { Filter, Download, Plus } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { productsData } from "@/data/productsData";
import { Toolbar,FilterChip } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { DataTable } from "@/components/common/DataTable";
import { CellItem } from "@/components/common/CellItem";
import { Swatch } from "@/components/common/Swatch";
import { KpiRow } from "@/components/common/KpiCard";
import { Badge } from "@/components/common/Badge";
import { SearchBox } from "@/components/common/Toolbar.tsx";
import type { TableColumn } from "@/types/types";

// declared once at module scope instead of being rebuilt every render.
const COLUMNS: TableColumn[] = [
  { key: "product", label: "Product" },
  { key: "category", label: "Category" },
  { key: "brand", label: "Brand" },
  { key: "unit", label: "Unit" },
  { key: "cost", label: "Cost", align: "num" },
  { key: "price", label: "Selling Price", align: "num" },
  { key: "stock", label: "Stock", align: "num" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

export default function Products() {
  const { toggle } = useBusiness();
  const data = useMemo(() => productsData[toggle], [toggle]);

  // Transform raw data rows into the shape DataTable expects (cells can
  // be JSX). Recomputed only when the underlying data changes.
  const rows = useMemo(
    () =>
      data.rows.map((p) => ({
        id: p.sku,
        product: <CellItem icon={<Swatch color={p.color} />} name={p.name} sub={p.sku} mono />,
        category: p.category,
        brand: p.brand,
        unit: p.unit,
        cost: p.cost,
        price: p.price,
        stock: <span className="font-bold">{p.stock}</span>,
        status: <Badge tone={p.statusTone}>{p.status}</Badge>,
        actions: <Button variant="ghost" size="sm">Edit</Button>,
      })),
    [data.rows]
  );

  return (
    <div>
      <KpiRow items={data.kpis} />
      <Toolbar
        left={
          <>
            <FilterChip icon={Filter}>Category ▾</FilterChip>
            <FilterChip>Status ▾</FilterChip>
            <SearchBox placeholder="Search SKU or name…" />
          </>
        }
        right={
          <>
            <Button variant="ghost" size="sm" icon={Download}>Export</Button>
            <Button variant="primary" size="sm" icon={Plus}>Add Product</Button>
          </>
        }
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        title="Product Catalog"
        subtitle={data.panelSub}
        paginationText={data.pagination}
      />
    </div>
  );
}
