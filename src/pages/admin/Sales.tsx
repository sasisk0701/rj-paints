import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Download, Eye, Printer } from 'lucide-react';
import { Form, Input, InputNumber, Select, message } from 'antd';
import { useBusiness } from '@/hooks/useBusiness.ts';
import { saleService, customerService, apiProductService, type ApiSale, type ApiCustomer, type ApiProduct } from '@/services/api';
import { Toolbar, SearchBox } from '@/components/common/Toolbar.tsx';
import { Button } from '@/components/common/Button.tsx';
import { DataTable } from '@/components/common/DataTable';
import { KpiRow } from '@/components/common/KpiCard';
import { Badge } from '@/components/common/Badge';
import { AppModal } from '@/components/common/AppModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { KpiItem, TableColumn, Tone } from '@/types/types';

const COLUMNS: TableColumn[] = [
  { key: 'invoice',  label: 'Invoice #' },
  { key: 'date',     label: 'Date' },
  { key: 'customer', label: 'Customer' },
  { key: 'items',    label: 'Items' },
  { key: 'amount',   label: 'Amount',  align: 'num' },
  { key: 'status',   label: 'Status' },
  { key: 'actions',  label: '' },
];

const STATUS_OPTIONS  = ['Paid', 'Pending', 'Partial', 'Overdue', 'Cancelled'];
const PAYMENT_OPTIONS = ['Cash', 'UPI', 'Cheque', 'Bank Transfer', 'Credit'];

const STATUS_TONE: Record<string, Tone> = {
  Paid: 'success', Pending: 'warn', Partial: 'neutral', Overdue: 'danger', Cancelled: 'danger',
};

