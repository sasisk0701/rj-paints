import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Tag, message } from 'antd';
import { inventoryService, productService } from '../../services/api';
import { StockOutRecord, Product } from '../../types';
import { Plus, ArrowUpRight, Printer } from 'lucide-react';

export const AdminStockOut: React.FC = () => {
  const [records, setRecords] = useState<StockOutRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const [salesData, prodData] = await Promise.all([
      inventoryService.getStockOut(),
      productService.getProducts()
    ]);
    setRecords(salesData);
    setProducts(prodData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (values: any) => {
    const selectedProd = products.find((p) => p.id === values.productId);
    if (!selectedProd) return;

    if (selectedProd.stock < values.quantity) {
      message.error(`Insufficient stock! Only ${selectedProd.stock} units available.`);
      return;
    }

    const qty = values.quantity;
    const price = values.sellingPrice || selectedProd.sellingPrice;
    const discount = values.discount || 0;
    const itemSubtotal = qty * price - discount;
    const itemGst = (itemSubtotal * selectedProd.gstRate) / 100;
    const grandTotal = itemSubtotal + itemGst;

    const newRecord: Omit<StockOutRecord, 'id' | 'createdAt'> = {
      invoiceNo: values.invoiceNo || `RJ-INV-${Math.floor(100 + Math.random() * 900)}`,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      saleDate: values.saleDate || new Date().toISOString().split('T')[0],
      items: [
        {
          productId: selectedProd.id,
          productName: selectedProd.name,
          quantity: qty,
          sellingPrice: price,
          discount: discount,
          gstRate: selectedProd.gstRate,
          total: grandTotal
        }
      ],
      subtotal: qty * price,
      discountTotal: discount,
      totalGst: itemGst,
      grandTotal: grandTotal,
      paymentMode: values.paymentMode || 'Cash',
      notes: values.notes
    };

    await inventoryService.createStockOut(newRecord);
    message.success('Sales Invoice billed & stock automatically deducted!');
    setModalOpen(false);
    loadData();
  };

  const columns = [
    { title: 'Sales Invoice', dataIndex: 'invoiceNo', key: 'invoiceNo', render: (inv: string) => <span className="font-bold text-xs text-blue-600">{inv}</span> },
    { title: 'Customer Name', dataIndex: 'customerName', key: 'customerName', render: (name: string, r: StockOutRecord) => (
      <div>
        <div className="font-semibold text-xs">{name}</div>
        <div className="text-[10px] text-slate-400">📞 {r.customerPhone}</div>
      </div>
    ) },
    { title: 'Sale Date', dataIndex: 'saleDate', key: 'saleDate', render: (d: string) => <span className="text-xs">{d}</span> },
    {
      title: 'Items Sold',
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
    { title: 'Discount', dataIndex: 'discountTotal', key: 'discountTotal', render: (val: number) => <span className="text-xs text-emerald-600 font-bold">₹{val}</span> },
    { title: 'GST Total', dataIndex: 'totalGst', key: 'totalGst', render: (val: number) => <span className="text-xs text-slate-500">₹{val}</span> },
    { title: 'Grand Total', dataIndex: 'grandTotal', key: 'grandTotal', render: (val: number) => <span className="font-black text-xs text-slate-900">₹{val.toLocaleString('en-IN')}</span> },
    { title: 'Payment', dataIndex: 'paymentMode', key: 'paymentMode', render: (mode: string) => <Tag color="green">{mode}</Tag> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Stock Out (Sales Billing)</h2>
          <p className="text-xs text-slate-500">Bill customer paint sales & automatically reduce stock inventory</p>
        </div>
        <Button type="primary" icon={<Plus className="w-4 h-4 mr-1" />} onClick={() => setModalOpen(true)} className="bg-emerald-600 font-bold h-10 border-none">
          New Sales Invoice
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <Table dataSource={records} columns={columns} rowKey="id" loading={loading} />
      </div>

      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} title="New Sales Billing Invoice" footer={null} centered width={600}>
        <Form form={form} layout="vertical" onFinish={handleCreate} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="customerName" label="Customer Name" rules={[{ required: true }]}>
              <Input placeholder="K. Balakrishnan" />
            </Form.Item>
            <Form.Item name="customerPhone" label="Customer Phone" rules={[{ required: true }]}>
              <Input placeholder="9443187654" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="productId" label="Select Product Sold" rules={[{ required: true }]}>
              <Select
                options={products.map((p) => ({ value: p.id, label: `${p.name} (Stock: ${p.stock})` }))}
                onChange={(val) => {
                  const prod = products.find((p) => p.id === val);
                  if (prod) form.setFieldsValue({ sellingPrice: prod.sellingPrice });
                }}
              />
            </Form.Item>
            <Form.Item name="quantity" label="Quantity Sold" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={1} defaultValue={1} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="sellingPrice" label="Selling Price (₹)" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="discount" label="Discount (₹)">
              <InputNumber className="w-full" min={0} defaultValue={0} />
            </Form.Item>
            <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true }]}>
              <Select options={[{ value: 'UPI' }, { value: 'Cash' }, { value: 'Bank Transfer' }, { value: 'Cheque' }]} />
            </Form.Item>
          </div>

          <Form.Item name="notes" label="Invoice Remarks">
            <Input placeholder="Supply for Kovilpatti site" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block className="bg-emerald-600 border-none font-bold mt-2">
            Create Bill & Deduct Inventory Stock
          </Button>
        </Form>
      </Modal>
    </div>
  );
};
