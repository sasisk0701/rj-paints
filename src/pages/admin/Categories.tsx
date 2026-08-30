import { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Form, Input, Select, message } from 'antd';
import { useBusiness } from '@/hooks/useBusiness.ts';
import { categoryService, ApiCategory } from '@/services/api';
import { Toolbar } from '@/components/common/Toolbar.tsx';
import { Button } from '@/components/common/Button.tsx';
import { Badge } from '@/components/common/Badge.tsx';
import { Panel } from '@/components/common/Panel.tsx';
import { KpiRow } from '@/components/common/KpiCard';
import { AppModal } from '@/components/common/AppModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

const COLOR_PRESETS = [
  '#8FD3C0', '#4A90D9', '#C97B4C', '#B65454', '#2A2A2A',
  '#9C8CD6', '#6B7280', '#5B7FBE', '#D9C27E', '#7A9E7E',
  '#E8A87C', '#A0785A', '#F59E0B', '#10B981', '#EF4444',
];

export default function Categories() {
  const { toggle } = useBusiness();

  const [categories, setCategories]   = useState<ApiCategory[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiCategory | null>(null);
  const [editing, setEditing]         = useState<ApiCategory | null>(null);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setCategories(await categoryService.getAll(toggle));
    } catch {
      message.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, [toggle]);

  const openAdd = () => {
    setEditing(null);
    setSelectedColor(COLOR_PRESETS[0]);
    form.resetFields();
    form.setFieldsValue({ business: toggle.toUpperCase(), color: COLOR_PRESETS[0] });
    setModalOpen(true);
  };

  const openEdit = (cat: ApiCategory) => {
    setEditing(cat);
    setSelectedColor(cat.color);
    form.setFieldsValue({
      name: cat.name,
      business: cat.business,
      description: cat.description ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = { ...values, color: selectedColor };
      if (editing) {
        await categoryService.update(editing.id, payload);
        message.success('Category updated successfully');
      } else {
        await categoryService.create(payload);
        message.success('Category created successfully');
      }
      setModalOpen(false);
      form.resetFields();
      fetchCategories();
    } catch (err: any) {
      if (err?.response) message.error(err.response.data?.error || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await categoryService.remove(deleteTarget.id);
      message.success('Category deleted');
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  const kpis = useMemo(() => [
    { label: 'Total Categories', value: String(categories.length), deltaTone: 'neutral' as const },
    { label: 'Total Products',   value: String(categories.reduce((s, c) => s + (c._count?.products ?? 0), 0)), deltaTone: 'up' as const },
  ], [categories]);

  return (
    <div>
      <KpiRow items={kpis} />

      <Toolbar
        left={
          <span className="text-xs text-ink-3">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} · {toggle === 'paints' ? 'Paints' : 'Interiors'}
          </span>
        }
        right={
          <Button variant="primary" size="sm" icon={Plus} onClick={openAdd}>
            Add Category
          </Button>
        }
      />

      {loading ? (
        <div className="text-sm text-ink-3 py-12 text-center">Loading categories…</div>
      ) : categories.length === 0 ? (
        <div className="text-sm text-ink-3 py-12 text-center">
          No categories yet. Click <strong>Add Category</strong> to create one.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {categories.map((cat) => (
            <Panel key={cat.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex-none shadow-sm" style={{ backgroundColor: cat.color }} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ink truncate">{cat.name}</div>
                  <div className="text-[11.5px] text-ink-3 mt-0.5">
                    {cat._count?.products ?? 0} product{(cat._count?.products ?? 0) !== 1 ? 's' : ''}
                  </div>
                  {cat.description && (
                    <div className="text-[11.5px] text-ink-3 mt-1 line-clamp-2">{cat.description}</div>
                  )}
                </div>
                <Badge tone={cat.business === 'PAINTS' ? 'paints' : cat.business === 'INTERIORS' ? 'interiors' : 'neutral'}>
                  {cat.business === 'PAINTS' ? 'Paints' : cat.business === 'INTERIORS' ? 'Interiors' : 'Both'}
                </Badge>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(cat)}>Edit</Button>
                <Button variant="dangerGhost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(cat)}>Delete</Button>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      <AppModal
        open={modalOpen}
        title={editing ? `Edit Category` : 'Add New Category'}
        subtitle={editing ? `Editing: ${editing.name}` : 'Fill in the details to create a new category'}
        onClose={() => { setModalOpen(false); form.resetFields(); }}
        onConfirm={handleSubmit}
        confirmText={editing ? 'Save Changes' : 'Create Category'}
        loading={saving}
        width={480}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Category Name" rules={[{ required: true, message: 'Please enter category name' }]}>
            <Input placeholder="e.g. Interior Paint" size="large" />
          </Form.Item>

          <Form.Item name="business" label="Business" rules={[{ required: true }]}>
            <Select
              size="large"
              disabled={!!editing}
              options={[
                { label: 'Paints', value: 'PAINTS' },
                { label: 'Interiors', value: 'INTERIORS' },
                { label: 'Both', value: 'BOTH' },
              ]}
            />
          </Form.Item>

          <Form.Item name="description" label="Description (optional)">
            <Input.TextArea rows={2} placeholder="Short description of this category…" />
          </Form.Item>

          <Form.Item label="Color">
            <div className="flex flex-wrap gap-2 mt-1">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className="w-8 h-8 rounded-lg border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: selectedColor === c ? '#1f2937' : 'transparent',
                    transform: selectedColor === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-5 h-5 rounded-md" style={{ backgroundColor: selectedColor }} />
              <span className="text-xs text-ink-3 font-mono">{selectedColor}</span>
            </div>
          </Form.Item>
        </Form>
      </AppModal>

      {/* ── Delete Confirm Dialog ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description={
          deleteTarget?._count?.products
            ? `This category has ${deleteTarget._count.products} product(s) linked. Remove all products first before deleting.`
            : 'This action cannot be undone.'
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        confirmText="Delete Category"
      />
    </div>
  );
}
