import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Download, Pencil, Trash2 } from 'lucide-react';
import { Form, Input, Select, InputNumber, message } from 'antd';
import { useBusiness } from '@/hooks/useBusiness.ts';
import { apiProductService, categoryService, ApiProduct, ApiCategory } from '@/services/api';
import { Toolbar, SearchBox } from '@/components/common/Toolbar.tsx';
import { Button } from '@/components/common/Button.tsx';
import { DataTable } from '@/components/common/DataTable';
import { CellItem } from '@/components/common/CellItem';
import { Swatch } from '@/components/common/Swatch';
import { KpiRow } from '@/components/common/KpiCard';
import { Badge } from '@/components/common/Badge';
import { AppModal } from '@/components/common/AppModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { TableColumn, Tone } from '@/types/types';

const COLUMNS: TableColumn[] = [
  { key: 'product',  label: 'Product' },
  { key: 'category', label: 'Category' },
  { key: 'brand',    label: 'Brand' },
  { key: 'unit',     label: 'Unit' },
  { key: 'cost',     label: 'Cost',          align: 'num' },
  { key: 'price',    label: 'Selling Price',  align: 'num' },
  { key: 'stock',    label: 'Stock',          align: 'num' },
  { key: 'status',   label: 'Status' },
  { key: 'actions',  label: '' },
];

const STATUS_TONE: Record<string, Tone> = {
  'In Stock':     'success',
  'Low Stock':    'warn',
  'Out of Stock': 'danger',
};

const UNITS = [
  '20 Liters', '10 Liters', '4 Liters', '1 Liter', 'Liter',
  'Kg', '40 Kg Bag', '25 Kg Bag', 'Piece', 'Set',
  'Sheet', 'Pack', 'Box', 'Roll', 'Sq.Ft',
];

const GST_RATES = [0, 5, 12, 18, 28];

