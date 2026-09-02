import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Form, Input, InputNumber, Select, message } from "antd";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { Toolbar, SearchBox } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { Badge } from "@/components/common/Badge";
import { KpiRow } from "@/components/common/KpiCard";
import { DataTable } from "@/components/common/DataTable";
import { AppModal } from "@/components/common/AppModal";
import { apiProductService, inventoryService, supplierService, type ApiProduct, type ApiSupplier, type InventoryListResponse, type InventoryStockInRow } from "@/services/api";
import type { TableColumn } from "@/types/types";

const COLUMNS: TableColumn[] = [
  { key: "ref", label: "Stock In #" },
  { key: "date", label: "Date" },
  { key: "source", label: "Source" },
  { key: "party", label: "Supplier" },
  { key: "product", label: "Product" },
  { key: "qty", label: "Qty", align: "num" },
  { key: "amount", label: "Amount", align: "num" },
  { key: "reference", label: "Reference" },
];

type StockInFormValues = {
  invoiceNo: string;
  supplierName: string;
  purchaseDate: string;
  paymentMode: string;
  notes?: string;
  items: Array<{ productId: string; quantity: number }>;
};

const PAYMENT_OPTIONS = ["Cash", "UPI", "Cheque", "Bank Transfer", "Credit"];

export default function StockIn() {
  const { toggle } = useBusiness();
  const [form] = Form.useForm<StockInFormValues>();
  const [data, setData] = useState<InventoryListResponse<InventoryStockInRow> | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stockInRes, productRes, supplierRes] = await Promise.all([
        inventoryService.getStockIn(toggle),
        apiProductService.getAll({ business: toggle }),
        supplierService.getAll({ business: toggle }),
      ]);
      setData(stockInRes);
      setProducts(productRes);
      setSuppliers(supplierRes);
    } catch {
      message.error("Failed to load stock in records");
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
    if (search) filtered = filtered.filter((r) =>
      r.party.toLowerCase().includes(search.toLowerCase()) ||
      r.product.toLowerCase().includes(search.toLowerCase()) ||
      r.ref.toLowerCase().includes(search.toLowerCase())
    );
    if (paymentFilter) filtered = filtered.filter((r) => r.source === paymentFilter);
    return filtered.map((r) => ({
      ...r,
      ref: <span className="font-mono">{r.ref}</span>,
      source: <Badge tone="neutral">{r.source}</Badge>,
      reference: <span className="font-mono">{r.reference}</span>,
    }));
  }, [data, search, paymentFilter]);

  const sourceOptions = useMemo(() => {
    const sources = [...new Set((data?.rows ?? []).map((r) => r.source).filter(Boolean))];
    return sources.map((s) => ({ label: s, value: s }));
  }, [data]);

  const openCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({
      invoiceNo: `SI-${Date.now()}`,
      supplierName: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      paymentMode: "Bank Transfer",
      notes: "",
      items: [{ productId: "", quantity: 1 }],
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await inventoryService.createStockIn({
        invoiceNo: values.invoiceNo,
        supplierName: values.supplierName,
        purchaseDate: values.purchaseDate,
        paymentMode: values.paymentMode,
        notes: values.notes,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity || 0),
        })),
      });
      message.success("Stock in saved successfully");
      setModalOpen(false);
      await fetchData();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.error || "Failed to save stock in");
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
              placeholder="All Sources"
              allowClear size="small" style={{ width: 160 }}
              value={paymentFilter || undefined}
              onChange={(v) => setPaymentFilter(v ?? '')}
              options={sourceOptions}
            />
            <SearchBox
              placeholder="Search supplier, product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </>
        }
        right={
          <Button variant="primary" size="sm" icon={Plus} onClick={openCreateModal}>
            New Stock In
          </Button>
        }
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        title="Stock In History"
        subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business`}
        paginationText={data?.pagination ?? "Loading..."}
      />

      <AppModal
        open={modalOpen}
        title="Create Stock In"
        subtitle="Log supplier stock receipt and update product quantities"
        onClose={() => setModalOpen(false)}
        onConfirm={handleSubmit}
        confirmText="Save Stock In"
        loading={saving}
        width={860}
      >
        <Form form={form} layout="vertical" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item name="invoiceNo" label="Invoice Number" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="SI-1001" />
            </Form.Item>
            <Form.Item name="supplierName" label="Supplier Name" rules={[{ required: true, message: "Required" }]}>
              <Select
                showSearch
                allowClear
                placeholder="Select or type supplier name"
                optionFilterProp="label"
                options={suppliers.map((s) => ({ label: s.name, value: s.name }))}
                onChange={(val) => form.setFieldValue('supplierName', val)}
                notFoundContent="Type to enter a new supplier"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Form.Item name="purchaseDate" label="Purchase Date" rules={[{ required: true, message: "Required" }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true, message: "Required" }]}>
              <Select options={PAYMENT_OPTIONS.map((value) => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <Input placeholder="Optional remarks" />
            </Form.Item>
          </div>

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
                  <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={() => add({ productId: "", quantity: 1 })}>
                    Add Item
                  </Button>
                </div>
                {fields.map((field, index) => (
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
                      name={[field.name, "quantity"]}
                      label="Qty"
                      rules={[{ required: true, message: "Required" }]}
                      className="col-span-6 md:col-span-3"
                    >
                      <InputNumber min={1} className="w-full" />
                    </Form.Item>
                    <div className="col-span-6 md:col-span-2 flex justify-end">
                      <Button
                        type="button"
                        variant="dangerGhost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => remove(field.name)}
                        disabled={fields.length === 1}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="col-span-12 text-[11px] text-ink-3">
                      Prices and GST are pulled from the selected product automatically.
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
