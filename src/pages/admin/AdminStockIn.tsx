import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Tag, message } from 'antd';
import { inventoryService, supplierService, productService } from '../../services/api';
import { StockInRecord, Supplier, Product } from '../../types';
import { Plus, ArrowDownLeft, Receipt, CheckCircle } from 'lucide-react';

export const AdminStockIn: React.FC = () => {
  const [records, setRecords] = useState<StockInRecord[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const [stkData, supData, prodData] = await Promise.all([
      inventoryService.getStockIn(),
      supplierService.getSuppliers(),
      productService.getProducts()
    ]);
    setRecords(stkData);
    setSuppliers(supData);
    setProducts(prodData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (values: any) => {
    const selectedProd = products.find((p) => p.id === values.productId);
    const selectedSup = suppliers.find((s) => s.id === values.supplierId);

    if (!selectedProd || !selectedSup) return;

    const qty = values.quantity;
    const price = values.purchasePrice || selectedProd.purchasePrice;
    const subtotal = qty * price;
    const totalGst = (subtotal * selectedProd.gstRate) / 100;
    const grandTotal = subtotal + totalGst;

    const newRecord: Omit<StockInRecord, 'id' | 'createdAt'> = {
      invoiceNo: values.invoiceNo || `AP-PUR-${Date.now().toString().slice(-4)}`,
      supplierId: selectedSup.id,
      supplierName: selectedSup.name,
      purchaseDate: values.purchaseDate || new Date().toISOString().split('T')[0],
      items: [
        {
          productId: selectedProd.id,
          productName: selectedProd.name,
          quantity: qty,
          purchasePrice: price,
          gstRate: selectedProd.gstRate,
          total: grandTotal
        }
      ],
      subtotal,
      totalGst,
      grandTotal,
      paymentMode: values.paymentMode || 'Bank Transfer',
      notes: values.notes
    };

    await inventoryService.createStockIn(newRecord);
    message.success('Stock In recorded & inventory quantity automatically increased!');
    setModalOpen(false);
    loadData();
  };

  const columns = [
    { title: 'Purchase Invoice', dataIndex: 'invoiceNo', key: 'invoiceNo', render: (inv: string) => <span className="font-bold text-xs text-blue-600">{inv}</span> },
    { title: 'Supplier Name', dataIndex: 'supplierName', key: 'supplierName', render: (name: string) => <span className="text-xs font-semibold">{name}</span> },
    { title: 'Purchase Date', dataIndex: 'purchaseDate', key: 'purchaseDate', render: (d: string) => <span className="text-xs">{d}</span> },
    {
      title: 'Items Stocked',
      dataIndex: 'items',
      key: 'items',
      render: (items: any[]) => (
        <div className="space-y-1">
          {items.map((it, idx) => (
            <div key={idx} className="text-xs">
              <strong>{it.productName}</strong> × {it.quantity} units
            </div>
          ))}
        </div>
      )
    },
    { title: 'Subtotal', dataIndex: 'subtotal', key: 'subtotal', render: (val: number) => <span className="text-xs">₹{val}</span> },
    { title: 'GST Total', dataIndex: 'totalGst', key: 'totalGst', render: (val: number) => <span className="text-xs text-slate-500">₹{val}</span> },
    { title: 'Grand Total', dataIndex: 'grandTotal', key: 'grandTotal', render: (val: number) => <span className="font-black text-xs text-slate-900">₹{val.toLocaleString('en-IN')}</span> },
    { title: 'Payment', dataIndex: 'paymentMode', key: 'paymentMode', render: (mode: string) => <Tag color="blue">{mode}</Tag> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Stock In (Purchase Entries)</h2>
          <p className="text-xs text-slate-500">Record incoming stock shipments & auto-update Kovilpatti inventory levels</p>
        </div>
        <Button type="primary" icon={<Plus className="w-4 h-4 mr-1" />} onClick={() => setModalOpen(true)} className="bg-blue-600 font-bold h-10">
          New Purchase Entry
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <Table dataSource={records} columns={columns} rowKey="id" loading={loading} />
      </div>

      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} title="New Stock Purchase Entry" footer={null} centered width={600}>
        <Form form={form} layout="vertical" onFinish={handleCreate} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="invoiceNo" label="Supplier Invoice No" rules={[{ required: true }]}>
              <Input placeholder="AP-PUR-2026-09" />
            </Form.Item>
            <Form.Item name="supplierId" label="Select Supplier" rules={[{ required: true }]}>
              <Select options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="productId" label="Select Product to Stock In" rules={[{ required: true }]}>
              <Select
                options={products.map((p) => ({ value: p.id, label: `${p.name} (Current: ${p.stock})` }))}
                onChange={(val) => {
                  const prod = products.find((p) => p.id === val);
                  if (prod) form.setFieldsValue({ purchasePrice: prod.purchasePrice });
                }}
              />
            </Form.Item>
            <Form.Item name="quantity" label="Quantity Received" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={1} defaultValue={10} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="purchasePrice" label="Unit Purchase Price (₹)" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true }]}>
              <Select options={[{ value: 'Bank Transfer' }, { value: 'UPI' }, { value: 'Cheque' }, { value: 'Cash' }]} />
            </Form.Item>
          </div>

          <Form.Item name="notes" label="Remarks / Transport Details">
            <Input placeholder="Direct vehicle arrival from Madurai Depot" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block className="bg-blue-600 mt-2">
            Submit Stock Entry & Increase Inventory
          </Button>
        </Form>
      </Modal>
    </div>
  );
};
