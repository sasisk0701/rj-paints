import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import { Form, Input, InputNumber, Select, message } from 'antd';
import { useBusiness } from '@/hooks/useBusiness.ts';
import { supplierService, type ApiSupplier } from '@/services/api';
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
  { key: 'supplier',    label: 'Supplier' },
  { key: 'phone',       label: 'Phone' },
  { key: 'city',        label: 'City' },
  { key: 'gst',         label: 'GST Number' },
  { key: 'outstanding', label: 'Outstanding', align: 'num' },
  { key: 'status',      label: 'Status' },
  { key: 'actions',     label: '' },
];

const initials = (name: string) =>
  name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

export default function Suppliers() {
  const { toggle } = useBusiness();
  const [suppliers, setSuppliers]     = useState<ApiSupplier[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiSupplier | null>(null);
  const [editing, setEditing]         = useState<ApiSupplier | null>(null);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [form] = Form.useForm();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supplierService.getAll({ business: toggle, search: search || undefined });
      setSuppliers(data);
    } catch {
      message.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [toggle, search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ business: toggle.toUpperCase(), outstandingBalance: 0 });
    setModalOpen(true);
  };

  const openEdit = (s: ApiSupplier) => {
    setEditing(s);
    form.setFieldsValue({
      name: s.name, gstNumber: s.gstNumber, phone: s.phone,
      email: s.email ?? '', address: s.address ?? '', city: s.city,
      business: s.business, outstandingBalance: s.outstandingBalance,
      notes: s.notes ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await supplierService.update(editing.id, values);
        message.success('Supplier updated');
      } else {
        await supplierService.create(values);
        message.success('Supplier added');
      }
      setModalOpen(false);
      form.resetFields();
      fetchAll();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.error || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await supplierService.remove(deleteTarget.id);
      message.success('Supplier deleted');
      setDeleteTarget(null);
      fetchAll();
    } catch {
      message.error('Failed to delete supplier');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    if (!suppliers.length) { message.warning('No suppliers to export'); return; }
    const header = 'Name,Phone,Email,City,GST Number,Outstanding,Business\n';
    const csv = suppliers.map((s) =>
      `"${s.name}","${s.phone}","${s.email ?? ''}","${s.city}","${s.gstNumber}",${s.outstandingBalance},"${s.business}"`
    ).join('\n');
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `suppliers-${toggle}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Exported');
  };

  const kpis = useMemo(() => {
    const totalOutstanding = suppliers.reduce((s, x) => s + x.outstandingBalance, 0);
    const withBalance      = suppliers.filter((x) => x.outstandingBalance > 0).length;
    const cleared          = suppliers.filter((x) => x.outstandingBalance === 0).length;
    return [
      { label: 'Total Suppliers',   value: String(suppliers.length),  deltaTone: 'neutral' as const },
      { label: 'Total Outstanding', value: `₹${totalOutstanding.toLocaleString('en-IN')}`, deltaTone: 'down' as const },
      { label: 'With Balance',      value: String(withBalance),        deltaTone: 'down'    as const },
      { label: 'Cleared',           value: String(cleared),            deltaTone: 'up'      as const },
    ];
  }, [suppliers]);

  const rows = useMemo(() =>
    suppliers.map((s) => ({
      id: s.id,
      supplier: (
        <CellItem
          icon={<Avatar initials={initials(s.name)} bg="#C4762E" size={30} />}
          name={s.name}
          sub={s.email ?? undefined}
        />
      ),
      phone:       s.phone,
      city:        s.city,
      gst:         <span className="font-mono text-ink-3 text-[11.5px]">{s.gstNumber}</span>,
      outstanding: (
        <span className={s.outstandingBalance > 0 ? 'font-bold text-danger' : 'text-success font-semibold'}>
          ₹{s.outstandingBalance.toLocaleString('en-IN')}
        </span>
      ),
      status: (
        <Badge tone={s.outstandingBalance > 0 ? 'warn' : 'success'}>
          {s.outstandingBalance > 0 ? 'Due' : 'Cleared'}
        </Badge>
      ),
      actions: (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(s)}>Edit</Button>
          <Button variant="dangerGhost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(s)} />
        </div>
      ),
    })),
  [suppliers]);

  return (
    <div>
      <KpiRow items={kpis} />

      <Toolbar
        left={
          <SearchBox
            placeholder="Search name, GST, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
        right={
          <>
            <Button variant="ghost" size="sm" icon={Download} onClick={handleExport}>Export</Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={openAdd}>Add Supplier</Button>
          </>
        }
      />

      {suppliers.length === 0 && !loading ? (
        <div className="text-sm text-ink-3 py-12 text-center">
          No suppliers yet. Click <strong>Add Supplier</strong> to create one.
        </div>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          title="Suppliers"
          subtitle={`${suppliers.length} supplier${suppliers.length !== 1 ? 's' : ''} · ${toggle === 'paints' ? 'Paints' : 'Interiors'} business`}
          paginationText={`Showing ${suppliers.length} supplier${suppliers.length !== 1 ? 's' : ''}`}
        />
      )}

      {/* ── Add / Edit Modal ── */}
      <AppModal
        open={modalOpen}
        title={editing ? 'Edit Supplier' : 'Add Supplier'}
        subtitle={editing ? `Editing: ${editing.name}` : 'Fill in supplier details'}
        onClose={() => { setModalOpen(false); form.resetFields(); }}
        onConfirm={handleSubmit}
        confirmText={editing ? 'Save Changes' : 'Add Supplier'}
        loading={saving}
        width={620}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="name" label="Supplier Name" rules={[{ required: true, message: 'Required' }]} className="col-span-2">
              <Input placeholder="Asian Paints Depot - Madurai" />
            </Form.Item>

            <Form.Item name="gstNumber" label="GST Number" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="33AAAA0000A1Z5" />
            </Form.Item>

            <Form.Item name="phone" label="Phone" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="9488475040" />
            </Form.Item>

            <Form.Item name="email" label="Email">
              <Input placeholder="supplier@example.com" />
            </Form.Item>

            <Form.Item name="city" label="City" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="Chennai" />
            </Form.Item>

            <Form.Item name="address" label="Address" className="col-span-2">
              <Input placeholder="Street, Area, Pincode" />
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
        description="This supplier will be permanently removed. This action cannot be undone."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        confirmText="Delete Supplier"
      />
    </div>
  );
}
