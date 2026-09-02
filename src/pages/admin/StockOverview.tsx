import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Form, Input, InputNumber, Select, message } from "antd";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { Toolbar, SearchBox } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { Badge } from "@/components/common/Badge";
import { KpiRow } from "@/components/common/KpiCard";
import { DataTable } from "@/components/common/DataTable";
import { AppModal } from "@/components/common/AppModal";
import { apiProductService, inventoryService, type ApiProduct, type InventoryListResponse, type InventoryOverviewRow } from "@/services/api";
import type { TableColumn } from "@/types/types";

const COLUMNS: TableColumn[] = [
  { key: "name", label: "Product" },
  { key: "opening", label: "Opening Stock", align: "num" },
  { key: "available", label: "Available Stock", align: "num" },
  { key: "min", label: "Min. Level", align: "num" },
  { key: "status", label: "Status" },
];

type AdjustmentFormValues = {
  referenceNo: string;
  adjustmentDate: string;
  notes?: string;
  items: Array<{ productId: string; physicalCount: number }>;
};

export default function StockOverview() {
  const { toggle } = useBusiness();
  const [form] = Form.useForm<AdjustmentFormValues>();
  const [data, setData] = useState<InventoryListResponse<InventoryOverviewRow> | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, productRes] = await Promise.all([
        inventoryService.getOverview(toggle),
        apiProductService.getAll({ business: toggle }),
      ]);
      setData(overviewRes);
      setProducts(productRes);
    } catch {
      message.error("Failed to load stock overview");
      setData({ kpis: [], pagination: "No records available", rows: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [toggle]);

  const productOptions = useMemo(
    () => products.map((product) => ({ label: `${product.name} (${product.sku})`, value: product.id })),
    [products]
  );

  const rows = useMemo(() => {
    let filtered = data?.rows ?? [];
    if (search) filtered = filtered.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter) filtered = filtered.filter((r) => r.status === statusFilter);
    return filtered.map((r) => ({
      ...r,
      status: <Badge tone={r.statusTone}>{r.status}</Badge>,
    }));
  }, [data, search, statusFilter]);

  const openAdjustmentModal = () => {
    form.resetFields();
    form.setFieldsValue({
      referenceNo: `ADJ-${Date.now()}`,
      adjustmentDate: new Date().toISOString().split("T")[0],
      notes: "",
      items: [{ productId: "", physicalCount: 0 }],
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await inventoryService.createMaintenance({
        referenceNo: values.referenceNo,
        adjustmentDate: values.adjustmentDate,
        business: toggle.toUpperCase(),
        notes: values.notes,
        items: values.items.map((item) => ({
          productId: item.productId,
          physicalCount: Number(item.physicalCount || 0),
        })),
      });
      message.success("Stock adjustment saved successfully");
      setModalOpen(false);
      await fetchData();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.error || "Failed to save stock adjustment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <KpiRow items={data?.kpis ?? []} />
      <Toolbar
        left={
          <>
            <Select
              placeholder="All Status"
              allowClear size="small" style={{ width: 150 }}
              value={statusFilter || undefined}
              onChange={(v) => setStatusFilter(v ?? '')}
              options={['In Stock', 'Low Stock', 'Out of Stock'].map((s) => ({ label: s, value: s }))}
            />
            <SearchBox
              placeholder="Search product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </>
        }
        right={
          <>
            <Button variant="ghost" size="sm" onClick={openAdjustmentModal}>
              Stock History
            </Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={openAdjustmentModal}>
              Stock Adjustment
            </Button>
          </>
        }
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        title="Product-wise Stock"
        subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business`}
        paginationText={data?.pagination ?? "Loading..."}
      />

      <AppModal
        open={modalOpen}
        title="Log Stock Adjustment"
        subtitle="Capture physical count differences and update current product stock"
        onClose={() => setModalOpen(false)}
        onConfirm={handleSubmit}
        confirmText="Save Adjustment"
        loading={saving}
        width={820}
      >
        <Form form={form} layout="vertical" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item name="referenceNo" label="Reference Number" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="ADJ-1001" />
            </Form.Item>
            <Form.Item name="adjustmentDate" label="Adjustment Date" rules={[{ required: true, message: "Required" }]}>
              <Input type="date" />
            </Form.Item>
          </div>

          <Form.Item name="notes" label="Notes">
            <Input placeholder="Optional remarks" />
          </Form.Item>

          <Form.List
            name="items"
            rules={[
              {
                validator: async (_, items) => {
                  if (!items || items.length === 0) {
                    throw new Error("Add at least one item");
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }) => (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-widest text-ink-3">Items</div>
                  <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={() => add({ productId: "", physicalCount: 0 })}>
                    Add Item
                  </Button>
                </div>
                {fields.map((field) => (
                  <div key={field.key} className="grid grid-cols-12 gap-3 items-end rounded-2xl border border-border bg-surface-2 p-4">
                    <Form.Item
                      name={[field.name, "productId"]}
                      label="Product"
                      rules={[{ required: true, message: "Select product" }]}
                      className="col-span-12 md:col-span-7"
                    >
                      <Select placeholder="Choose product" options={productOptions} showSearch optionFilterProp="label" />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "physicalCount"]}
                      label="Physical Count"
                      rules={[{ required: true, message: "Required" }]}
                      className="col-span-6 md:col-span-3"
                    >
                      <InputNumber min={0} className="w-full" />
                    </Form.Item>
                    <div className="col-span-6 md:col-span-2 flex justify-end">
                      <Button
                        type="button"
                        variant="dangerGhost"
                        size="sm"
                        onClick={() => remove(field.name)}
                        disabled={fields.length === 1}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="col-span-12 text-[11px] text-ink-3">
                      The current system stock is read from the selected product automatically.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Form.List>
        </Form>
      </AppModal>
    </div>
  );
}
