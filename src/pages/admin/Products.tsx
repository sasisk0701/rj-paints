import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Download, Pencil, Trash2, ImagePlus, X } from 'lucide-react';
import { Form, Input, Select, InputNumber, message } from 'antd';
import { useBusiness } from '@/hooks/useBusiness.ts';
import { apiProductService, categoryService, resolveAssetUrl, ApiProduct, ApiCategory } from '@/services/api';
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
  { key: 'image',    label: 'Image' },
  { key: 'product',  label: 'Product' },
  { key: 'category', label: 'Category' },
  { key: 'brand',    label: 'Brand' },
  { key: 'unit',     label: 'Unit' },
  { key: 'cost',     label: 'Cost',          align: 'num' },
  { key: 'price',    label: 'Selling Price', align: 'num' },
  { key: 'stock',    label: 'Stock',         align: 'num' },
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
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

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
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [imageInputKey, setImageInputKey] = useState(0);
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

  const resetImageState = (preview = '') => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(preview);
    setRemoveExistingImage(false);
    setImageInputKey((key) => key + 1);
  };

  const closeModal = () => {
    setModalOpen(false);
    form.resetFields();
    resetImageState();
  };

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ business: toggle.toUpperCase(), gstRate: 18, stock: 0, minStock: 5 });
    resetImageState();
    setModalOpen(true);
  };

  const openEdit = (p: ApiProduct) => {
    setEditing(p);
    form.setFieldsValue({
      name: p.name, categoryId: p.categoryId, brand: p.brand,
      sku: p.sku, barcode: p.barcode, description: p.description ?? '',
      purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice,
      gstRate: p.gstRate, stock: p.stock, minStock: p.minStock,
      unit: p.unit, business: p.business,
    });
    resetImageState(resolveAssetUrl(p.image));
    setModalOpen(true);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      message.error('Only JPG, PNG and WEBP images are allowed');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      message.error('Image must be 5 MB or smaller');
      event.target.value = '';
      return;
    }
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveExistingImage(false);
  };

  const handleRemoveImage = () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview('');
    setRemoveExistingImage(true);
    setImageInputKey((key) => key + 1);
  };

  const handleSubmit = async () => {
    let uploadedPath = '';
    try {
      const values = await form.validateFields();
      setSaving(true);
      const cat = categories.find((c) => c.id === values.categoryId);

      let image: string | null = editing?.image ?? null;
      if (removeExistingImage) image = null;
      if (imageFile) {
        const uploaded = await apiProductService.uploadImage(imageFile);
        uploadedPath = uploaded.path;
        image = uploaded.path;
      }

      const payload = { ...values, categoryName: cat?.name ?? '', image };
      if (editing) {
        await apiProductService.update(editing.id, payload);
        message.success('Product updated successfully');
      } else {
        await apiProductService.create(payload);
        message.success('Product created successfully');
      }
      closeModal();
      fetchAll();
    } catch (err: any) {
      if (uploadedPath) await apiProductService.deleteUploadedImage(uploadedPath).catch(() => {});
      if (!err?.errorFields) {
        message.error(err?.response?.data?.error || err?.message || 'Failed to save product');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await apiProductService.remove(deleteTarget.id);
      message.success('Product and its stored image deleted');
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
      image: p.image ? (
        <img
          src={resolveAssetUrl(p.image)}
          alt={p.name}
          className="w-11 h-11 rounded-lg object-cover border border-border bg-surface-2"
          loading="lazy"
        />
      ) : (
        <div className="w-11 h-11 rounded-lg border border-dashed border-border bg-surface-2 flex items-center justify-center text-ink-3">
          <ImagePlus size={16} />
        </div>
      ),
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

      <AppModal
        open={modalOpen}
        title={editing ? 'Edit Product' : 'Add New Product'}
        subtitle={editing ? `Editing: ${editing.name}` : 'Fill in the details to add a new product'}
        onClose={closeModal}
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

            <Form.Item label="Product Image" className="col-span-2">
              <div className="flex items-center gap-4 rounded-xl border border-border bg-surface-2 p-3">
                {imagePreview ? (
                  <img src={imagePreview} alt="Product preview" className="w-20 h-20 rounded-lg object-cover border border-border bg-white" />
                ) : (
                  <div className="w-20 h-20 rounded-lg border border-dashed border-border bg-white flex items-center justify-center text-ink-3">
                    <ImagePlus size={22} />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    key={imageInputKey}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-ink-2 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-600 hover:file:bg-blue-100"
                  />
                  <div className="text-[11px] text-ink-3 mt-1.5">JPG, PNG or WEBP · maximum 5 MB · stored on the backend server</div>
                  {imagePreview && (
                    <Button type="button" variant="dangerGhost" size="sm" icon={X} className="mt-2" onClick={handleRemoveImage}>
                      Remove Image
                    </Button>
                  )}
                </div>
              </div>
            </Form.Item>

            <Form.Item name="description" label="Description (optional)" className="col-span-2">
              <Input.TextArea rows={2} placeholder="Short product description…" />
            </Form.Item>
          </div>
        </Form>
      </AppModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This product and its locally stored image will be permanently removed. This action cannot be undone."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        confirmText="Delete Product"
      />
    </div>
  );
}
