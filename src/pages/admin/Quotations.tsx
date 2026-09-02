import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Download, Eye, Send, ArrowRight } from 'lucide-react';
import { Form, Input, InputNumber, Select, message, Tooltip } from 'antd';
import { useBusiness } from '@/hooks/useBusiness.ts';
import { quotationService, customerService, apiProductService, type ApiQuotation, type ApiCustomer, type ApiProduct } from '@/services/api';
import { Toolbar, SearchBox } from '@/components/common/Toolbar.tsx';
import { Button } from '@/components/common/Button.tsx';
import { DataTable } from '@/components/common/DataTable';
import { KpiRow } from '@/components/common/KpiCard';
import { Badge } from '@/components/common/Badge';
import { AppModal } from '@/components/common/AppModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { KpiItem, TableColumn, Tone } from '@/types/types';

const COLUMNS: TableColumn[] = [
  { key: 'quote',    label: 'Quote #' },
  { key: 'date',     label: 'Date' },
  { key: 'customer', label: 'Customer' },
  { key: 'valid',    label: 'Valid Until' },
  { key: 'amount',   label: 'Amount',  align: 'num' },
  { key: 'status',   label: 'Status' },
  { key: 'actions',  label: '' },
];

const STATUS_OPTIONS = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'];
const GST_RATES      = [0, 5, 12, 18, 28];

const STATUS_TONE: Record<string, Tone> = {
  Draft: 'neutral', Sent: 'paints', Accepted: 'success', Rejected: 'danger', Expired: 'warn',
};

