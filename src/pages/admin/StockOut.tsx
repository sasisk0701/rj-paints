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
import { apiProductService, inventoryService, type ApiProduct, type InventoryListResponse, type InventoryStockOutRow } from "@/services/api";
import type { TableColumn } from "@/types/types";

const COLUMNS: TableColumn[] = [
  { key: "ref", label: "Stock Out #" },
  { key: "date", label: "Date" },
  { key: "source", label: "Source" },
  { key: "party", label: "Customer / Party" },
  { key: "product", label: "Product" },
  { key: "qty", label: "Qty", align: "num" },
  { key: "amount", label: "Amount", align: "num" },
];

type StockOutFormValues = {
  invoiceNo: string;
  customerName: string;
  customerPhone: string;
  saleDate: string;
  paymentMode: string;
  notes?: string;
  items: Array<{ productId: string; quantity: number; discount?: number }>;
};

const PAYMENT_OPTIONS = ["Cash", "UPI", "Cheque", "Bank Transfer", "Credit"];

export default function StockOut() {
  const { toggle } = useBusiness();
  const [form] = Form.useForm<StockOutFormValues>();
  const [data, setData] = useState<InventoryListResponse<InventoryStockOutRow> | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stockOutRes, productRes] = await Promise.all([
        inventoryService.getStockOut(toggle),
        apiProductService.getAll({ business: toggle }),
      ]);
      setData(stockOutRes);
      setProducts(productRes);
    } catch {
      message.error("Failed to load stock out records");
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
    }));
  }, [data, search, paymentFilter]);

  const sourceOptions = useMemo(() => {
    const sources = [...new Set((data?.rows ?? []).map((r) => r.source).filter(Boolean))];
    return sources.map((s) => ({ label: s, value: s }));
  }, [data]);

  const openCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({
      invoiceNo: `SO-${Date.now()}`,
      customerName: "",
      customerPhone: "",
      saleDate: new Date().toISOString().split("T")[0],
      paymentMode: "Cash",
      notes: "",
      items: [{ productId: "", quantity: 1, discount: 0 }],
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await inventoryService.createStockOut({
        invoiceNo: values.invoiceNo,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        saleDate: values.saleDate,
        paymentMode: values.paymentMode,
        notes: values.notes,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity || 0),
          discount: Number(item.discount || 0),
        })),
      });
      message.success("Stock out saved successfully");
      setModalOpen(false);
      await fetchData();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.error || "Failed to save stock out");
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
              placeholder="Search customer, product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </>
        }
        right={
          <Button variant="primary" size="sm" icon={Plus} onClick={openCreateModal}>
            New Stock Out
          </Button>
        }
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        title="Stock Out History"
        subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business`}
        paginationText={data?.pagination ?? "Loading..."}
      />

      <AppModal
        open={modalOpen}
        title="Create Stock Out"
        subtitle="Log sale, internal issue, or dispatch and reduce product quantities"
        onClose={() => setModalOpen(false)}
        onConfirm={handleSubmit}
        confirmText="Save Stock Out"
        loading={saving}
        width={860}
      >
        <Form form={form} layout="vertical" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item name="invoiceNo" label="Invoice Number" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="SO-1001" />
            </Form.Item>
            <Form.Item name="customerName" label="Customer Name" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="Sri Lakshmi Hardware" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Form.Item name="customerPhone" label="Customer Phone" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="9488475040" />
            </Form.Item>
            <Form.Item name="saleDate" label="Sale Date" rules={[{ required: true, message: "Required" }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true, message: "Required" }]}>
              <Select options={PAYMENT_OPTIONS.map((value) => ({ value, label: value }))} />
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
                  <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={() => add({ productId: "", quantity: 1, discount: 0 })}>
                    Add Item
                  </Button>
                </div>
                {fields.map((field) => (
                  <div key={field.key} className="grid grid-cols-12 gap-3 items-end rounded-2xl border border-border bg-surface-2 p-4">
                    <Form.Item
                      name={[field.name, "productId"]}
                      label="Product"
                      rules={[{ required: true, message: "Select product" }]}
                      className="col-span-12 md:col-span-6"
                    >
                      <Select placeholder="Choose product" options={productOptions} showSearch optionFilterProp="label" />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "quantity"]}
                      label="Qty"
                      rules={[{ required: true, message: "Required" }]}
                      className="col-span-4 md:col-span-2"
                    >
                      <InputNumber min={1} className="w-full" />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "discount"]}
                      label="Discount"
                      className="col-span-4 md:col-span-2"
                    >
                      <InputNumber min={0} className="w-full" />
                    </Form.Item>
                    <div className="col-span-4 md:col-span-2 flex justify-end">
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
                      Selling price and GST are pulled from the selected product automatically.
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
