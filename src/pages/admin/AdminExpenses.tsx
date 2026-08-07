import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Tag, message } from 'antd';
import { financeService } from '../../services/api';
import { ExpenseRecord } from '../../types';
import { Plus, Receipt } from 'lucide-react';

export const AdminExpenses: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const data = await financeService.getExpenses();
    setExpenses(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (values: any) => {
    await financeService.addExpense(values);
    message.success('Expense record logged');
    setModalOpen(false);
    loadData();
  };

  const columns = [
    { title: 'Expense Title', dataIndex: 'title', key: 'title', render: (t: string) => <span className="font-bold text-xs text-slate-900">{t}</span> },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c: string) => <Tag color="orange">{c}</Tag> },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (amt: number) => <span className="font-bold text-xs text-red-600">₹{amt.toLocaleString('en-IN')}</span> },
    { title: 'Payment Mode', dataIndex: 'paymentMode', key: 'paymentMode', render: (m: string) => <span className="text-xs">{m}</span> },
    { title: 'Date', dataIndex: 'expenseDate', key: 'expenseDate', render: (d: string) => <span className="text-xs">{d}</span> },
    { title: 'Remarks', dataIndex: 'remarks', key: 'remarks', render: (r: string) => <span className="text-xs text-slate-500">{r || '-'}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Showroom Expense Logs</h2>
          <p className="text-xs text-slate-500">Rent, electricity, transport fuel, staff salaries & miscellaneous business expenses</p>
        </div>
        <Button type="primary" icon={<Plus className="w-4 h-4 mr-1" />} onClick={() => setModalOpen(true)} className="bg-red-600 font-bold h-10 border-none">
          Log New Expense
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <Table dataSource={expenses} columns={columns} rowKey="id" loading={loading} />
      </div>

      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} title="Record Business Expense" footer={null} centered>
        <Form form={form} layout="vertical" onFinish={handleAdd} className="mt-4 space-y-3">
          <Form.Item name="title" label="Expense Description" rules={[{ required: true }]}>
            <Input placeholder="TNEB Electricity Bill Showroom" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="category" label="Category" rules={[{ required: true }]}>
              <Select options={[{ value: 'Rent' }, { value: 'Electricity' }, { value: 'Fuel' }, { value: 'Transport' }, { value: 'Salary' }, { value: 'Miscellaneous' }]} />
            </Form.Item>
            <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true }]}>
              <Select options={[{ value: 'Bank Transfer' }, { value: 'UPI' }, { value: 'Cash' }, { value: 'Cheque' }]} />
            </Form.Item>
            <Form.Item name="expenseDate" label="Expense Date" rules={[{ required: true }]}>
              <Input defaultValue={new Date().toISOString().split('T')[0]} />
            </Form.Item>
          </div>
          <Form.Item name="remarks" label="Remarks">
            <Input placeholder="August 2026 Payment" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block className="bg-red-600 border-none mt-2">Log Expense Entry</Button>
        </Form>
      </Modal>
    </div>
  );
};