export default function Products() {
  const { toggle } = useBusiness();

  const [products, setProducts]         = useState<ApiProduct[]>([]);
  const [categories, setCategories]     = useState<ApiCategory[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [catFilter, setCatFilter]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiProduct | null>(null);
  const [editing, setEditing]           = useState<ApiProduct | null>(null);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [form] = Form.useForm();

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        apiProductService.getAll({
          business: toggle,
          search:   search       || undefined,
          category: catFilter    || undefined,
          status:   statusFilter || undefined,
        }),
        categoryService.getAll(toggle),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [toggle, search, catFilter, statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ business: toggle.toUpperCase(), gstRate: 18, stock: 0, minStock: 5 });
    setModalOpen(true);
  };

  const openEdit = (p: ApiProduct) => {
    setEditing(p);
    form.setFieldsValue({
      name: p.name, categoryId: p.categoryId, brand: p.brand,
      sku: p.sku, barcode: p.barcode, description: p.description ?? '',
      purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice,
      gstRate: p.gstRate, stock: p.stock, minStock: p.minStock,
      unit: p.unit, business: p.business, image: p.image ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const cat = categories.find((c) => c.id === values.categoryId);
      const payload = { ...values, categoryName: cat?.name ?? '' };
      if (editing) {
        await apiProductService.update(editing.id, payload);
        message.success('Product updated successfully');
      } else {
        await apiProductService.create(payload);
        message.success('Product created successfully');
      }
      setModalOpen(false);
      form.resetFields();
      fetchAll();
    } catch (err: any) {
      if (err?.response) message.error(err.response.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await apiProductService.remove(deleteTarget.id);
      message.success('Product deleted');
      setDeleteTarget(null);
      fetchAll();
    } catch {
      message.error('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    if (!products.length) { message.warning('No products to export'); return; }
    const header = 'Name,SKU,Barcode,Category,Brand,Unit,Purchase Price,Selling Price,GST%,Stock,Min Stock,Status\n';
    const csv = products.map((p) =>
      `"${p.name}","${p.sku}","${p.barcode}","${p.categoryName}","${p.brand}","${p.unit}",${p.purchasePrice},${p.sellingPrice},${p.gstRate},${p.stock},${p.minStock},"${p.status}"`
    ).join('\n');
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `products-${toggle}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Products exported');
  };

  const kpis = useMemo(() => {
    const inStock  = products.filter((p) => p.status === 'In Stock').length;
    const lowStock = products.filter((p) => p.status === 'Low Stock').length;
    const outStock = products.filter((p) => p.status === 'Out of Stock').length;
    const stockVal = products.reduce((s, p) => s + p.sellingPrice * p.stock, 0);
    return [
      { label: 'Total Products', value: String(products.length), deltaTone: 'neutral' as const },
      { label: 'Stock Value',    value: `₹${(stockVal / 100000).toFixed(2)}L`, deltaTone: 'up'   as const },
      { label: 'In Stock',       value: String(inStock),  deltaTone: 'up'   as const },
      { label: 'Low Stock',      value: String(lowStock), deltaTone: 'down' as const },
      { label: 'Out of Stock',   value: String(outStock), deltaTone: 'down' as const },
    ];
  }, [products]);

  const rows = useMemo(() =>
    products.map((p) => ({
      id: p.id,
      product: (
        <CellItem
          icon={<Swatch color={p.category?.color ?? '#6B7280'} />}
          name={p.name}
          sub={p.sku}
          mono
        />
      ),
      category: p.categoryName,
      brand:    p.brand,
      unit:     p.unit,
      cost:     `₹${p.purchasePrice.toLocaleString('en-IN')}`,
      price:    `₹${p.sellingPrice.toLocaleString('en-IN')}`,
      stock: (
        <span className={`font-bold ${p.stock <= p.minStock ? 'text-danger' : 'text-ink'}`}>
          {p.stock}
        </span>
      ),
      status:  <Badge tone={STATUS_TONE[p.status] ?? 'neutral'}>{p.status}</Badge>,
      actions: (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(p)}>Edit</Button>
          <Button variant="dangerGhost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(p)} />
        </div>
      ),
    })),
  [products]);

  return (
    <div>
      <KpiRow items={kpis} />

      <Toolbar
        left={
          <>
            <Select
              placeholder="All Categories"
              allowClear size="small" style={{ width: 180 }}
              value={catFilter || undefined}
              onChange={(v) => setCatFilter(v ?? '')}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
            <Select
              placeholder="All Status"
              allowClear size="small" style={{ width: 140 }}
              value={statusFilter || undefined}
              onChange={(v) => setStatusFilter(v ?? '')}
              options={['In Stock', 'Low Stock', 'Out of Stock'].map((s) => ({ label: s, value: s }))}
            />
            <SearchBox
              placeholder="Search name, SKU, brand…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </>
        }
        right={
          <>
            <Button variant="ghost" size="sm" icon={Download} onClick={handleExport}>Export</Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={openAdd}>Add Product</Button>
          </>
        }
      />

      {products.length === 0 && !loading ? (
        <div className="text-sm text-ink-3 py-12 text-center">
          No products yet. Click <strong>Add Product</strong> to create one.
        </div>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          title="Product Catalog"
          subtitle={`${products.length} product${products.length !== 1 ? 's' : ''} · ${toggle === 'paints' ? 'Paints' : 'Interiors'} business`}
          paginationText={`Showing ${products.length} product${products.length !== 1 ? 's' : ''}`}
        />
      )}

      {/* ── Add / Edit Modal ── */}
      <AppModal
        open={modalOpen}
        title={editing ? 'Edit Product' : 'Add New Product'}
        subtitle={editing ? `Editing: ${editing.name}` : 'Fill in the details to add a new product'}
        onClose={() => { setModalOpen(false); form.resetFields(); }}
        onConfirm={handleSubmit}
        confirmText={editing ? 'Save Changes' : 'Create Product'}
        loading={saving}
        width={680}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-x-4">

            <Form.Item name="name" label="Product Name" rules={[{ required: true, message: 'Required' }]} className="col-span-2">
              <Input placeholder="e.g. Asian Paints Royale Luxury Emulsion" />
            </Form.Item>

            <Form.Item name="categoryId" label="Category" rules={[{ required: true, message: 'Required' }]}>
              <Select placeholder="Select category" options={categories.map((c) => ({ label: c.name, value: c.id }))} />
            </Form.Item>

            <Form.Item name="brand" label="Brand" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="e.g. Asian Paints" />
            </Form.Item>

            <Form.Item name="sku" label="SKU Code" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="e.g. AP-ROY-SILK-20L" />
            </Form.Item>

            <Form.Item name="barcode" label="Barcode" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="e.g. 890123456781" />
            </Form.Item>

            <Form.Item name="purchasePrice" label="Purchase Price (₹)" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>

            <Form.Item name="sellingPrice" label="Selling Price (₹)" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>

            <Form.Item name="gstRate" label="GST Rate (%)">
              <Select options={GST_RATES.map((r) => ({ label: `${r}%`, value: r }))} />
            </Form.Item>

            <Form.Item name="unit" label="Unit" rules={[{ required: true, message: 'Required' }]}>
              <Select placeholder="Select unit" options={UNITS.map((u) => ({ label: u, value: u }))} />
            </Form.Item>

            <Form.Item name="stock" label="Opening Stock">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>

            <Form.Item name="minStock" label="Min Stock Alert">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="5" />
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

            <Form.Item name="image" label="Image URL (optional)" className="col-span-2">
              <Input placeholder="https://images.unsplash.com/…" />
            </Form.Item>

            <Form.Item name="description" label="Description (optional)" className="col-span-2">
              <Input.TextArea rows={2} placeholder="Short product description…" />
            </Form.Item>

          </div>
        </Form>
      </AppModal>

      {/* ── Delete Confirm Dialog ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This product will be permanently removed. This action cannot be undone."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        confirmText="Delete Product"
      />
    </div>
  );
}
