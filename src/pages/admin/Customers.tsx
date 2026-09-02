import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import { Form, Input, InputNumber, Select, message } from 'antd';
import { useBusiness } from '@/hooks/useBusiness.ts';
import { customerService, type ApiCustomer } from '@/services/api';
import { Toolbar, SearchBox } from '@/components/common/Toolbar.tsx';
import { Button } from '@/components/common/Button.tsx';
import { DataTable } from '@/components/common/DataTable';
import { CellItem } from '@/components/common/CellItem';
import { Avatar } from '@/components/common/Swatch';
import { KpiRow } from '@/components/common/KpiCard';
import { Badge } from '@/components/common/Badge';
import { AppModal } from '@/components/common/AppModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { TableColumn } from '@/types/types';

const COLUMNS: TableColumn[] = [
  { key: 'customer',    label: 'Customer' },
  { key: 'phone',       label: 'Phone' },
  { key: 'city',        label: 'City' },
  { key: 'credit',      label: 'Credit Limit', align: 'num' },
  { key: 'outstanding', label: 'Outstanding',  align: 'num' },
  { key: 'status',      label: 'Status' },
  { key: 'actions',     label: '' },
];

const initials = (name: string) =>
  name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

export default function Customers() {
  const { toggle } = useBusiness();
  const [customers, setCustomers]       = useState<ApiCustomer[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiCustomer | null>(null);
  const [editing, setEditing]           = useState<ApiCustomer | null>(null);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [form] = Form.useForm();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customerService.getAll({ business: toggle, search: search || undefined });
      setCustomers(data);
    } catch {
      message.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [toggle, search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ business: toggle.toUpperCase(), creditLimit: 0, outstandingBalance: 0 });
    setModalOpen(true);
  };

  const openEdit = (c: ApiCustomer) => {
    setEditing(c);
    form.setFieldsValue({
      name: c.name, phone: c.phone, email: c.email ?? '',
      address: c.address ?? '', city: c.city, business: c.business,
      creditLimit: c.creditLimit, outstandingBalance: c.outstandingBalance,
      notes: c.notes ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await customerService.update(editing.id, values);
        message.success('Customer updated');
      } else {
        await customerService.create(values);
        message.success('Customer added');
      }
      setModalOpen(false);
      form.resetFields();
      fetchAll();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.error || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await customerService.remove(deleteTarget.id);
      message.success('Customer deleted');
      setDeleteTarget(null);
      fetchAll();
    } catch {
      message.error('Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    if (!customers.length) { message.warning('No customers to export'); return; }
    const header = 'Name,Phone,Email,City,Credit Limit,Outstanding,Business\n';
    const csv = customers.map((c) =>
      `"${c.name}","${c.phone}","${c.email ?? ''}","${c.city}",${c.creditLimit},${c.outstandingBalance},"${c.business}"`
    ).join('\n');
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `customers-${toggle}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Exported');
  };

  const kpis = useMemo(() => {
    const totalOutstanding = customers.reduce((s, c) => s + c.outstandingBalance, 0);
    const totalCredit      = customers.reduce((s, c) => s + c.creditLimit, 0);
    const withBalance      = customers.filter((c) => c.outstandingBalance > 0).length;
    const cleared          = customers.filter((c) => c.outstandingBalance === 0).length;
    return [
      { label: 'Total Customers',   value: String(customers.length),   deltaTone: 'neutral' as const },
      { label: 'Total Outstanding', value: `₹${totalOutstanding.toLocaleString('en-IN')}`, deltaTone: 'down' as const },
      { label: 'Total Credit Limit',value: `₹${totalCredit.toLocaleString('en-IN')}`,      deltaTone: 'neutral' as const },
      { label: 'Cleared Accounts',  value: String(cleared),             deltaTone: 'up'     as const },
    ];
  }, [customers]);

  const rows = useMemo(() =>
    customers.map((c) => ({
      id: c.id,
      customer: (
        <CellItem
          icon={<Avatar initials={initials(c.name)} size={30} />}
          name={c.name}
          sub={c.email ?? undefined}
        />
      ),
      phone:       c.phone,
      city:        c.city,
      credit:      <span className="font-semibold">₹{c.creditLimit.toLocaleString('en-IN')}</span>,
      outstanding: (
        <span className={c.outstandingBalance > 0 ? 'font-bold text-danger' : 'text-success font-semibold'}>
          ₹{c.outstandingBalance.toLocaleString('en-IN')}
        </span>
      ),
      status: (
        <Badge tone={c.outstandingBalance > 0 ? 'warn' : 'success'}>
          {c.outstandingBalance > 0 ? 'Due' : 'Cleared'}
        </Badge>
      ),
      actions: (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(c)}>Edit</Button>
          <Button variant="dangerGhost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(c)} />
        </div>
      ),
    })),
  [customers]);

  return (
    <div>
      <KpiRow items={kpis} />

      <Toolbar
        left={
          <SearchBox
            placeholder="Search name, phone, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
        right={
          <>
            <Button variant="ghost" size="sm" icon={Download} onClick={handleExport}>Export</Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={openAdd}>Add Customer</Button>
          </>
        }
      />

      {customers.length === 0 && !loading ? (
        <div className="text-sm text-ink-3 py-12 text-center">
          No customers yet. Click <strong>Add Customer</strong> to create one.
        </div>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          title="Customers"
          subtitle={`${customers.length} customer${customers.length !== 1 ? 's' : ''} · ${toggle === 'paints' ? 'Paints' : 'Interiors'} business`}
          paginationText={`Showing ${customers.length} customer${customers.length !== 1 ? 's' : ''}`}
        />
      )}

      {/* ── Add / Edit Modal ── */}
      <AppModal
        open={modalOpen}
        title={editing ? 'Edit Customer' : 'Add Customer'}
        subtitle={editing ? `Editing: ${editing.name}` : 'Fill in customer details'}
        onClose={() => { setModalOpen(false); form.resetFields(); }}
        onConfirm={handleSubmit}
        confirmText={editing ? 'Save Changes' : 'Add Customer'}
        loading={saving}
        width={620}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="name" label="Customer Name" rules={[{ required: true, message: 'Required' }]} className="col-span-2">
              <Input placeholder="Sri Lakshmi Hardware" />
            </Form.Item>

            <Form.Item name="phone" label="Phone" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="9488475040" />
            </Form.Item>

            <Form.Item name="email" label="Email">
              <Input placeholder="customer@example.com" />
            </Form.Item>

            <Form.Item name="city" label="City" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="Madurai" />
            </Form.Item>

            <Form.Item name="address" label="Address">
              <Input placeholder="Street, Area, Pincode" />
            </Form.Item>

            <Form.Item name="creditLimit" label="Credit Limit (₹)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>

            <Form.Item name="outstandingBalance" label="Outstanding Balance (₹)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>

            <Form.Item name="business" label="Business" rules={[{ required: true }]}>
              <Select
                disabled={!!editing}
                options={[
                  { label: 'Paints',    value: 'PAINTS' },
                  { label: 'Interiors', value: 'INTERIORS' },
                ]}
              />
            </Form.Item>

            <Form.Item name="notes" label="Notes" className="col-span-2">
              <Input.TextArea rows={2} placeholder="Optional remarks…" />
            </Form.Item>
          </div>
        </Form>
      </AppModal>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This customer will be permanently removed. This action cannot be undone."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        confirmText="Delete Customer"
      />
    </div>
  );
}
