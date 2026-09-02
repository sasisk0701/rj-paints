import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Download, Eye } from 'lucide-react';
import { Form, Input, InputNumber, Select, message } from 'antd';
import { useBusiness } from '@/hooks/useBusiness.ts';
import { purchaseService, supplierService, apiProductService, type ApiPurchase, type ApiSupplier, type ApiProduct } from '@/services/api';
import { Toolbar, SearchBox } from '@/components/common/Toolbar.tsx';
import { Button } from '@/components/common/Button.tsx';
import { DataTable } from '@/components/common/DataTable';
import { KpiRow } from '@/components/common/KpiCard';
import { Badge } from '@/components/common/Badge';
import { AppModal } from '@/components/common/AppModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { KpiItem, TableColumn, Tone } from '@/types/types';

const COLUMNS: TableColumn[] = [
  { key: 'po',       label: 'PO #' },
  { key: 'date',     label: 'Date' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'items',    label: 'Items' },
  { key: 'amount',   label: 'Amount',  align: 'num' },
  { key: 'status',   label: 'Status' },
  { key: 'actions',  label: '' },
];

const STATUS_OPTIONS = ['Pending', 'Paid', 'Partial', 'Overdue', 'Cancelled'];
const PAYMENT_OPTIONS = ['Cash', 'UPI', 'Cheque', 'Bank Transfer', 'Credit'];

const STATUS_TONE: Record<string, Tone> = {
  Paid: 'success', Pending: 'warn', Partial: 'neutral', Overdue: 'danger', Cancelled: 'danger',
};