export default function Sales() {
  const { toggle } = useBusiness();
  const [sales, setSales]               = useState<ApiSale[]>([]);
  const [customers, setCustomers]       = useState<ApiCustomer[]>([]);
  const [products, setProducts]         = useState<ApiProduct[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [viewOpen, setViewOpen]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiSale | null>(null);
  const [editing, setEditing]           = useState<ApiSale | null>(null);
  const [viewing, setViewing]           = useState<ApiSale | null>(null);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [form] = Form.useForm();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, custsRes, prodsRes] = await Promise.all([
        saleService.getAll({ business: toggle, search: search || undefined, status: statusFilter || undefined }),
        customerService.getAll({ business: toggle }),
        apiProductService.getAll({ business: toggle }),
      ]);
      setSales(salesRes);
      setCustomers(custsRes);
      setProducts(prodsRes);
    } catch {
      message.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, [toggle, search, statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      invoiceNumber: `SO-${Date.now()}`,
      saleDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Cash',
      status: 'Paid',
      business: toggle.toUpperCase(),
      items: [{ productId: '', quantity: 1, sellingPrice: 0, discount: 0, gstRate: 18 }],
    });
    setModalOpen(true);
  };

  const openEdit = (s: ApiSale) => {
    setEditing(s);
    form.setFieldsValue({
      invoiceNumber: s.invoiceNumber,
      customerId: s.customerId ?? undefined,
      customerName: s.customerName,
      customerPhone: s.customerPhone,
      saleDate: s.saleDate,
      paymentMode: s.paymentMode,
      status: s.status,
      notes: s.notes ?? '',
      business: s.business,
      items: s.items?.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        sellingPrice: i.sellingPrice,
        discount: i.discount,
        gstRate: i.gstRate,
      })) ?? [{ productId: '', quantity: 1, sellingPrice: 0, discount: 0, gstRate: 18 }],
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
          const qty  = Number(item.quantity);
          const price = Number(item.sellingPrice);
          const disc  = Number(item.discount ?? 0);
          return {
            productId: item.productId,
            productName: prod?.name ?? '',
            quantity: qty,
            sellingPrice: price,
            discount: disc,
            gstRate: Number(item.gstRate ?? 18),
            amount: qty * price - disc,
          };
        }),
      };
      if (editing) {
        await saleService.update(editing.id, payload);
        message.success('Sale updated');
      } else {
        await saleService.create(payload);
        message.success('Sale created');
      }
      setModalOpen(false);
      form.resetFields();
      fetchAll();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.error || 'Failed to save sale');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await saleService.remove(deleteTarget.id);
      message.success('Sale deleted');
      setDeleteTarget(null);
      fetchAll();
    } catch {
      message.error('Failed to delete sale');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    if (!sales.length) { message.warning('No sales to export'); return; }
    const header = 'Invoice #,Date,Customer,Phone,Amount,Status,Payment Mode\n';
    const csv = sales.map((s) =>
      `"${s.invoiceNumber}","${s.saleDate}","${s.customerName}","${s.customerPhone}",${s.totalAmount},"${s.status}","${s.paymentMode}"`
    ).join('\n');
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `sales-${toggle}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Exported');
  };

  const handlePrint = (s: ApiSale) => {
    setViewing(s);
    setViewOpen(true);
  };

  const kpis = useMemo((): KpiItem[] => {
    const total    = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const paid     = sales.filter((s) => s.status === 'Paid').length;
    const pending  = sales.filter((s) => s.status === 'Pending' || s.status === 'Partial').length;
    const overdue  = sales.filter((s) => s.status === 'Overdue').length;
    return [
      { label: 'Total Sales',   value: `₹${total.toLocaleString('en-IN')}`, deltaTone: 'up' },
      { label: 'Paid',          value: String(paid),    deltaTone: 'up' },
      { label: 'Pending',       value: String(pending), deltaTone: 'neutral' },
      { label: 'Overdue',       value: String(overdue), deltaTone: 'down' },
    ];
  }, [sales]);

  const rows = useMemo(() =>
    sales.map((s) => ({
      id: s.id,
      invoice:  <span className="font-mono">{s.invoiceNumber}</span>,
      date:     s.saleDate,
      customer: s.customerName,
      items:    `${s.items?.length ?? '—'} item(s)`,
      amount:   `₹${s.totalAmount.toLocaleString('en-IN')}`,
      status:   <Badge tone={STATUS_TONE[s.status] ?? 'neutral'}>{s.status}</Badge>,
      actions: (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" icon={Eye} onClick={() => { setViewing(s); setViewOpen(true); }} />
          <Button variant="ghost" size="sm" icon={Printer} onClick={() => handlePrint(s)} />
          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(s)}>Edit</Button>
          <Button variant="dangerGhost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(s)} />
        </div>
      ),
    })),
  [sales]);

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
            <SearchBox placeholder="Search invoice, customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </>
        }
        right={
          <>
            <Button variant="ghost" size="sm" icon={Download} onClick={handleExport}>Export</Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={openAdd}>New Sale</Button>
          </>
        }
      />

      {sales.length === 0 && !loading ? (
        <div className="text-sm text-ink-3 py-12 text-center">
          No sales yet. Click <strong>New Sale</strong> to create one.
        </div>
      ) : (
        <DataTable
          columns={COLUMNS} rows={rows}
          title="Sales Invoices"
          subtitle={`${sales.length} invoice${sales.length !== 1 ? 's' : ''} · ${toggle === 'paints' ? 'Paints' : 'Interiors'} business`}
          paginationText={`Showing ${sales.length} invoice${sales.length !== 1 ? 's' : ''}`}
        />
      )}

      {/* ── Create / Edit Modal ── */}
      <AppModal
        open={modalOpen}
        title={editing ? 'Edit Sale' : 'New Sale Invoice'}
        subtitle={editing ? `Editing: ${editing.invoiceNumber}` : 'Create a new sales invoice'}
        onClose={() => { setModalOpen(false); form.resetFields(); }}
        onConfirm={handleSubmit}
        confirmText={editing ? 'Save Changes' : 'Create Sale'}
        loading={saving}
        width={860}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="invoiceNumber" label="Invoice Number" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="SO-1001" />
            </Form.Item>
            <Form.Item name="customerId" label="Customer">
              <Select
                placeholder="Select customer (optional)" allowClear showSearch optionFilterProp="label"
                options={customers.map((c) => ({ label: c.name, value: c.id }))}
                onChange={(val) => {
                  const cust = customers.find((c) => c.id === val);
                  if (cust) {
                    form.setFieldValue('customerName', cust.name);
                    form.setFieldValue('customerPhone', cust.phone);
                  }
                }}
              />
            </Form.Item>
            <Form.Item name="customerName" label="Customer Name" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="Sri Lakshmi Hardware" />
            </Form.Item>
            <Form.Item name="customerPhone" label="Customer Phone" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="9488475040" />
            </Form.Item>
            <Form.Item name="saleDate" label="Sale Date" rules={[{ required: true, message: 'Required' }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true }]}>
              <Select options={PAYMENT_OPTIONS.map((v) => ({ label: v, value: v }))} />
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select options={STATUS_OPTIONS.map((v) => ({ label: v, value: v }))} />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <Input placeholder="Optional remarks…" />
            </Form.Item>
          </div>

          {/* Items */}
          <Form.List name="items" rules={[{ validator: async (_, items) => { if (!items?.length) throw new Error('Add at least one item'); } }]}>
            {(fields, { add, remove }) => (
              <div className="space-y-3 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-ink-3">Items</span>
                  <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={() => add({ productId: '', quantity: 1, sellingPrice: 0, discount: 0, gstRate: 18 })}>
                    Add Item
                  </Button>
                </div>
                {fields.map((field) => (
                  <div key={field.key} className="grid grid-cols-12 gap-3 items-end rounded-2xl border border-border bg-surface-2 p-4">
                    <Form.Item name={[field.name, 'productId']} label="Product" rules={[{ required: true, message: 'Required' }]} className="col-span-12 md:col-span-4">
                      <Select
                        placeholder="Choose product" showSearch optionFilterProp="label"
                        options={products.map((p) => ({ label: `${p.name} (${p.sku})`, value: p.id }))}
                        onChange={(val) => {
                          const prod = products.find((p) => p.id === val);
                          if (prod) {
                            const items = form.getFieldValue('items');
                            items[field.name].sellingPrice = prod.sellingPrice;
                            items[field.name].gstRate = prod.gstRate;
                            form.setFieldValue('items', [...items]);
                          }
                        }}
                      />
                    </Form.Item>
                    <Form.Item name={[field.name, 'quantity']} label="Qty" rules={[{ required: true }]} className="col-span-3 md:col-span-2">
                      <InputNumber min={1} className="w-full" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'sellingPrice']} label="Price (₹)" rules={[{ required: true }]} className="col-span-4 md:col-span-2">
                      <InputNumber min={0} className="w-full" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'discount']} label="Disc (₹)" className="col-span-3 md:col-span-2">
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

      {/* ── View / Print Invoice Modal ── */}
      <AppModal
        open={viewOpen}
        title={`Invoice — ${viewing?.invoiceNumber}`}
        subtitle={`${viewing?.customerName} · ${viewing?.saleDate}`}
        onClose={() => setViewOpen(false)}
        onConfirm={() => window.print()}
        confirmText="Print Invoice"
        width={700}
      >
        {viewing && (
          <div className="space-y-4 print:text-black" id="print-invoice">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-ink-3 text-xs">Customer Phone</span><div className="font-medium">{viewing.customerPhone}</div></div>
              <div><span className="text-ink-3 text-xs">Status</span><div><Badge tone={STATUS_TONE[viewing.status] ?? 'neutral'}>{viewing.status}</Badge></div></div>
              <div><span className="text-ink-3 text-xs">Payment Mode</span><div className="font-medium">{viewing.paymentMode}</div></div>
              <div><span className="text-ink-3 text-xs">Total Amount</span><div className="font-bold text-lg">₹{viewing.totalAmount.toLocaleString('en-IN')}</div></div>
            </div>
            {viewing.items && viewing.items.length > 0 && (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-surface-2">
                    {['Product', 'Qty', 'Price', 'Disc', 'GST%', 'Amount'].map((h) => (
                      <th key={h} className="text-left text-xs font-bold text-ink-3 px-3 py-2 border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {viewing.items.map((item) => (
                    <tr key={item.id} className="border-b border-border">
                      <td className="px-3 py-2">{item.productName}</td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2">₹{item.sellingPrice.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2">₹{item.discount.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2">{item.gstRate}%</td>
                      <td className="px-3 py-2 font-semibold">₹{item.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-2 font-bold">
                    <td colSpan={5} className="px-3 py-2 text-right">Total</td>
                    <td className="px-3 py-2">₹{viewing.totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                </tfoot>
              </table>
            )}
            {viewing.notes && <p className="text-xs text-ink-3">Notes: {viewing.notes}</p>}
          </div>
        )}
      </AppModal>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.invoiceNumber}"?`}
        description="This sale invoice will be permanently removed."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        confirmText="Delete Sale"
      />
    </div>
  );
}
