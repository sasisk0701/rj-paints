import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Download, Pencil, Trash2, ImagePlus, X, Eye } from 'lucide-react';
import {
  DatePicker,
  Form,
  Input,
  Select,
  InputNumber,
  Pagination,
  message,
} from 'antd';
import type { Dayjs } from 'dayjs';
import { useBusiness } from '@/hooks/useBusiness.ts';
import {
  apiProductService,
  categoryService,
  resolveAssetUrl,
  type ApiProduct,
  type ApiCategory,
} from '@/services/api';
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
import { formatUtcDateTime } from '@/utils/dateFormat';
import { parseProductVolume } from '@/utils/productVolume';
import { exportProductsToPdf } from '@/utils/transactionPdfExport';

const COLUMNS: TableColumn[] = [
  { key: 'image', label: 'Image' },
  { key: 'product', label: 'Product', align: 'center' },
  { key: 'category', label: 'Category', align: 'center' },
  { key: 'hsn', label: 'HSN Code', align: 'center' },
  { key: 'color', label: 'Color', align: 'center' },
  { key: 'brand', label: 'Brand', align: 'center' },
  { key: 'unit', label: 'Volume', align: 'center' },
  { key: 'cost', label: 'Purchase Price', align: 'center' },
  { key: 'price', label: 'Selling Price', align: 'center' },
  { key: 'stock', label: 'Stock', align: 'center' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'actions', label: '' },
];

const STATUS_TONE: Record<string, Tone> = {
  'In Stock': 'success',
  'Low Stock': 'warn',
  'Out of Stock': 'danger',
};

const VOLUME_UNITS = [
  'L',
  'M',
  'Kg',
  'Liter',
  'Liters',
  'Kg Bag',
  'Piece',
  'Set',
  'Sheet',
  'Pack',
  'Box',
  'Roll',
  'Sq.Ft',
];

const GST_RATES = [0, 5, 12, 18, 28];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Display the saved volume and its unit together.
 *
 * Examples:
 * "67 M"  -> "67 M"
 * "67M"   -> "67 M"
 * "20 Kg" -> "20 Kg"
 * "10 L"  -> "10 L"
 *
 * This function does not calculate or change the saved volume.
 */
function displayProductVolume(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const raw = String(value).trim();

  if (!raw) return '-';

  const match = raw.match(/^([\d,]+(?:\.\d+)?)\s*(.*?)$/);

  if (!match) return raw;

  const amount = match[1];
  const unit = match[2].trim();

  return unit ? `${amount} ${unit}` : amount;
}

