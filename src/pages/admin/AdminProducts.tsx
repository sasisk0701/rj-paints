import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Modal, Form, InputNumber, message, Popconfirm } from 'antd';
import { productService } from '../../services/api';
import { Product } from '../../types';
import { Plus, Search, Edit3, Trash2, Package, Tag as TagIcon, ShieldAlert } from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();

  const loadProducts = async () => {
    setLoading(true);
    const data = await productService.getProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];
  const brands = ['All', ...Array.from(new Set(products.map((p) => p.brand)))];

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchBrand = selectedBrand === 'All' || p.brand === selectedBrand;
    return matchSearch && matchCat && matchBrand;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({
      sku: `AP-PROD-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      gstRate: 18,
      stock: 20,
      minStock: 5,
      business: 'paints',
      unit: '20 Liters',
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    form.setFieldsValue(prod);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await productService.deleteProduct(id);
    message.success('Product deleted successfully');
    loadProducts();
  };

  const handleSave = async (values: any) => {
    if (editingProduct) {
      await productService.updateProduct(editingProduct.id, values);
      message.success('Product updated successfully');
    } else {
      await productService.addProduct(values);
      message.success('New product added to inventory');
    }
    setModalOpen(false);
    loadProducts();
  };

  const columns = [
    {
      title: 'Product Details',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Product) => (
        <div className="flex items-center space-x-3">
          <img src={record.image} alt={name} className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
          <div>
            <div className="font-bold text-slate-900 text-xs">{name}</div>
            <div className="text-[10px] text-slate-500 font-mono">SKU: {record.sku} | Barcode: {record.barcode}</div>
          </div>
        </div>
      )
    },
    { title: 'Brand', dataIndex: 'brand', key: 'brand', render: (brand: string) => <Tag color="blue">{brand}</Tag> },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (cat: string) => <span className="text-xs font-semibold">{cat}</span> },
    { title: 'Purchase Price', dataIndex: 'purchasePrice', key: 'purchasePrice', render: (val: number) => <span className="text-xs">₹{val}</span> },
    { title: 'Selling Price', dataIndex: 'sellingPrice', key: 'sellingPrice', render: (val: number) => <span className="text-xs font-bold text-slate-900">₹{val}</span> },
    { title: 'GST', dataIndex: 'gstRate', key: 'gstRate', render: (gst: number) => <span className="text-xs">{gst}%</span> },
    {
      title: 'Stock Level',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number, record: Product) => (
        <div>
          <span className={`font-black text-xs ${stock <= record.minStock ? 'text-red-600' : 'text-slate-900'}`}>
            {stock} {record.unit}
          </span>
          <span className="text-[10px] text-slate-400 block">Min: {record.minStock}</span>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'In Stock' ? 'green' : status === 'Low Stock' ? 'orange' : 'red'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Product) => (
        <div className="flex items-center space-x-2">
          <button onClick={() => handleOpenEdit(record)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
            <Edit3 className="w-4 h-4" />
          </button>
          <Popconfirm title="Delete product?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
            <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </button>
          </Popconfirm>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Products & Stock Inventory</h2>
          <p className="text-xs text-slate-500">Manage Asian Paints, Berger, Nippon & Hardware SKU items</p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4 mr-1" />}
          onClick={handleOpenAdd}
          className="bg-blue-600 font-bold h-10 rounded-xl"
        >
          Add New Product
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          prefix={<Search className="w-4 h-4 text-slate-400 mr-2" />}
          placeholder="Search Product Name or SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
        />
        <Select
          value={selectedCategory}
          onChange={setSelectedCategory}
          options={categories.map((c) => ({ value: c, label: c === 'All' ? 'All Categories' : c }))}
        />
        <Select
          value={selectedBrand}
          onChange={setSelectedBrand}
          options={brands.map((b) => ({ value: b, label: b === 'All' ? 'All Brands' : b }))}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={<span className="font-bold text-lg">{editingProduct ? 'Edit Product SKU' : 'Add New Inventory Product'}</span>}
        footer={null}
        width={700}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
              <Input placeholder="Asian Paints Royale Silk 20L" />
            </Form.Item>
            <Form.Item name="category" label="Category" rules={[{ required: true }]}>
              <Input placeholder="Interior Paint" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="brand" label="Brand" rules={[{ required: true }]}>
              <Input placeholder="Asian Paints" />
            </Form.Item>
            <Form.Item name="sku" label="SKU Code" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="barcode" label="Barcode" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="purchasePrice" label="Purchase Price (₹)" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="sellingPrice" label="Selling Price (₹)" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="gstRate" label="GST Slab (%)" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} max={28} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="stock" label="Current Stock" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="minStock" label="Minimum Stock Alert Level" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="unit" label="Unit Pack" rules={[{ required: true }]}>
              <Input placeholder="20 Liters" />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Product Description">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="image" label="Image URL">
            <Input />
          </Form.Item>

          <div className="pt-2 flex justify-end space-x-3">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" className="bg-blue-600">Save Product</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
