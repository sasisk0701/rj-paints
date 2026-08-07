import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Tag } from 'antd';
import { supplierService } from '../../services/api';
import { Supplier } from '../../types';
import { Plus, Users, Phone, MapPin, Building, Trash2 } from 'lucide-react';

export const AdminSuppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadSuppliers = async () => {
    setLoading(true);
    const data = await supplierService.getSuppliers();
    setSuppliers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleAdd = async (values: any) => {
    await supplierService.addSupplier(values);
    message.success('Supplier record added');
    setModalOpen(false);
    loadSuppliers();
  };

  const handleDelete = async (id: string) => {
    await supplierService.deleteSupplier(id);
    message.success('Supplier removed');
    loadSuppliers();
  };

  const columns = [
    { title: 'Supplier Name', dataIndex: 'name', key: 'name', render: (name: string) => <span className="font-bold text-slate-900 text-xs">{name}</span> },
    { title: 'GSTIN Number', dataIndex: 'gstNumber', key: 'gstNumber', render: (gst: string) => <Tag color="purple">{gst}</Tag> },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (p: string) => <span className="text-xs">{p}</span> },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (e: string) => <span className="text-xs text-blue-600">{e}</span> },
    { title: 'Location', dataIndex: 'city', key: 'city', render: (city: string) => <span className="text-xs font-semibold">{city}</span> },
    {
      title: 'Outstanding Balance',
      dataIndex: 'outstandingBalance',
      key: 'outstandingBalance',
      render: (bal: number) => (
        <span className={`font-bold text-xs ${bal > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
          ₹{bal.toLocaleString('en-IN')}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Supplier) => (
        <button onClick={() => handleDelete(record.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Supplier Directory & GST Ledger</h2>
          <p className="text-xs text-slate-500">Asian Paints Regional Depot, Berger, Birla White wholesale suppliers</p>
        </div>
        <Button type="primary" icon={<Plus className="w-4 h-4 mr-1" />} onClick={() => setModalOpen(true)} className="bg-blue-600 font-bold h-10">
          Add New Supplier
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <Table dataSource={suppliers} columns={columns} rowKey="id" loading={loading} />
      </div>

      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} title="Add Supplier Record" footer={null} centered>
        <Form form={form} layout="vertical" onFinish={handleAdd} className="mt-4 space-y-3">
          <Form.Item name="name" label="Supplier Company Name" rules={[{ required: true }]}>
            <Input placeholder="Asian Paints Regional Depot - Madurai" />
          </Form.Item>
          <Form.Item name="gstNumber" label="GSTIN Number" rules={[{ required: true }]}>
            <Input placeholder="33AAACA0001A1Z0" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="phone" label="Contact Phone" rules={[{ required: true }]}>
              <Input placeholder="0452-2456789" />
            </Form.Item>
            <Form.Item name="email" label="Email Address">
              <Input placeholder="depot@asianpaints.com" />
            </Form.Item>
          </div>
          <Form.Item name="address" label="Office Address">
            <Input placeholder="SIDCO Industrial Estate" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="city" label="City Location" rules={[{ required: true }]}>
              <Input placeholder="Madurai" />
            </Form.Item>
            <Form.Item name="outstandingBalance" label="Opening Balance (₹)">
              <InputNumber className="w-full" defaultValue={0} />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit" block className="bg-blue-600 mt-2">Save Supplier</Button>
        </Form>
      </Modal>
    </div>
  );
};
