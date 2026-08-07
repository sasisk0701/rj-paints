import React from 'react';
import { Card, Table, Tag } from 'antd';
import { PAINT_CATEGORIES, BRANDS } from '../../data/paintsData';
import { Tags, ShieldCheck } from 'lucide-react';

export const AdminCategoriesBrands: React.FC = () => {
  const catColumns = [
    { title: 'Category Name', dataIndex: 'name', key: 'name', render: (n: string) => <span className="font-bold text-xs text-slate-900">{n}</span> },
    { title: 'Description', dataIndex: 'description', key: 'description', render: (d: string) => <span className="text-xs text-slate-500">{d}</span> },
    { title: 'Business Scope', dataIndex: 'business', key: 'business', render: (b: string) => <Tag color="blue">{b.toUpperCase()}</Tag> }
  ];

  const brandColumns = [
    { title: 'Brand Name', dataIndex: 'name', key: 'name', render: (n: string) => <span className="font-bold text-xs text-slate-900">{n}</span> },
    { title: 'Authorized Status', dataIndex: 'isAuthorized', key: 'isAuthorized', render: (auth: boolean) => <Tag color={auth ? 'green' : 'gray'}>{auth ? 'Authorized Dealer' : 'Wholesale Stock'}</Tag> },
    { title: 'Description', dataIndex: 'description', key: 'description', render: (d: string) => <span className="text-xs text-slate-500">{d}</span> }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Categories & Brands Master</h2>
        <p className="text-xs text-slate-500">Asian Paints, Berger, Nippon, Birla White product taxonomy</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Product Categories ({PAINT_CATEGORIES.length})</h3>
          <Table dataSource={PAINT_CATEGORIES} columns={catColumns} rowKey="id" pagination={false} size="small" />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Authorized Brands ({BRANDS.length})</h3>
          <Table dataSource={BRANDS} columns={brandColumns} rowKey="id" pagination={false} size="small" />
        </div>
      </div>
    </div>
  );
};
