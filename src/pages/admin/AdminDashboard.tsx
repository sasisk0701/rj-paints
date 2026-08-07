import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Alert, Button } from 'antd';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { productService, inventoryService, financeService } from '../../services/api';
import { Product, StockOutRecord, BankTransaction } from '../../types';
import { MONTHLY_SALES_ANALYTICS } from '../../data/mockAdminData';
import {
  Package,
  DollarSign,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Receipt,
  Landmark,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [salesRecords, setSalesRecords] = useState<StockOutRecord[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productService.getProducts(),
      inventoryService.getStockOut(),
      financeService.getTransactions()
    ]).then(([prods, sales, txs]) => {
      setProducts(prods);
      setSalesRecords(sales);
      setTransactions(txs);
      setLoading(false);
    });
  }, []);

  // Metric Computations
  const totalStockItems = products.reduce((acc, item) => acc + item.stock, 0);
  const totalStockValue = products.reduce((acc, item) => acc + item.stock * item.sellingPrice, 0);
  const lowStockItems = products.filter((p) => p.stock <= p.minStock);

  const totalMonthlySales = salesRecords.reduce((acc, item) => acc + item.grandTotal, 0) + 840000;
  const todaySales = salesRecords[0]?.grandTotal || 54398;
  const monthlyProfit = 250000;
  const monthlyExpenses = 71000;
  const bankBalance = 948200;

  const transactionColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date', render: (text: string) => <span className="text-xs">{text}</span> },
    { title: 'Description', dataIndex: 'description', key: 'description', render: (text: string) => <span className="text-xs font-semibold">{text}</span> },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'Income' ? 'green' : type === 'Expense' ? 'red' : 'blue'}>
          {type}
        </Tag>
      )
    },
    { title: 'Payment Mode', dataIndex: 'paymentMode', key: 'paymentMode', render: (mode: string) => <span className="text-xs">{mode}</span> },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: BankTransaction) => (
        <span className={`font-bold text-xs ${record.type === 'Income' ? 'text-emerald-600' : 'text-slate-900'}`}>
          ₹{amount.toLocaleString('en-IN')}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-8">
      {/* Top Welcome Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 font-bold text-xs uppercase rounded-full inline-flex items-center mb-2">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Executive Admin Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">RJ Paints & Styleo Interiors Overview</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time stock valuation, Kovilpatti sales analytics, expenses & financial reports
          </p>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 text-right">
          <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Stock Value</span>
          <span className="text-2xl font-black text-amber-400">₹{totalStockValue.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <Alert
          message={
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">
                ⚠️ Low Stock Alert: {lowStockItems.length} Products require immediate supplier re-order!
              </span>
              <span className="text-xs underline cursor-pointer">View Low Stock List</span>
            </div>
          }
          type="warning"
          showIcon
          className="rounded-2xl border-amber-300 bg-amber-50"
        />
      )}

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-md rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Available Inventory</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalStockItems} Units</div>
              <span className="text-[10px] text-blue-600 font-bold">{products.length} Active SKUs</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="shadow-md rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Today's Sales</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">₹{todaySales.toLocaleString('en-IN')}</div>
              <span className="text-[10px] text-slate-500 font-bold">August Monthly: ₹{totalMonthlySales.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="shadow-md rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Monthly Net Profit</span>
              <div className="text-2xl font-black text-slate-900 mt-1">₹{monthlyProfit.toLocaleString('en-IN')}</div>
              <span className="text-[10px] text-emerald-600 font-bold">+18.5% Growth</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="shadow-md rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Total Bank Balance</span>
              <div className="text-2xl font-black text-slate-900 mt-1">₹{bankBalance.toLocaleString('en-IN')}</div>
              <span className="text-[10px] text-slate-500 font-bold">SBI & HDFC Accounts</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Landmark className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sales & Purchase Analytics Bar Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Sales vs Purchase Analytics (₹)</h3>
              <p className="text-xs text-slate-500">Monthly breakdown for Kovilpatti Paint & Interior works</p>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_SALES_ANALYTICS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val: any) => `₹${val.toLocaleString('en-IN')}`} />
                <Legend />
                <Bar dataKey="sales" name="Sales (Inflow)" fill="#0F3D87" radius={[6, 6, 0, 0]} />
                <Bar dataKey="purchase" name="Purchase (Outflow)" fill="#FFB800" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Profit Trend Line Chart */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-md flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Profit Growth Trend</h3>
              <p className="text-xs text-slate-500">Net earnings progression</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MONTHLY_SALES_ANALYTICS}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val: any) => `₹${val.toLocaleString('en-IN')}`} />
                  <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#00E676" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Bank Transactions Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Latest Business Transactions</h3>
          <span className="text-xs text-slate-500">Real-time ledger updates</span>
        </div>
        <Table
          dataSource={transactions}
          columns={transactionColumns}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </div>
    </div>
  );
};
