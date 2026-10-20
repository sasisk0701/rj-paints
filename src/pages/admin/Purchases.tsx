import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Download, Eye } from 'lucide-react';
import { AutoComplete, DatePicker, Form, Input, InputNumber, Pagination, Select, Switch, message } from 'antd';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
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
import { formatUtcDateTime } from '@/utils/dateFormat';
import { exportPurchasesToPdf } from '@/utils/transactionPdfExport';

const COLUMNS: TableColumn[] = [
  { key: 'poNumber', label: 'PO #' },
  { key: 'invoice',  label: 'Invoice #' },
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
const VOLUME_UNITS = [
  { label: 'kg', value: 'kg' },
  { label: 'L', value: 'L' },
  { label: 'M', value: 'M' },
];

type VolumeUnit = 'kg' | 'L' | 'M';

function normalizeVolumeUnit(value?: string): VolumeUnit | undefined {
  const unit = value?.trim().toLowerCase();
  if (unit === 'kg' || unit?.startsWith('kilogram')) return 'kg';
  if (unit === 'l' || unit === 'lt' || unit?.startsWith('lit')) return 'L';
  if (unit === 'm' || unit?.startsWith('met')) return 'M';
  return undefined;
}

function parsePurchaseVolume(value?: string) {
  const match = value?.trim().match(/^(\d+(?:\.\d+)?)\s*(.*?)$/);
  if (!match) return { amount: undefined, unit: undefined, legacy: value ?? '' };
  return {
    amount: Number(match[1]),
    unit: normalizeVolumeUnit(match[2]),
    legacy: normalizeVolumeUnit(match[2]) ? '' : value ?? '',
  };
}

// Stored volume is "per unit" (e.g. "2 kg"). Total = quantity x volume.
function formatPurchaseTotalVolume(value: string, quantity: number) {
  const volume = parsePurchaseVolume(value);
  if (volume.amount === undefined || !Number.isFinite(quantity)) return volume.legacy || '—';
  const total = volume.amount * quantity;
  return `${Number(total.toFixed(3)).toLocaleString('en-IN')}${volume.unit ? ` ${volume.unit}` : ''}`;
}

const STATUS_TONE: Record<string, Tone> = {
  Paid: 'success', Pending: 'warn', Partial: 'neutral', Overdue: 'danger', Cancelled: 'danger',
};

function PurchaseVolumeField({ fieldIndex, form }: { fieldIndex: number; form: FormInstance }) {
  const volumeUnit = Form.useWatch(['items', fieldIndex, 'volumeUnit'], form) as VolumeUnit | undefined;

  return (
    <Form.Item label="Volume" className="col-span-6 md:col-span-3">
      <Form.Item name={[fieldIndex, 'volume']} noStyle>
        <Input
          inputMode="decimal"
          aria-label="Volume amount"
          placeholder="Enter volume"
          addonAfter={
            <Select
              aria-label="Volume unit"
              value={volumeUnit ?? 'kg'}
              onChange={(unit: VolumeUnit) => form.setFieldValue(['items', fieldIndex, 'volumeUnit'], unit)}
              options={VOLUME_UNITS}
              style={{ width: 72 }}
            />
          }
        />
      </Form.Item>
    </Form.Item>
  );
}


function PurchaseTotalVolume({
  fieldIndex,
  form,
}: {
  fieldIndex: number;
  form: FormInstance;
}) {
  const quantity = Form.useWatch(
    ['items', fieldIndex, 'quantity'],
    form,
  );

  const volume = Form.useWatch(
    ['items', fieldIndex, 'volume'],
    form,
  );

  const volumeUnit = Form.useWatch(
    ['items', fieldIndex, 'volumeUnit'],
    form,
  );

  const hasValidValues =
    quantity !== undefined &&
    quantity !== null &&
    quantity !== '' &&
    volume !== undefined &&
    volume !== null &&
    String(volume).trim() !== '' &&
    Number.isFinite(Number(quantity)) &&
    Number.isFinite(Number(volume));

  const totalVolume = hasValidValues
    ? `${Number(
        (Number(quantity) * Number(volume)).toFixed(3),
      ).toLocaleString('en-IN')} ${volumeUnit || 'kg'}`
    : '';

  return (
    <Form.Item
      label="Total Volume"
      className="col-span-6 md:col-span-3"
    >
      <Input
        value={totalVolume}
        placeholder="Auto-calculated"
        readOnly
        aria-label="Total volume"
      />
    </Form.Item>
  );
}

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
  const [dateRange, setDateRange]       = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [currentPage, setCurrentPage]   = useState(1);
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
    form.setFieldValue(['items', index, 'volume'], undefined);
    form.setFieldValue(['items', index, 'volumeUnit'], normalizeVolumeUnit(product.unit) ?? 'kg');
    form.setFieldValue(['items', index, 'legacyVolume'], '');
    form.setFieldValue(['items', index, 'newProduct'], {
      name: product.name,
      categoryId: product.categoryId || '',
      categoryName: product.categoryName || '',
      brand: product.brand || '',
      color: product.color || '',
      sellingPrice: product.sellingPrice ?? 0,
      unit: product.unit || '',
      minStock: product.minStock ?? 0,
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
      poNumber: `PO-${Date.now().toString().slice(-8)}`,
      invoiceNo: '',
      supplier: '',
      supplierName: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Bank Transfer',
      status: 'Pending',
      received: true,
      business: toggle.toUpperCase(),
      items: [{
        productId: '', productName: '', quantity: 1, packs: 0, volume: undefined, volumeUnit: 'kg', legacyVolume: '', purchasePrice: 0, hsn: '',
        newProduct: { sellingPrice: 0, minStock: 0 },
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
      invoiceNo: p.invoiceNo,
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
        const storedVolume = parsePurchaseVolume(i.volume);
        return {
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          packs: i.packs ?? 0,
          volume: storedVolume.amount,
          volumeUnit: storedVolume.unit ?? normalizeVolumeUnit(product?.unit) ?? 'kg',
          legacyVolume: storedVolume.legacy,
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
        productId: '', quantity: 1, packs: 0, volume: undefined, volumeUnit: 'kg', legacyVolume: '', purchasePrice: 0, hsn: '',
        newProduct: { sellingPrice: 0, minStock: 0 },
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
        poNumber: String(values.poNumber ?? '').trim(),
        invoiceNo: String(values.invoiceNo ?? '').trim(),
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
          const enteredProductVolume = item.volume !== undefined &&
            item.volume !== null &&
            item.volume !== ''
            ? `${Number(item.volume)} ${item.volumeUnit || 'kg'}`
            : '';
          return {
            productId: item.productId === NEW_PRODUCT_VALUE ? undefined : item.productId,
            productName: prod?.name ?? item.newProduct?.name ?? '',
            quantity: Number(item.quantity),
            packs: Number(item.packs ?? 0),
            volume: item.volume !== undefined && item.volume !== null && item.volume !== ''
              ? `${Number(item.volume)} ${item.volumeUnit || 'kg'}`
              : item.legacyVolume || '',
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
                unit: item.productId === NEW_PRODUCT_VALUE && enteredProductVolume
                  ? enteredProductVolume
                  : item.newProduct.unit || prod?.unit || 'Piece',
                minStock: Number(item.newProduct.minStock ?? prod?.minStock ?? 0),
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

  const filteredPurchases = useMemo(() => purchases.filter((purchase) => {
    if (!dateRange?.[0] || !dateRange[1]) return true;
    const purchaseDate = new Date(purchase.purchaseDate);
    return !Number.isNaN(purchaseDate.getTime())
      && purchaseDate >= dateRange[0].startOf('day').toDate()
      && purchaseDate <= dateRange[1].endOf('day').toDate();
  }), [purchases, dateRange]);

  const pageCount = Math.max(1, Math.ceil(filteredPurchases.length / 10));
  const visiblePurchases = filteredPurchases.slice((currentPage - 1) * 10, currentPage * 10);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  const handleExport = () => {
    if (!filteredPurchases.length) {
      message.warning('No purchases match the selected filters');
      return;
    }
    try {
      setExporting(true);
      exportPurchasesToPdf(filteredPurchases, suppliers, products, toggle);
      message.success(`${filteredPurchases.length} purchase${filteredPurchases.length !== 1 ? 's' : ''} exported to PDF`);
    } catch (error) {
      console.error('Failed to export purchases:', error);
      message.error('Failed to export purchase PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPurchase = useCallback((purchase: ApiPurchase) => {
    try {
      exportPurchasesToPdf([purchase], suppliers, products, toggle, `purchase-${purchase.poNumber}`);
    } catch (error) {
      console.error(`Failed to export purchase ${purchase.poNumber}:`, error);
      message.error(`Failed to export ${purchase.poNumber} PDF`);
    }
  }, [suppliers, products, toggle]);

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
    visiblePurchases.map((p) => ({
      id: p.id,
      poNumber: <span className="font-mono">{p.poNumber}</span>,
      invoice:  <span className="font-mono">{p.invoiceNo}</span>,
      date:     formatUtcDateTime(p.purchaseDate),
      supplier: [p.supplierName, p.supplierContactName].filter(Boolean).join(' · '),
      items:    `${p.items?.length ?? '—'} item(s)`,
      amount:   `₹${p.totalAmount.toLocaleString('en-IN')}`,
      status:   <Badge tone={STATUS_TONE[p.status] ?? 'neutral'}>{p.status}</Badge>,
      actions: (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" icon={Eye} onClick={() => { setViewing(p); setViewOpen(true); }} />
          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(p)}>Edit</Button>
          <Button variant="ghost" size="sm" icon={Download} title="Download purchase PDF" aria-label={`Download ${p.poNumber} as PDF`} onClick={() => handleExportPurchase(p)} />
          <Button variant="dangerGhost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(p)} />
        </div>
      ),
    })),
  [visiblePurchases, handleExportPurchase]);

  return (
    <div>
      <KpiRow items={kpis} />

      <Toolbar
        left={
          <>
            <Select
              placeholder="All Status" allowClear size="small" style={{ width: 140 }}
              value={statusFilter || undefined}
              onChange={(v) => { setStatusFilter(v ?? ''); setCurrentPage(1); }}
              options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))}
            />
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(range) => { setDateRange(range); setCurrentPage(1); }}
              format="DD/MM/YYYY"
              placeholder={['From date', 'To date']}
              allowClear
            />
            <SearchBox placeholder="Search PO, invoice, supplier…" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
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

      {filteredPurchases.length === 0 && !loading ? (
        <div className="text-sm text-ink-3 py-12 text-center">
          No purchases match the selected filters.
        </div>
      ) : (
        <DataTable
          columns={COLUMNS} rows={rows}
          title="Purchase Orders"
          subtitle={`${filteredPurchases.length} purchase${filteredPurchases.length !== 1 ? 's' : ''} · ${toggle === 'paints' ? 'Paints' : 'Interiors'} business`}
        />
      )}
      {filteredPurchases.length > 0 && (
        <div className="flex justify-end py-4">
          <Pagination
            current={currentPage}
            pageSize={10}
            total={filteredPurchases.length}
            showSizeChanger={false}
            onChange={(page) => setCurrentPage(Math.min(page, pageCount))}
          />
        </div>
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
            <Form.Item name="poNumber" label="PO Number" rules={[{ required: true, whitespace: true, message: 'Required' }]}>
              <Input readOnly placeholder="PO-17784963" />
            </Form.Item>
            <Form.Item name="invoiceNo" label="Invoice Number" rules={[{ required: true, whitespace: true, message: 'Required' }]}>
              <Input placeholder="INV-1001" />
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
                    productId: '', productName: '', quantity: 1, packs: 0, volume: undefined, volumeUnit: 'kg', legacyVolume: '', purchasePrice: 0, hsn: '',
                    newProduct: { sellingPrice: 0, minStock: 0 },
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
                          <Form.Item name={[field.name, 'newProduct', 'sellingPrice']} label="Selling Price (₹)" className="md:col-span-2">
                            <InputNumber min={0} className="w-full" placeholder="0" />
                          </Form.Item>
                          <Form.Item name={[field.name, 'purchasePrice']} label="Purchase Price (₹)" rules={[{ required: true }]} className="md:col-span-2">
                            <InputNumber min={0} className="w-full" />
                          </Form.Item>
                          <Form.Item name={[field.name, 'newProduct', 'minStock']} label="Min Stock Alert">
                            <InputNumber min={0} className="w-full" />
                          </Form.Item>
                          <Form.Item name={[field.name, 'newProduct', 'description']} label="Description">
                            <Input placeholder="Short product description" />
                          </Form.Item>
                    </div>
                    <Form.Item name={[field.name, 'quantity']} label="Qty" rules={[{ required: true }]} className="col-span-6 md:col-span-3">
                      <InputNumber min={1} className="w-full" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'packs']} label="Packs" className="col-span-6 md:col-span-3">
                      <InputNumber min={0} className="w-full" />
                    </Form.Item>
                    <PurchaseVolumeField fieldIndex={field.name} form={form} />
                    <PurchaseTotalVolume fieldIndex={field.name} form={form} />
                    <Form.Item name={[field.name, 'inBillDiscountValue']} label="In-Bill Disc" className="col-span-6 md:col-span-3">
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
                    <Form.Item name={[field.name, 'rebateDiscountValue']} label="Rebate Disc" className="col-span-6 md:col-span-3">
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
                    <Form.Item name={[field.name, 'cardDiscountValue']} label="Cash Disc" className="col-span-6 md:col-span-3">
                      <InputNumber
                        min={0}
                        className="w-full"
                        addonAfter={
                          <Form.Item name={[field.name, 'cardDiscountType']} noStyle>
                            <Select
                              aria-label="Cash discount unit"
                              options={[{ label: '₹', value: 'amount' }, { label: '%', value: 'percent' }]}
                              style={{ width: 62 }}
                            />
                          </Form.Item>
                        }
                      />
                    </Form.Item>
                    <Form.Item name={[field.name, 'gstRate']} label="GST %" className="col-span-3 md:col-span-2">
                      <InputNumber min={0} max={28} className="w-full" />
                    </Form.Item>
                    <div className="col-span-3 md:col-span-1 flex items-end justify-center pb-6">
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
        subtitle={`Invoice: ${viewing?.invoiceNo} · ${[viewing?.supplierName, viewing?.supplierContactName].filter(Boolean).join(' · ')} · ${viewing ? formatUtcDateTime(viewing.purchaseDate) : ''}`}
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-surface-2">
                      {['Product', 'HSN', 'Qty', 'Packs', 'Volume', 'Total Volume', 'Price', 'Cash Disc %', 'GST%', 'Amount'].map((h) => (
                        <th key={h} className="text-left text-xs font-bold text-ink-3 px-3 py-2 border-b border-border whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewing.items.map((item) => (
                      <tr key={item.id} className="border-b border-border">
                        <td className="px-3 py-2">{item.productName}</td>
                        <td className="px-3 py-2">{item.hsn || '—'}</td>
                        <td className="px-3 py-2">{item.quantity}</td>
                        <td className="px-3 py-2">{item.packs}</td>
                        <td className="px-3 py-2">{item.volume || '—'}</td>
                        <td className="px-3 py-2">{formatPurchaseTotalVolume(item.volume, item.quantity)}</td>
                        <td className="px-3 py-2">₹{item.purchasePrice.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2">{item.cashDiscountPercent ?? 0}%</td>
                        <td className="px-3 py-2">{item.gstRate}%</td>
                        <td className="px-3 py-2 font-semibold">₹{item.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