export default function Products() {
  const { toggle } = useBusiness();

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiProduct | null>(null);
  const [purchaseHistoryProduct, setPurchaseHistoryProduct] =
    useState<ApiProduct | null>(null);
  const [editing, setEditing] = useState<ApiProduct | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
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
          search: search || undefined,
          category: catFilter || undefined,
          status: statusFilter || undefined,
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

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const resetImageState = (preview = '') => {
    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

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

    form.setFieldsValue({
      business: toggle.toUpperCase(),
      gstRate: 18,
      stock: 0,
      minStock: 0,
      volumeUnit: 'L',
    });

    resetImageState();
    setModalOpen(true);
  };

  const openEdit = (product: ApiProduct) => {
    setEditing(product);

    // Read the saved amount and unit for the Edit Product form.
    const volume = parseProductVolume(product.unit);

    form.setFieldsValue({
      name: product.name,
      categoryId: product.categoryId,
      brand: product.brand,
      color: product.color ?? '',
      hsn: product.hsn ?? '',
      description: product.description ?? '',
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      gstRate: product.gstRate,
      minStock: product.minStock,
      volumeAmount: volume.amount,
      volumeUnit: volume.unit,
      business: product.business,
    });

    resetImageState(resolveAssetUrl(product.image));
    setModalOpen(true);
  };

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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

    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveExistingImage(false);
  };

  const handleRemoveImage = () => {
    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

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

      const category = categories.find(
        (item) => item.id === values.categoryId
      );

      const { volumeAmount, volumeUnit, ...productValues } = values;

      let image: string | null = editing?.image ?? null;

      if (removeExistingImage) {
        image = null;
      }

      if (imageFile) {
        const uploaded = await apiProductService.uploadImage(imageFile);
        uploadedPath = uploaded.path;
        image = uploaded.path;
      }

      // Save both the amount and the selected unit.
      // Example: 67 + M becomes "67 M".
      const savedVolume = [
        volumeAmount,
        volumeUnit,
      ]
        .filter((value) => value !== undefined && value !== null && value !== '')
        .join(' ');

      const payload = {
        ...productValues,
        unit: savedVolume,
        categoryName: category?.name ?? '',
        image,
      };

      if (editing) {
        await apiProductService.update(editing.id, payload);
        message.success('Product updated successfully');
      } else {
        await apiProductService.create(payload);
        message.success('Product created successfully');
      }

      closeModal();
      await fetchAll();
    } catch (err: any) {
      if (uploadedPath) {
        await apiProductService
          .deleteUploadedImage(uploadedPath)
          .catch(() => {});
      }

      if (!err?.errorFields) {
        message.error(
          err?.response?.data?.error ||
            err?.message ||
            'Failed to save product'
        );
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

      await fetchAll();
    } catch {
      message.error('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        if (!dateRange?.[0] || !dateRange[1]) return true;

        const createdAt = new Date(product.createdAt);

        return (
          createdAt >= dateRange[0].startOf('day').toDate() &&
          createdAt <= dateRange[1].endOf('day').toDate()
        );
      }),
    [products, dateRange]
  );

  const handleExport = () => {
    try {
      exportProductsToPdf(filteredProducts, toggle);
      message.success('Products exported as PDF');
    } catch (error) {
      message.warning(
        error instanceof Error
          ? error.message
          : 'Failed to export products'
      );
    }
  };

  const handleExportProduct = (product: ApiProduct) => {
    try {
      exportProductsToPdf(
        [product],
        toggle,
        `product-${product.name}`
      );
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : `Failed to export ${product.name}`
      );
    }
  };

  const pageCount = Math.max(
    1,
    Math.ceil(filteredProducts.length / 10)
  );

  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  const kpis = useMemo(() => {
    const inStock = filteredProducts.filter(
      (product) => product.status === 'In Stock'
    ).length;

    const lowStock = filteredProducts.filter(
      (product) =>
        product.stock > 0 &&
        product.stock <= product.minStock
    ).length;

    const outStock = filteredProducts.filter(
      (product) => product.status === 'Out of Stock'
    ).length;

    return [
      {
        label: 'Total Products',
        value: String(filteredProducts.length),
        deltaTone: 'neutral' as const,
      },
      {
        label: 'In Stock',
        value: String(inStock),
        deltaTone: 'up' as const,
      },
      {
        label: 'Low Stock',
        value: String(lowStock),
        deltaTone: 'down' as const,
      },
      {
        label: 'Out of Stock',
        value: String(outStock),
        deltaTone: 'down' as const,
      },
    ];
  }, [filteredProducts]);

  const rows = useMemo(
    () =>
      visibleProducts.map((product) => ({
        id: product.id,

        image: product.image ? (
          <img
            src={resolveAssetUrl(product.image)}
            alt={product.name}
            className="w-11 h-11 rounded-lg object-cover border border-border bg-surface-2"
            loading="lazy"
          />
        ) : (
          <div className="w-11 h-11 rounded-lg border border-dashed border-border bg-surface-2 flex items-center justify-center text-ink-3">
            <ImagePlus size={16} />
          </div>
        ),

        product: (
          <div className="flex justify-center">
            <CellItem
              icon={
                <Swatch color={product.color || '#6B7280'} />
              }
              name={product.name}
              sub={product.color || ''}
              mono
            />
          </div>
        ),

        category: product.categoryName,
        hsn: product.hsn ?? '',
        color: product.color ?? '',
        brand: product.brand,

        // FIX: Display the saved volume together with its unit.
        // Examples: "67 M", "20 Kg", "10 L".
        unit: displayProductVolume(product.unit),

        cost: `₹${product.purchasePrice.toLocaleString('en-IN')}`,
        price: `₹${product.sellingPrice.toLocaleString('en-IN')}`,

        stock: (
          <span
            className={`font-bold ${
              product.stock <= product.minStock
                ? 'text-danger'
                : 'text-ink'
            }`}
          >
            {product.stock}
          </span>
        ),

        status: (
          <Badge
            tone={STATUS_TONE[product.status] ?? 'neutral'}
          >
            {product.status}
          </Badge>
        ),

        actions: (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              icon={Eye}
              onClick={() => setPurchaseHistoryProduct(product)}
            >
              Purchases
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={Pencil}
              onClick={() => openEdit(product)}
            >
              Edit
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={Download}
              title="Download product PDF"
              aria-label={`Download ${product.name} as PDF`}
              onClick={() => handleExportProduct(product)}
            />

            <Button
              variant="dangerGhost"
              size="sm"
              icon={Trash2}
              onClick={() => setDeleteTarget(product)}
            />
          </div>
        ),
      })),
    [visibleProducts]
  );

  return (
    <div>
      <KpiRow items={kpis} />

      <Toolbar
        left={
          <>
            <Select
              placeholder="All Categories"
              allowClear
              size="small"
              style={{ width: 180 }}
              value={catFilter || undefined}
              onChange={(value) => {
                setCatFilter(value ?? '');
                setCurrentPage(1);
              }}
              options={categories.map((category) => ({
                label: category.name,
                value: category.id,
              }))}
            />

            <Select
              placeholder="All Status"
              allowClear
              size="small"
              style={{ width: 140 }}
              value={statusFilter || undefined}
              onChange={(value) => {
                setStatusFilter(value ?? '');
                setCurrentPage(1);
              }}
              options={['In Stock', 'Out of Stock'].map((status) => ({
                label: status,
                value: status,
              }))}
            />

            <DatePicker.RangePicker
              value={dateRange}
              onChange={(range) => {
                setDateRange(range);
                setCurrentPage(1);
              }}
              format="DD/MM/YYYY"
              placeholder={['From date', 'To date']}
              allowClear
            />

            <SearchBox
              placeholder="Search name, color, brand…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
            />
          </>
        }
        right={
          <>
            <Button
              variant="ghost"
              size="sm"
              icon={Download}
              onClick={handleExport}
            >
              Export PDF
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={openAdd}
            >
              Add Product
            </Button>
          </>
        }
      />

      {filteredProducts.length === 0 && !loading ? (
        <div className="text-sm text-ink-3 py-12 text-center">
          No products match the selected filters.
        </div>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          title="Product Catalog"
          subtitle={`${filteredProducts.length} product${
            filteredProducts.length !== 1 ? 's' : ''
          } · ${
            toggle === 'paints' ? 'Paints' : 'Interiors'
          } business`}
        />
      )}

      {filteredProducts.length > 0 && (
        <div className="flex justify-end py-4">
          <Pagination
            current={currentPage}
            pageSize={10}
            total={filteredProducts.length}
            showSizeChanger={false}
            onChange={(page) =>
              setCurrentPage(Math.min(page, pageCount))
            }
          />
        </div>
      )}

      {/* Purchase History */}
      <AppModal
        open={!!purchaseHistoryProduct}
        title={`Purchase History — ${
          purchaseHistoryProduct?.name ?? ''
        }`}
        subtitle="All purchases recorded for this product"
        onClose={() => setPurchaseHistoryProduct(null)}
        onConfirm={() => setPurchaseHistoryProduct(null)}
        confirmText="Close"
        width={760}
      >
        {purchaseHistoryProduct?.purchaseHistory?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-surface-2">
                  {[
                    'Invoice Number',
                    'Date',
                    'Supplier',
                    'Qty',
                    'Amount',
                    'Payment',
                    'Status',
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="text-left text-xs font-bold text-ink-3 px-3 py-2 border-b border-border"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {purchaseHistoryProduct.purchaseHistory.map(
                  (purchase, index) => (
                    <tr
                      key={`${purchase.invoiceNo}-${index}`}
                      className="border-b border-border"
                    >
                      <td className="px-3 py-2 font-mono">
                        {purchase.invoiceNo}
                      </td>

                      <td className="px-3 py-2">
                        {formatUtcDateTime(purchase.purchaseDate)}
                      </td>

                      <td className="px-3 py-2">
                        {[
                          purchase.supplierName,
                          purchase.supplierContactName,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </td>

                      <td className="px-3 py-2">
                        {purchase.quantity}
                      </td>

                      <td className="px-3 py-2">
                        ₹{purchase.amount.toLocaleString('en-IN')}
                      </td>

                      <td className="px-3 py-2">
                        {purchase.paymentMode}
                      </td>

                      <td className="px-3 py-2">
                        {purchase.status}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-ink-3">
            No purchases recorded for this product.
          </p>
        )}
      </AppModal>

      {/* Add / Edit Product */}
      <AppModal
        open={modalOpen}
        title={editing ? 'Edit Product' : 'Add New Product'}
        subtitle={
          editing
            ? `Editing: ${editing.name}`
            : 'Fill in the details to add a new product'
        }
        onClose={closeModal}
        onConfirm={handleSubmit}
        confirmText={editing ? 'Save Changes' : 'Create Product'}
        loading={saving}
        width={680}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              name="name"
              label="Product Name"
              rules={[{ required: true, message: 'Required' }]}
              className="col-span-2"
            >
              <Input placeholder="e.g. Asian Paints Royale Luxury Emulsion" />
            </Form.Item>

            <Form.Item
              name="categoryId"
              label="Category"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                placeholder="Select category"
                options={categories.map((category) => ({
                  label: category.name,
                  value: category.id,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="brand"
              label="Brand"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="e.g. Asian Paints" />
            </Form.Item>

            <Form.Item name="color" label="Color">
              <Input placeholder="e.g. White, Royal Blue" />
            </Form.Item>

            <Form.Item name="hsn" label="HSN Code">
              <Input placeholder="e.g. 3209" />
            </Form.Item>

            <Form.Item
              name="purchasePrice"
              label="Purchase Price (₹)"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="0"
              />
            </Form.Item>

            <Form.Item
              name="sellingPrice"
              label="Selling Price (₹)"
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="0"
              />
            </Form.Item>

            <Form.Item name="gstRate" label="GST Rate (%)">
              <Select
                options={GST_RATES.map((rate) => ({
                  label: `${rate}%`,
                  value: rate,
                }))}
              />
            </Form.Item>

            <Form.Item label="Volume" required>
              <div className="grid grid-cols-[1fr_120px] gap-2">
                <Form.Item
                  name="volumeAmount"
                  noStyle
                  rules={[
                    {
                      required: true,
                      message: 'Enter the volume amount',
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    className="w-full"
                    placeholder="Enter amount (e.g. 67)"
                  />
                </Form.Item>

                <Form.Item
                  name="volumeUnit"
                  noStyle
                  rules={[
                    {
                      required: true,
                      message: 'Select a volume unit',
                    },
                  ]}
                >
                  <Select
                    placeholder="Unit"
                    options={VOLUME_UNITS.map((unit) => ({
                      label: unit,
                      value: unit,
                    }))}
                  />
                </Form.Item>
              </div>
            </Form.Item>

            {!editing && (
              <Form.Item name="stock" label="Stock">
                <InputNumber
                  min={0}
                  precision={0}
                  step={1}
                  style={{ width: '100%' }}
                  placeholder="0"
                />
              </Form.Item>
            )}

            <Form.Item name="minStock" label="Min Stock Alert">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="0"
              />
            </Form.Item>

            <Form.Item
              name="business"
              label="Business"
              rules={[{ required: true }]}
            >
              <Select
                disabled={!!editing}
                options={[
                  { label: 'Paints', value: 'PAINTS' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Product Image"
              className="col-span-2"
            >
              <div className="flex items-center gap-4 rounded-xl border border-border bg-surface-2 p-3">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-20 h-20 rounded-lg object-cover border border-border bg-white"
                  />
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

                  <div className="text-[11px] text-ink-3 mt-1.5">
                    JPG, PNG or WEBP · maximum 5 MB · stored on the backend server
                  </div>

                  {imagePreview && (
                    <Button
                      type="button"
                      variant="dangerGhost"
                      size="sm"
                      icon={X}
                      className="mt-2"
                      onClick={handleRemoveImage}
                    >
                      Remove Image
                    </Button>
                  )}
                </div>
              </div>
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              className="col-span-2"
            >
              <Input.TextArea
                rows={2}
                placeholder="Short product description…"
              />
            </Form.Item>
          </div>
        </Form>
      </AppModal>

      {/* Delete Confirmation */}
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
