import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Tag, message } from 'antd';
import { financeService } from '../../services/api';
import { LabourPayment } from '../../types';
import { Plus, HardHat, DollarSign } from 'lucide-react';

export const AdminLabour: React.FC = () => {
  const [labourList, setLabourList] = useState<LabourPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const data = await financeService.getLabour();
    setLabourList(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (values: any) => {
    await financeService.addLabour(values);
    message.success('Labour payment entry added');
    setModalOpen(false);
    loadData();
  };

  const columns = [
    { title: 'Worker / Contractor Name', dataIndex: 'name', key: 'name', render: (name: string) => <span className="font-bold text-xs text-slate-900">{name}</span> },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (p: string) => <span className="text-xs">{p}</span> },
    { title: 'Site Location', dataIndex: 'siteLocation', key: 'siteLocation', render: (loc: string) => <span className="text-xs font-semibold">{loc}</span> },
    { title: 'Work Description', dataIndex: 'description', key: 'description', render: (desc: string) => <span className="text-xs text-slate-600">{desc}</span> },
    { title: 'Amount Paid', dataIndex: 'amount', key: 'amount', render: (amt: number) => <span className="font-bold text-xs text-emerald-600">₹{amt.toLocaleString('en-IN')}</span> },
    { title: 'Payment Mode', dataIndex: 'paymentMode', key: 'paymentMode', render: (mode: string) => <Tag color="blue">{mode}</Tag> },
    { title: 'Date', dataIndex: 'paymentDate', key: 'paymentDate', render: (d: string) => <span className="text-xs">{d}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Labour & Carpenter Payments</h2>
          <p className="text-xs text-slate-500">Track daily wage painters, carpenters, false ceiling technicians & site contractors</p>
        </div>
        <Button type="primary" icon={<Plus className="w-4 h-4 mr-1" />} onClick={() => setModalOpen(true)} className="bg-slate-900 font-bold h-10">
          Add Labour Payment
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <Table dataSource={labourList} columns={columns} rowKey="id" loading={loading} />
      </div>

      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} title="Record Labour Payment" footer={null} centered>
        <Form form={form} layout="vertical" onFinish={handleAdd} className="mt-4 space-y-3">
          <Form.Item name="name" label="Worker / Contractor Name" rules={[{ required: true }]}>
            <Input placeholder="M. Murugan (Chief Carpenter)" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="phone" label="Phone Number" rules={[{ required: true }]}>
              <Input placeholder="9786543210" />
            </Form.Item>
            <Form.Item name="paymentDate" label="Payment Date" rules={[{ required: true }]}>
              <Input defaultValue={new Date().toISOString().split('T')[0]} />
            </Form.Item>
          </div>
          <Form.Item name="siteLocation" label="Site Location" rules={[{ required: true }]}>
            <Input placeholder="Royal Residence Villa, Kovilpatti" />
          </Form.Item>
          <Form.Item name="description" label="Work Completed Description" rules={[{ required: true }]}>
            <Input placeholder="Modular kitchen assembly phase 2" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="amount" label="Amount Paid (₹)" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true }]}>
              <Select options={[{ value: 'Cash' }, { value: 'UPI' }, { value: 'Bank Transfer' }]} />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit" block className="bg-slate-900 mt-2">Save Payment Entry</Button>
        </Form>
      </Modal>
    </div>
  );
};