export default function Quotations() {
  const { toggle } = useBusiness();
  const [quotations, setQuotations]     = useState<ApiQuotation[]>([]);
  const [customers, setCustomers]       = useState<ApiCustomer[]>([]);
  const [products, setProducts]         = useState<ApiProduct[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [viewOpen, setViewOpen]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiQuotation | null>(null);
  const [editing, setEditing]           = useState<ApiQuotation | null>(null);
  const [viewing, setViewing]           = useState<ApiQuotation | null>(null);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [converting, setConverting]     = useState(false);
  const [form] = Form.useForm();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [quotRes, custRes, prodRes] = await Promise.all([
        quotationService.getAll({ business: toggle, search: search || undefined, status: statusFilter || undefined }),
        customerService.getAll({ business: toggle }),
        apiProductService.getAll({ business: toggle }),
      ]);
      setQuotations(quotRes);
      setCustomers(custRes);
      setProducts(prodRes);
    } catch {
      message.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  }, [toggle, search, statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const defaultValidUntil = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      quoteNumber: `QT-${Date.now()}`,
      validUntil: defaultValidUntil(),
      status: 'Draft',
      business: toggle.toUpperCase(),
      terms: 'Prices are valid for 30 days from the date of quotation. GST extra as applicable.',
      items: [{ description: '', productId: null, quantity: 1, unitPrice: 0, discount: 0, gstRate: 18 }],
    });
    setModalOpen(true);
  };

  const openEdit = (q: ApiQuotation) => {
    setEditing(q);
    form.setFieldsValue({
      quoteNumber: q.quoteNumber,
      customerId: undefined,
      customerName: q.customerName,
      customerPhone: q.customerPhone,
      customerEmail: q.customerEmail ?? '',
      validUntil: q.validUntil,
      status: q.status,
      notes: q.notes ?? '',
      terms: q.terms ?? '',
      business: q.business,
      items: q.items?.map((i) => ({
        productId: i.productId ?? null,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        gstRate: i.gstRate,
      })) ?? [{ description: '', productId: null, quantity: 1, unitPrice: 0, discount: 0, gstRate: 18 }],
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        ...values,
        items: values.items.map((item: any) => ({
          productId: item.productId ?? null,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount ?? 0),
          gstRate: Number(item.gstRate ?? 18),
          amount: Number(item.quantity) * Number(item.unitPrice) - Number(item.discount ?? 0),
        })),
      };
      if (editing) {
        await quotationService.update(editing.id, payload);
        message.success('Quotation updated');
      } else {
        await quotationService.create(payload);
        message.success('Quotation created');
      }
      setModalOpen(false);
      form.resetFields();
      fetchAll();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.error || 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await quotationService.remove(deleteTarget.id);
      message.success('Quotation deleted');
      setDeleteTarget(null);
      fetchAll();
    } catch {
      message.error('Failed to delete quotation');
    } finally {
      setDeleting(false);
    }
  };

  const handleConvertToSale = async (q: ApiQuotation) => {
    setConverting(true);
    try {
      await quotationService.convertToSale(q.id);
      message.success(`Quotation ${q.quoteNumber} converted to Sale`);
      fetchAll();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to convert to sale');
    } finally {
      setConverting(false);
    }
  };

  const handleWhatsApp = (q: ApiQuotation) => {
    const lines = q.items?.map((i) => `• ${i.description} × ${i.quantity} = ₹${i.amount.toLocaleString('en-IN')}`).join('\n') ?? '';
    const text = encodeURIComponent(
      `*Quotation ${q.quoteNumber}*\nDear ${q.customerName},\n\nPlease find your quotation below:\n\n${lines}\n\n*Total: ₹${q.totalAmount.toLocaleString('en-IN')}*\nValid until: ${q.validUntil}\n\n${q.terms ?? ''}\n\n— RJ Paints & Styleo Interiors`
    );
    window.open(`https://wa.me/91${q.customerPhone}?text=${text}`, '_blank');
  };

  const handleExport = () => {
    if (!quotations.length) { message.warning('No quotations to export'); return; }
    const header = 'Quote #,Date,Customer,Phone,Amount,Status,Valid Until\n';
    const csv = quotations.map((q) =>
      `"${q.quoteNumber}","${q.createdAt.split('T')[0]}","${q.customerName}","${q.customerPhone}",${q.totalAmount},"${q.status}","${q.validUntil}"`
    ).join('\n');
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `quotations-${toggle}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Exported');
  };

  const kpis = useMemo((): KpiItem[] => {
    const total    = quotations.reduce((s, q) => s + q.totalAmount, 0);
    const draft    = quotations.filter((q) => q.status === 'Draft').length;
    const sent     = quotations.filter((q) => q.status === 'Sent').length;
    const accepted = quotations.filter((q) => q.status === 'Accepted').length;
    return [
      { label: 'Total Quote Value', value: `₹${total.toLocaleString('en-IN')}`, deltaTone: 'neutral' },
      { label: 'Draft',             value: String(draft),    deltaTone: 'neutral' },
      { label: 'Sent',              value: String(sent),     deltaTone: 'up' },
      { label: 'Accepted',          value: String(accepted), deltaTone: 'up' },
    ];
  }, [quotations]);

  const rows = useMemo(() =>
    quotations.map((q) => ({
      id: q.id,
      quote:    <span className="font-mono">{q.quoteNumber}</span>,
      date:     q.createdAt.split('T')[0],
      customer: q.customerName,
      valid:    q.validUntil,
      amount:   `₹${q.totalAmount.toLocaleString('en-IN')}`,
      status:   <Badge tone={STATUS_TONE[q.status] ?? 'neutral'}>{q.status}</Badge>,
      actions: (
        <div className="flex gap-1">
          <Tooltip title="View Quotation">
            <span>
              <Button variant="ghost" size="sm" icon={Eye} onClick={() => { setViewing(q); setViewOpen(true); }} />
            </span>
          </Tooltip>
          <Tooltip title="Send via WhatsApp">
            <span>
              <Button variant="ghost" size="sm" icon={Send} onClick={() => handleWhatsApp(q)} />
            </span>
          </Tooltip>
          {(q.status === 'Accepted' || q.status === 'Sent') && (
            <Tooltip title="Convert to Sale">
              <span>
                <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => handleConvertToSale(q)} />
              </span>
            </Tooltip>
          )}
          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(q)}>Edit</Button>
          <Button variant="dangerGhost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(q)} />
        </div>
      ),
    })),
  [quotations, converting]);

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
            <SearchBox placeholder="Search quote #, customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </>
        }
        right={
          <>
            <Button variant="ghost" size="sm" icon={Download} onClick={handleExport}>Export</Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={openAdd}>New Quotation</Button>
          </>
        }
      />

      {quotations.length === 0 && !loading ? (
        <div className="text-sm text-ink-3 py-12 text-center">
          No quotations yet. Click <strong>New Quotation</strong> to create one.
        </div>
      ) : (
        <DataTable
          columns={COLUMNS} rows={rows}
          title="Quotations"
          subtitle={`${quotations.length} quotation${quotations.length !== 1 ? 's' : ''} · ${toggle === 'paints' ? 'Paints' : 'Interiors'} business`}
          paginationText={`Showing ${quotations.length} quotation${quotations.length !== 1 ? 's' : ''}`}
        />
      )}

      {/* ── Create / Edit Modal ── */}
      <AppModal
        open={modalOpen}
        title={editing ? 'Edit Quotation' : 'New Quotation'}
        subtitle={editing ? `Editing: ${editing.quoteNumber}` : 'Create a professional quotation for your customer'}
        onClose={() => { setModalOpen(false); form.resetFields(); }}
        onConfirm={handleSubmit}
        confirmText={editing ? 'Save Changes' : 'Create Quotation'}
        loading={saving}
        width={900}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="quoteNumber" label="Quote Number" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="QT-1001" />
            </Form.Item>
            <Form.Item name="validUntil" label="Valid Until" rules={[{ required: true, message: 'Required' }]}>
              <Input type="date" />
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
                    form.setFieldValue('customerEmail', cust.email ?? '');
                  }
                }}
              />
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select options={STATUS_OPTIONS.map((v) => ({ label: v, value: v }))} />
            </Form.Item>
            <Form.Item name="customerName" label="Customer Name" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="Sri Lakshmi Hardware" />
            </Form.Item>
            <Form.Item name="customerPhone" label="Customer Phone" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="9488475040" />
            </Form.Item>
            <Form.Item name="customerEmail" label="Customer Email" className="col-span-2">
              <Input placeholder="customer@example.com" />
            </Form.Item>
          </div>

          {/* Line Items */}
          <Form.List name="items" rules={[{ validator: async (_, items) => { if (!items?.length) throw new Error('Add at least one item'); } }]}>
            {(fields, { add, remove }) => (
              <div className="space-y-3 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-ink-3">Line Items</span>
                  <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={() => add({ description: '', productId: null, quantity: 1, unitPrice: 0, discount: 0, gstRate: 18 })}>
                    Add Item
                  </Button>
                </div>
                {fields.map((field) => (
                  <div key={field.key} className="grid grid-cols-12 gap-3 items-end rounded-2xl border border-border bg-surface-2 p-4">
                    {/* Optional product link */}
                    <Form.Item name={[field.name, 'productId']} label="Link Product (optional)" className="col-span-12 md:col-span-4">
                      <Select
                        placeholder="Choose product (auto-fills price)" allowClear showSearch optionFilterProp="label"
                        options={products.map((p) => ({ label: `${p.name} (${p.sku})`, value: p.id }))}
                        onChange={(val) => {
                          const prod = products.find((p) => p.id === val);
                          if (prod) {
                            const items = form.getFieldValue('items');
                            items[field.name].description = prod.name;
                            items[field.name].unitPrice   = prod.sellingPrice;
                            items[field.name].gstRate     = prod.gstRate;
                            form.setFieldValue('items', [...items]);
                          }
                        }}
                      />
                    </Form.Item>
                    <Form.Item name={[field.name, 'description']} label="Description" rules={[{ required: true, message: 'Required' }]} className="col-span-12 md:col-span-8">
                      <Input placeholder="e.g. Asian Paints Royale Luxury Emulsion 20L" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'quantity']} label="Qty" rules={[{ required: true }]} className="col-span-3 md:col-span-2">
                      <InputNumber min={1} className="w-full" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'unitPrice']} label="Unit Price (₹)" rules={[{ required: true }]} className="col-span-4 md:col-span-3">
                      <InputNumber min={0} className="w-full" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'discount']} label="Discount (₹)" className="col-span-3 md:col-span-2">
                      <InputNumber min={0} className="w-full" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'gstRate']} label="GST %" className="col-span-3 md:col-span-2">
                      <Select options={GST_RATES.map((r) => ({ label: `${r}%`, value: r }))} />
                    </Form.Item>
                    <div className="col-span-3 md:col-span-1 flex justify-end">
                      <Button type="button" variant="dangerGhost" size="sm" icon={Trash2} onClick={() => remove(field.name)} disabled={fields.length === 1} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Form.List>

          <div className="grid grid-cols-2 gap-x-4 mt-4">
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={2} placeholder="Internal notes or special instructions…" />
            </Form.Item>
            <Form.Item name="terms" label="Terms & Conditions">
              <Input.TextArea rows={2} placeholder="Payment terms, validity, etc." />
            </Form.Item>
          </div>
        </Form>
      </AppModal>

      {/* ── View Quotation Modal ── */}
      <AppModal
        open={viewOpen}
        title={`Quotation — ${viewing?.quoteNumber}`}
        subtitle={`${viewing?.customerName} · Valid until ${viewing?.validUntil}`}
        onClose={() => setViewOpen(false)}
        onConfirm={() => window.print()}
        confirmText="Print Quotation"
        width={760}
      >
        {viewing && (
          <div className="space-y-5" id="print-quotation">
            {/* Header info */}
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg font-bold text-ink">{viewing.customerName}</div>
                <div className="text-sm text-ink-3">{viewing.customerPhone}</div>
                {viewing.customerEmail && <div className="text-sm text-ink-3">{viewing.customerEmail}</div>}
              </div>
              <Badge tone={STATUS_TONE[viewing.status] ?? 'neutral'}>{viewing.status}</Badge>
            </div>

            {/* Line items table */}
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-surface-2">
                  {['#', 'Description', 'Qty', 'Unit Price', 'Disc', 'GST%', 'Amount'].map((h) => (
                    <th key={h} className="text-left text-xs font-bold text-ink-3 px-3 py-2 border-b border-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {viewing.items?.map((item, idx) => (
                  <tr key={item.id} className="border-b border-border hover:bg-surface-2">
                    <td className="px-3 py-2 text-ink-3">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium">{item.description}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2">₹{item.discount.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2">{item.gstRate}%</td>
                    <td className="px-3 py-2 font-semibold">₹{item.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={6} className="px-3 py-2 text-right text-xs text-ink-3">Subtotal</td>
                  <td className="px-3 py-2 font-medium">₹{viewing.subtotal.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td colSpan={6} className="px-3 py-1 text-right text-xs text-ink-3">GST</td>
                  <td className="px-3 py-1 font-medium">₹{viewing.gstAmount.toLocaleString('en-IN')}</td>
                </tr>
                <tr className="bg-surface-2 font-bold text-base">
                  <td colSpan={6} className="px-3 py-2.5 text-right">Total</td>
                  <td className="px-3 py-2.5">₹{viewing.totalAmount.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>

            {/* Terms */}
            {viewing.terms && (
              <div className="rounded-xl border border-border bg-surface-2 p-4">
                <div className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-1">Terms & Conditions</div>
                <p className="text-xs text-ink-2">{viewing.terms}</p>
              </div>
            )}

            {/* WhatsApp CTA */}
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              onClick={() => handleWhatsApp(viewing)}
              className="w-full"
            >
              Send via WhatsApp to {viewing.customerPhone}
            </Button>
          </div>
        )}
      </AppModal>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.quoteNumber}"?`}
        description="This quotation will be permanently removed."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        confirmText="Delete Quotation"
      />
    </div>
  );
}
