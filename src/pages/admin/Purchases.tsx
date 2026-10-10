import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Download, Eye } from 'lucide-react';
import { AutoComplete, Form, Input, InputNumber, Select, Switch, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '@/hooks/useBusiness.ts';
import { purchaseService, supplierService, apiProductService, categoryService, type ApiPurchase, type ApiSupplier, type ApiProduct, type ApiCategory } from '@/services/api';
import { Toolbar, SearchBox } from '@/components/common/Toolbar.tsx';
import { Button } from '@/components/common/Button.tsx';
import { DataTable } from '@/components/common/DataTable';
import { KpiRow } from '@/components/common/KpiCard';
import { Badge } from '@/components/common/Badge';
import { AppModal } from '@/components/common/AppModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { KpiItem, TableColumn, Tone } from '@/types/types';
import { exportPurchasesToPdf } from '@/utils/transactionPdfExport';

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
const NEW_PRODUCT_VALUE = '__new_product__';
const EXPORT_DATE_RANGES = [
  { label: 'All', value: 'all' },
  { label: 'Last 10 days', value: 10 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 60 days', value: 60 },
  { label: 'Last 90 days', value: 90 },
 ] as const;

const STATUS_TONE: Record<string, Tone> = {
  Paid: 'success', Pending: 'warn', Partial: 'neutral', Overdue: 'danger', Cancelled: 'danger',
};

export default function Purchases() {
  const { toggle } = useBusiness();
  const navigate = useNavigate();
  const [purchases, setPurchases]       = useState<ApiPurchase[]>([]);
  const [suppliers, setSuppliers]       = useState<ApiSupplier[]>([]);
  const [products, setProducts]         = useState<ApiProduct[]>([]);
  const [categories, setCategories]     = useState<ApiCategory[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [exportDateRange, setExportDateRange] = useState<(typeof EXPORT_DATE_RANGES)[number]['value']>(10);
  const [modalOpen, setModalOpen]       = useState(false);
  const [viewOpen, setViewOpen]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiPurchase | null>(null);
  const [editing, setEditing]           = useState<ApiPurchase | null>(null);
  const [viewing, setViewing]           = useState<ApiPurchase | null>(null);
  const [saving, setSaving]             = useState(false);
  const [exporting, setExporting]       = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [form] = Form.useForm();

  const setPurchaseItemProduct = (index: number, product: ApiProduct) => {
    form.setFieldValue(['items', index, 'productId'], product.id);
    form.setFieldValue(['items', index, 'productName'], product.name);
    form.setFieldValue(['items', index, 'purchasePrice'], product.purchasePrice);
    form.setFieldValue(['items', index, 'gstRate'], product.gstRate);
    form.setFieldValue(['items', index, 'hsn'], product.hsn ?? '');
    form.setFieldValue(['items', index, 'volume'], product.unit ?? '');
    form.setFieldValue(['items', index, 'newProduct'], {
      name: product.name,
      categoryId: product.categoryId || '',
      categoryName: product.categoryName || '',
      brand: product.brand || '',
      color: product.color || '',
      sellingPrice: product.sellingPrice ?? 0,
      unit: product.unit || '',
      minStock: product.minStock ?? 0,
      openingStock: 0,
    });
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [purch, supps, prods, cats] = await Promise.all([
        purchaseService.getAll({ business: toggle, search: search || undefined, status: statusFilter || undefined }),
        supplierService.getAll({ business: toggle }),
        apiProductService.getAll({ business: toggle }),
        categoryService.getAll(toggle),
      ]);
      setPurchases(purch);
      setSuppliers(supps);
      setProducts(prods);
      setCategories(cats);
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
      supplier: '',
      supplierName: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Bank Transfer',
      status: 'Pending',
      received: true,
      business: toggle.toUpperCase(),
      items: [{
        productId: '', productName: '', quantity: 1, packs: 0, volume: '', purchasePrice: 0, hsn: '',
        newProduct: { sellingPrice: 0, openingStock: 0, minStock: 0 },
        inBillDiscountValue: 0, inBillDiscountType: 'amount',
        rebateDiscountValue: 0, rebateDiscountType: 'amount',
        cardDiscountValue: 0, cardDiscountType: 'amount',
        gstRate: 18,
      }],
    });
    setModalOpen(true);
  };

  const openEdit = (p: ApiPurchase) => {
    setEditing(p);
    form.setFieldsValue({
      poNumber: p.poNumber,
      supplierId: p.supplierId ?? undefined,
      supplier:       [p.supplierName, p.supplierContactName].filter(Boolean).join(' · '),
      supplierName: p.supplierContactName ?? '',
      purchaseDate: p.purchaseDate,
      paymentMode: p.paymentMode,
      status: p.status,
      received: p.received,
      notes: p.notes ?? '',
      business: p.business,
      items: p.items?.map((i) => {
        const product = products.find((entry) => entry.id === i.productId);
        return {
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          packs: i.packs ?? 0,
          volume: i.volume || product?.unit || '',
          purchasePrice: i.purchasePrice,
          hsn: i.hsn || product?.hsn || '',
          newProduct: {
            name: i.productName,
            categoryId: product?.categoryId || '',
            categoryName: product?.categoryName || '',
            brand: product?.brand || '',
            color: product?.color || '',
            sellingPrice: product?.sellingPrice ?? 0,
            unit: product?.unit || '',
            minStock: product?.minStock ?? 0,
            openingStock: 0,
          },
          inBillDiscountType: (i.inBillDiscountPercent ?? 0) > 0 ? 'percent' : 'amount',
          inBillDiscountValue: (i.inBillDiscountPercent ?? 0) > 0 ? i.inBillDiscountPercent : i.inBillDiscountAmount ?? 0,
          rebateDiscountType: (i.inBillDiscount2Percent ?? 0) > 0 ? 'percent' : 'amount',
          rebateDiscountValue: (i.inBillDiscount2Percent ?? 0) > 0 ? i.inBillDiscount2Percent : i.inBillDiscount2Amount ?? 0,
          cardDiscountType: (i.cashDiscountPercent ?? 0) > 0 ? 'percent' : 'amount',
          cardDiscountValue: (i.cashDiscountPercent ?? 0) > 0 ? i.cashDiscountPercent : i.cashDiscountAmount ?? 0,
          gstRate: i.gstRate,
        };
      }) ?? [{
        productId: '', quantity: 1, packs: 0, volume: '', purchasePrice: 0, hsn: '',
        newProduct: { sellingPrice: 0, openingStock: 0, minStock: 0 },
        inBillDiscountValue: 0, inBillDiscountType: 'amount',
        rebateDiscountValue: 0, rebateDiscountType: 'amount',
        cardDiscountValue: 0, cardDiscountType: 'amount',
        gstRate: 18,
      }],
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const addsNewProducts = values.items.some((item: any) => item.productId === NEW_PRODUCT_VALUE);
      const { supplier, ...purchaseValues } = values;
      const payload = {
        ...purchaseValues,
        supplierName: supplier,
        supplierContactName: values.supplierName || '',
        items: values.items.map((item: any) => {
          const prod = products.find((p) => p.id === item.productId);
          const category = categories.find((c) => c.id === item.newProduct?.categoryId);
          const inBillDiscountPercent = item.inBillDiscountType === 'percent' ? Number(item.inBillDiscountValue ?? 0) : 0;
          const inBillDiscountAmount = item.inBillDiscountType === 'amount' ? Number(item.inBillDiscountValue ?? 0) : 0;
          const inBillDiscount2Percent = item.rebateDiscountType === 'percent' ? Number(item.rebateDiscountValue ?? 0) : 0;
          const inBillDiscount2Amount = item.rebateDiscountType === 'amount' ? Number(item.rebateDiscountValue ?? 0) : 0;
          const cashDiscountPercent = item.cardDiscountType === 'percent' ? Number(item.cardDiscountValue ?? 0) : 0;
          const cashDiscountAmount = item.cardDiscountType === 'amount' ? Number(item.cardDiscountValue ?? 0) : 0;
          return {
            productId: item.productId === NEW_PRODUCT_VALUE ? undefined : item.productId,
            productName: prod?.name ?? item.newProduct?.name ?? '',
            quantity: Number(item.quantity),
            packs: Number(item.packs ?? 0),
            volume: item.volume || prod?.unit || item.newProduct?.unit || '',
            purchasePrice: Number(item.purchasePrice),
            inBillDiscountPercent,
            inBillDiscountAmount,
            inBillDiscount2Percent,
            inBillDiscount2Amount,
            cashDiscountPercent,
            cashDiscountAmount,
            gstRate: Number(item.gstRate ?? 18),
            hsn: item.hsn || item.newProduct?.hsn || prod?.hsn || '',
            amount: (() => {
              const value = Number(item.quantity) * Number(item.purchasePrice);
              const afterInBill = value - value * inBillDiscountPercent / 100 - inBillDiscountAmount;
              const afterRebate = afterInBill - afterInBill * inBillDiscount2Percent / 100 - inBillDiscount2Amount;
              const taxable = afterRebate - afterRebate * cashDiscountPercent / 100 - cashDiscountAmount;
              return taxable * (1 + Number(item.gstRate ?? 18) / 100);
            })(),
            ...(item.newProduct ? {
              newProduct: {
                ...item.newProduct,
                name: item.newProduct.name || item.productName,
                categoryName: category?.name ?? item.newProduct.categoryName ?? '',
                brand: item.newProduct.brand || prod?.brand || '',
                color: item.newProduct.color || prod?.color || '',
                sellingPrice: Number(item.newProduct.sellingPrice ?? prod?.sellingPrice ?? 0),
                unit: item.newProduct.unit || prod?.unit || item.volume || 'Piece',
                minStock: Number(item.newProduct.minStock ?? prod?.minStock ?? 0),
                openingStock: Number(item.newProduct.openingStock ?? 0),
              },
            } : {}),
          };
        }),
      };
      if (editing) {
        await purchaseService.update(editing.id, payload);
        message.success('Purchase updated');
      } else {
        await purchaseService.create(payload);
        await fetchAll();
        message.success(addsNewProducts
          ? 'Purchase created. New products have been added to the Product Catalog.'
          : 'Purchase created successfully');
      }
      setModalOpen(false);
      form.resetFields();
      if (editing) await fetchAll();
      else if (addsNewProducts) navigate('/admin/products');
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

  const handleExport = async () => {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    if (exportDateRange !== 'all') cutoff.setDate(cutoff.getDate() - (exportDateRange - 1));
    const exportPurchases = purchases
      .filter((purchase) => {
        if (exportDateRange === 'all') return true;
        const purchaseDate = new Date(`${purchase.purchaseDate.slice(0, 10)}T00:00:00`);
        return !Number.isNaN(purchaseDate.getTime()) && purchaseDate >= cutoff;
      })
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
    if (!exportPurchases.length) {
      message.warning(exportDateRange === 'all'
        ? 'No purchases to export'
        : `No purchases found in the last ${exportDateRange} days`);
      return;
    }
    try {
      setExporting(true);
      exportPurchasesToPdf(exportPurchases, suppliers, products, toggle);
      message.success(`${exportPurchases.length} purchase${exportPurchases.length !== 1 ? 's' : ''} exported to PDF`);
    } catch (error) {
      console.error('Failed to export purchases:', error);
      message.error('Failed to export purchase PDF');
    } finally {
      setExporting(false);
    }
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
      supplier: [p.supplierName, p.supplierContactName].filter(Boolean).join(' · '),
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
            <Select
              aria-label="Export date range"
              size="small"
              style={{ width: 150 }}
              value={exportDateRange}
              onChange={setExportDateRange}
              options={EXPORT_DATE_RANGES.map((range) => ({ label: range.label, value: range.value }))}
            />
            <SearchBox placeholder="Search PO, supplier…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </>
        }
        right={
          <>
            <Button variant="ghost" size="sm" icon={Download} onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting…' : 'Export PDF'}
            </Button>
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
            <Form.Item name="supplierId" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="supplier" label="Supplier" rules={[{ required: true, message: 'Required' }]}>
              <AutoComplete
                placeholder="Select a supplier or type a name"
                options={suppliers.map((supplier) => ({
                  value: supplier.name,
                  label: supplier.contactName ? `${supplier.name} - ${supplier.contactName}` : supplier.name,
                }))}
                filterOption={(input, option) =>
                  String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                onSelect={(name) => {
                  const supplier = suppliers.find((entry) => entry.name === name);
                  if (supplier) {
                    form.setFieldValue('supplierId', supplier.id);
                    form.setFieldValue('supplierName', supplier.contactName ?? '');
                  }
                }}
                onChange={(name) => {
                  const supplier = suppliers.find((entry) => entry.name === name);
                  form.setFieldValue('supplierId', supplier?.id);
                  form.setFieldValue('supplierName', supplier?.contactName ?? '');
                }}
              />
            </Form.Item>
            <Form.Item name="supplierName" label="Supplier Name">
              <AutoComplete
                placeholder="Select a contact or type a name"
                options={suppliers.flatMap((supplier) =>
                  supplier.contactName
                    ? [{ value: supplier.contactName, label: `${supplier.contactName} · ${supplier.name}` }]
                    : [],
                )}
                filterOption={(input, option) =>
                  String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                onSelect={(contactName) => {
                  const supplier = suppliers.find((entry) => entry.contactName === contactName);
                  if (supplier) {
                    form.setFieldValue('supplier', supplier.name);
                    form.setFieldValue('supplierId', supplier.id);
                  }
                }}
              />
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
            <Form.Item
              name="received"
              label="Stock Received"
              valuePropName="checked"
              extra="Received quantities will be added to product stock."
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
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
                  <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={() => add({
                    productId: '', productName: '', quantity: 1, packs: 0, volume: '', purchasePrice: 0, hsn: '',
                    newProduct: { sellingPrice: 0, openingStock: 0, minStock: 0 },
                    inBillDiscountValue: 0, inBillDiscountType: 'amount',
                    rebateDiscountValue: 0, rebateDiscountType: 'amount',
                    cardDiscountValue: 0, cardDiscountType: 'amount',
                    gstRate: 18,
                  })}>
                    Add Item
                  </Button>
                </div>
                {fields.map((field) => (
                  <div key={field.key} className="grid grid-cols-12 gap-3 items-end rounded-2xl border border-border bg-surface-2 p-4">
                    <Form.Item name={[field.name, 'productId']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'productName']} label="Product" rules={[{ required: true, message: 'Choose or enter a product' }]} className="col-span-12 md:col-span-9">
                      <AutoComplete
                        placeholder="Choose from list or type product name"
                        options={products.map((product) => ({
                          value: product.name,
                          label: product.sku ? `${product.name} · ${product.sku}` : product.name,
                        }))}
                        filterOption={(input, option) => String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
                        onChange={(name) => {
                          const product = products.find((entry) => entry.name === name);
                          if (product) {
                            setPurchaseItemProduct(field.name, product);
                          } else if (name.trim()) {
                            form.setFieldValue(['items', field.name, 'productId'], NEW_PRODUCT_VALUE);
                            const current = form.getFieldValue(['items', field.name, 'newProduct']) ?? {};
                            form.setFieldValue(['items', field.name, 'newProduct'], {
                              sellingPrice: 0,
                              openingStock: 0,
                              minStock: 0,
                              ...current,
                              name,
                            });
                          } else {
                            form.setFieldValue(['items', field.name, 'productId'], '');
                          }
                        }}
                        onSelect={(name) => {
                          const product = products.find((entry) => entry.name === name);
                          if (product) setPurchaseItemProduct(field.name, product);
                        }}
                      />
                    </Form.Item>
                    <Form.Item name={[field.name, 'hsn']} label="HSN Code" className="col-span-12 md:col-span-3">
                      <Input placeholder="HSN code" />
                    </Form.Item>
                    <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-x-4 rounded-xl border border-border bg-white p-3">
                          <Form.Item name={[field.name, 'newProduct', 'categoryId']} hidden>
                            <Input />
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'newProduct', 'categoryName']}
                            label="Category"
                          >
                            <AutoComplete
                              placeholder="Select category or type a new one"
                              options={categories.map((category) => ({ value: category.name }))}
                              filterOption={(input, option) => String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
                              onChange={(name) => {
                                const category = categories.find((entry) => entry.name === name);
                                form.setFieldValue(
                                  ['items', field.name, 'newProduct', 'categoryId'],
                                  category?.id ?? '',
                                );
                              }}
                              onSelect={(name) => {
                                const category = categories.find((entry) => entry.name === name);
                                form.setFieldValue(
                                  ['items', field.name, 'newProduct', 'categoryId'],
                                  category?.id ?? '',
                                );
                              }}
                            />
                          </Form.Item>
                          <Form.Item name={[field.name, 'newProduct', 'brand']} label="Brand" rules={[{ required: true, message: 'Required' }]}>
                            <Input placeholder="Brand" />
                          </Form.Item>
                          <Form.Item name={[field.name, 'newProduct', 'color']} label="Color">
                            <Input placeholder="Color or variant" />
                          </Form.Item>
                          <Form.Item name={[field.name, 'newProduct', 'sellingPrice']} label="Selling Price (₹)" rules={[{ required: true, message: 'Required' }]} className="md:col-span-2">
                            <InputNumber min={0} className="w-full" />
                          </Form.Item>
                          <Form.Item name={[field.name, 'purchasePrice']} label="Purchase Price (₹)" rules={[{ required: true }]} className="md:col-span-2">
                            <InputNumber min={0} className="w-full" />
                          </Form.Item>
                          <Form.Item name={[field.name, 'newProduct', 'minStock']} label="Min Stock Alert">
                            <InputNumber min={0} className="w-full" />
                          </Form.Item>
                          <Form.Item name={[field.name, 'newProduct', 'openingStock']} label="Opening Stock (optional)">
                            <InputNumber min={0} className="w-full" />
                          </Form.Item>
                          <Form.Item name={[field.name, 'newProduct', 'description']} label="Description (optional)">
                            <Input placeholder="Short product description" />
                          </Form.Item>
                    </div>
                    <Form.Item name={[field.name, 'quantity']} label="Qty" rules={[{ required: true }]} className="col-span-3 md:col-span-2">
                      <InputNumber min={1} className="w-full" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'packs']} label="Packs" className="col-span-3 md:col-span-2">
                      <InputNumber min={0} className="w-full" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'volume']} label="Volume (kg/lt/M)" className="col-span-6 md:col-span-3">
                      <Input placeholder="e.g. 20 lt, 5 kg, 1 M" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'inBillDiscountValue']} label="In-Bill Disc" className="col-span-6 md:col-span-2">
                      <InputNumber
                        min={0}
                        className="w-full"
                        addonAfter={
                          <Form.Item name={[field.name, 'inBillDiscountType']} noStyle>
                            <Select
                              aria-label="In-Bill discount unit"
                              options={[{ label: '₹', value: 'amount' }, { label: '%', value: 'percent' }]}
                              style={{ width: 62 }}
                            />
                          </Form.Item>
                        }
                      />
                    </Form.Item>
                    <Form.Item name={[field.name, 'rebateDiscountValue']} label="Rebate Disc" className="col-span-6 md:col-span-2">
                      <InputNumber
                        min={0}
                        className="w-full"
                        addonAfter={
                          <Form.Item name={[field.name, 'rebateDiscountType']} noStyle>
                            <Select
                              aria-label="Rebate discount unit"
                              options={[{ label: '₹', value: 'amount' }, { label: '%', value: 'percent' }]}
                              style={{ width: 62 }}
                            />
                          </Form.Item>
                        }
                      />
                    </Form.Item>
                    <Form.Item name={[field.name, 'cardDiscountValue']} label="Card Disc" className="col-span-6 md:col-span-2">
                      <InputNumber
                        min={0}
                        className="w-full"
                        addonAfter={
                          <Form.Item name={[field.name, 'cardDiscountType']} noStyle>
                            <Select
                              aria-label="Card discount unit"
                              options={[{ label: '₹', value: 'amount' }, { label: '%', value: 'percent' }]}
                              style={{ width: 62 }}
                            />
                          </Form.Item>
                        }
                      />
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
        subtitle={`${[viewing?.supplierName, viewing?.supplierContactName].filter(Boolean).join(' · ')} · ${viewing?.purchaseDate}`}
        onClose={() => setViewOpen(false)}
        onConfirm={() => setViewOpen(false)}
        confirmText="Close"
        width={680}
      >
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-ink-3 text-xs">Status</span><div><Badge tone={STATUS_TONE[viewing.status] ?? 'neutral'}>{viewing.status}</Badge></div></div>
              <div><span className="text-ink-3 text-xs">Stock Received</span><div className="font-medium">{viewing.received ? 'Yes' : 'No'}</div></div>
              <div><span className="text-ink-3 text-xs">Payment Mode</span><div className="font-medium">{viewing.paymentMode}</div></div>
              <div><span className="text-ink-3 text-xs">Total Amount</span><div className="font-bold text-lg">₹{viewing.totalAmount.toLocaleString('en-IN')}</div></div>
              <div><span className="text-ink-3 text-xs">GST Amount</span><div className="font-medium">₹{viewing.gstAmount.toLocaleString('en-IN')}</div></div>
            </div>
            {viewing.items && viewing.items.length > 0 && (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-surface-2">
                    {['Product', 'HSN', 'Qty', 'Price', 'Cash Disc %', 'GST%', 'Amount'].map((h) => (
                      <th key={h} className="text-left text-xs font-bold text-ink-3 px-3 py-2 border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {viewing.items.map((item) => (
                    <tr key={item.id} className="border-b border-border">
                      <td className="px-3 py-2">{item.productName}</td>
                      <td className="px-3 py-2">{item.hsn || '—'}</td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2">₹{item.purchasePrice.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2">{item.cashDiscountPercent ?? 0}%</td>
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