export default function Purchases() {
  const { toggle } = useBusiness();
  const [purchases, setPurchases]       = useState<ApiPurchase[]>([]);
  const [suppliers, setSuppliers]       = useState<ApiSupplier[]>([]);
  const [products, setProducts]         = useState<ApiProduct[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [viewOpen, setViewOpen]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiPurchase | null>(null);
  const [editing, setEditing]           = useState<ApiPurchase | null>(null);
  const [viewing, setViewing]           = useState<ApiPurchase | null>(null);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [form] = Form.useForm();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [purch, supps, prods] = await Promise.all([
        purchaseService.getAll({ business: toggle, search: search || undefined, status: statusFilter || undefined }),
        supplierService.getAll({ business: toggle }),
        apiProductService.getAll({ business: toggle }),
      ]);
      setPurchases(purch);
      setSuppliers(supps);
      setProducts(prods);
    } catch {
      message.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  }, [toggle, search, statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      poNumber: `PO-${Date.now()}`,
      purchaseDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Bank Transfer',
      status: 'Pending',
      business: toggle.toUpperCase(),
      items: [{ productId: '', quantity: 1, purchasePrice: 0, gstRate: 18 }],
    });
    setModalOpen(true);
  };

  const openEdit = (p: ApiPurchase) => {
    setEditing(p);
    form.setFieldsValue({
      poNumber: p.poNumber,
      supplierId: p.supplierId ?? undefined,
      supplierName: p.supplierName,
      purchaseDate: p.purchaseDate,
      paymentMode: p.paymentMode,
      status: p.status,
      notes: p.notes ?? '',
      business: p.business,
      items: p.items?.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        purchasePrice: i.purchasePrice,
        gstRate: i.gstRate,
      })) ?? [{ productId: '', quantity: 1, purchasePrice: 0, gstRate: 18 }],
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        ...values,
        items: values.items.map((item: any) => {
          const prod = products.find((p) => p.id === item.productId);
          return {
            productId: item.productId,
            productName: prod?.name ?? '',
            quantity: Number(item.quantity),
            purchasePrice: Number(item.purchasePrice),
            gstRate: Number(item.gstRate ?? 18),
            amount: Number(item.quantity) * Number(item.purchasePrice),
          };
        }),
      };
      if (editing) {
        await purchaseService.update(editing.id, payload);
        message.success('Purchase updated');
      } else {
        await purchaseService.create(payload);
        message.success('Purchase created');
      }
      setModalOpen(false);
      form.resetFields();
      fetchAll();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.error || 'Failed to save purchase');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await purchaseService.remove(deleteTarget.id);
      message.success('Purchase deleted');
      setDeleteTarget(null);
      fetchAll();
    } catch {
      message.error('Failed to delete purchase');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    if (!purchases.length) { message.warning('No purchases to export'); return; }
    const header = 'PO #,Date,Supplier,Amount,Status,Payment Mode\n';
    const csv = purchases.map((p) =>
      `"${p.poNumber}","${p.purchaseDate}","${p.supplierName}",${p.totalAmount},"${p.status}","${p.paymentMode}"`
    ).join('\n');
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `purchases-${toggle}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Exported');
  };

  const kpis = useMemo((): KpiItem[] => {
    const total     = purchases.reduce((s, p) => s + p.totalAmount, 0);
    const pending   = purchases.filter((p) => p.status === 'Pending').length;
    const overdue   = purchases.filter((p) => p.status === 'Overdue').length;
    const paid      = purchases.filter((p) => p.status === 'Paid').length;
    return [
      { label: 'Total Purchases',  value: `₹${total.toLocaleString('en-IN')}`, deltaTone: 'neutral' },
      { label: 'Paid',             value: String(paid),    deltaTone: 'up' },
      { label: 'Pending',          value: String(pending), deltaTone: 'neutral' },
      { label: 'Overdue',          value: String(overdue), deltaTone: 'down' },
    ];
  }, [purchases]);

  const rows = useMemo(() =>
    purchases.map((p) => ({
      id: p.id,
      po:       <span className="font-mono">{p.poNumber}</span>,
      date:     p.purchaseDate,
      supplier: p.supplierName,
      items:    `${p.items?.length ?? '—'} item(s)`,
      amount:   `₹${p.totalAmount.toLocaleString('en-IN')}`,
      status:   <Badge tone={STATUS_TONE[p.status] ?? 'neutral'}>{p.status}</Badge>,
      actions: (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" icon={Eye} onClick={() => { setViewing(p); setViewOpen(true); }} />
          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(p)}>Edit</Button>
          <Button variant="dangerGhost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(p)} />
        </div>
      ),
    })),
  [purchases]);

  return (
    <div>
      <KpiRow items={kpis} />

      <Toolbar
        left={
          <>
            <Select
              placeholder="All Status" allowClear size="small" style={{ width: 140 }}
              value={statusFilter || undefined}
              onChange={(v) => setStatusFilter(v ?? '')}
              options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))}
            />
            <SearchBox placeholder="Search PO, supplier…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </>
        }
        right={
          <>
            <Button variant="ghost" size="sm" icon={Download} onClick={handleExport}>Export</Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={openAdd}>New Purchase</Button>
          </>
        }
      />

      {purchases.length === 0 && !loading ? (
        <div className="text-sm text-ink-3 py-12 text-center">
          No purchases yet. Click <strong>New Purchase</strong> to create one.
        </div>
      ) : (
        <DataTable
          columns={COLUMNS} rows={rows}
          title="Purchase Orders"
          subtitle={`${purchases.length} purchase${purchases.length !== 1 ? 's' : ''} · ${toggle === 'paints' ? 'Paints' : 'Interiors'} business`}
          paginationText={`Showing ${purchases.length} purchase${purchases.length !== 1 ? 's' : ''}`}
        />
      )}

      {/* ── Create / Edit Modal ── */}
      <AppModal
        open={modalOpen}
        title={editing ? 'Edit Purchase' : 'New Purchase Order'}
        subtitle={editing ? `Editing: ${editing.poNumber}` : 'Create a new purchase order from supplier'}
        onClose={() => { setModalOpen(false); form.resetFields(); }}
        onConfirm={handleSubmit}
        confirmText={editing ? 'Save Changes' : 'Create Purchase'}
        loading={saving}
        width={820}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="poNumber" label="PO Number" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="PO-1001" />
            </Form.Item>
            <Form.Item name="supplierId" label="Supplier">
              <Select
                placeholder="Select supplier (optional)"
                allowClear
                showSearch
                optionFilterProp="label"
                options={suppliers.map((s) => ({ label: s.name, value: s.id }))}
                onChange={(val) => {
                  const sup = suppliers.find((s) => s.id === val);
                  if (sup) form.setFieldValue('supplierName', sup.name);
                }}
              />
            </Form.Item>
            <Form.Item name="supplierName" label="Supplier Name" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="Asian Paints Depot - Madurai" />
            </Form.Item>
            <Form.Item name="purchaseDate" label="Purchase Date" rules={[{ required: true, message: 'Required' }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true }]}>
              <Select options={PAYMENT_OPTIONS.map((v) => ({ label: v, value: v }))} />
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select options={STATUS_OPTIONS.map((v) => ({ label: v, value: v }))} />
            </Form.Item>
            <Form.Item name="notes" label="Notes" className="col-span-2">
              <Input placeholder="Optional remarks…" />
            </Form.Item>
          </div>

          {/* Items */}
          <Form.List name="items" rules={[{ validator: async (_, items) => { if (!items?.length) throw new Error('Add at least one item'); } }]}>
            {(fields, { add, remove }) => (
              <div className="space-y-3 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-ink-3">Items</span>
                  <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={() => add({ productId: '', quantity: 1, purchasePrice: 0, gstRate: 18 })}>
                    Add Item
                  </Button>
                </div>
                {fields.map((field) => (
                  <div key={field.key} className="grid grid-cols-12 gap-3 items-end rounded-2xl border border-border bg-surface-2 p-4">
                    <Form.Item name={[field.name, 'productId']} label="Product" rules={[{ required: true, message: 'Required' }]} className="col-span-12 md:col-span-5">
                      <Select
                        placeholder="Choose product" showSearch optionFilterProp="label"
                        options={products.map((p) => ({ label: `${p.name} (${p.sku})`, value: p.id }))}
                        onChange={(val) => {
                          const prod = products.find((p) => p.id === val);
                          if (prod) {
                            const items = form.getFieldValue('items');
                            items[field.name].purchasePrice = prod.purchasePrice;
                            items[field.name].gstRate = prod.gstRate;
                            form.setFieldValue('items', [...items]);
                          }
                        }}
                      />
                    </Form.Item>
                    <Form.Item name={[field.name, 'quantity']} label="Qty" rules={[{ required: true }]} className="col-span-3 md:col-span-2">
                      <InputNumber min={1} className="w-full" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'purchasePrice']} label="Price (₹)" rules={[{ required: true }]} className="col-span-4 md:col-span-3">
                      <InputNumber min={0} className="w-full" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'gstRate']} label="GST %" className="col-span-3 md:col-span-1">
                      <InputNumber min={0} max={28} className="w-full" />
                    </Form.Item>
                    <div className="col-span-3 md:col-span-1 flex justify-end">
                      <Button type="button" variant="dangerGhost" size="sm" icon={Trash2} onClick={() => remove(field.name)} disabled={fields.length === 1} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Form.List>
        </Form>
      </AppModal>

      {/* ── View Modal ── */}
      <AppModal
        open={viewOpen}
        title={`Purchase Order — ${viewing?.poNumber}`}
        subtitle={`${viewing?.supplierName} · ${viewing?.purchaseDate}`}
        onClose={() => setViewOpen(false)}
        onConfirm={() => setViewOpen(false)}
        confirmText="Close"
        width={680}
      >
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-ink-3 text-xs">Status</span><div><Badge tone={STATUS_TONE[viewing.status] ?? 'neutral'}>{viewing.status}</Badge></div></div>
              <div><span className="text-ink-3 text-xs">Payment Mode</span><div className="font-medium">{viewing.paymentMode}</div></div>
              <div><span className="text-ink-3 text-xs">Total Amount</span><div className="font-bold text-lg">₹{viewing.totalAmount.toLocaleString('en-IN')}</div></div>
              <div><span className="text-ink-3 text-xs">GST Amount</span><div className="font-medium">₹{viewing.gstAmount.toLocaleString('en-IN')}</div></div>
            </div>
            {viewing.items && viewing.items.length > 0 && (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-surface-2">
                    {['Product', 'Qty', 'Price', 'GST%', 'Amount'].map((h) => (
                      <th key={h} className="text-left text-xs font-bold text-ink-3 px-3 py-2 border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {viewing.items.map((item) => (
                    <tr key={item.id} className="border-b border-border">
                      <td className="px-3 py-2">{item.productName}</td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2">₹{item.purchasePrice.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2">{item.gstRate}%</td>
                      <td className="px-3 py-2 font-semibold">₹{item.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {viewing.notes && <p className="text-xs text-ink-3">Notes: {viewing.notes}</p>}
          </div>
        )}
      </AppModal>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.poNumber}"?`}
        description="This purchase order will be permanently removed."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        confirmText="Delete Purchase"
      />
    </div>
  );
}
