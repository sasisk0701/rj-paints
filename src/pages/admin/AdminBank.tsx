import React, { useState, useEffect } from 'react';
import { Card, Table, Tag } from 'antd';
import { financeService } from '../../services/api';
import { BankAccount, BankTransaction } from '../../types';
import { Landmark, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';

export const AdminBank: React.FC = () => {
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([financeService.getBankAccounts(), financeService.getTransactions()]).then(([b, t]) => {
      setBanks(b);
      setTransactions(t);
      setLoading(false);
    });
  }, []);

  const totalLiquidity = banks.reduce((acc, curr) => acc + curr.currentBalance, 0);

  const txColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => <span className="text-xs">{d}</span> },
    { title: 'Description', dataIndex: 'description', key: 'description', render: (t: string) => <span className="font-semibold text-xs text-slate-900">{t}</span> },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (type: string) => <Tag color={type === 'Income' ? 'green' : type === 'Expense' ? 'red' : 'blue'}>{type}</Tag> },
    { title: 'Payment Mode', dataIndex: 'paymentMode', key: 'paymentMode', render: (m: string) => <span className="text-xs">{m}</span> },
    { title: 'Ref No', dataIndex: 'referenceNo', key: 'referenceNo', render: (r: string) => <span className="text-xs font-mono text-slate-400">{r || '-'}</span> },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (amt: number, r: BankTransaction) => (
      <span className={`font-bold text-xs ${r.type === 'Income' ? 'text-emerald-600' : 'text-slate-900'}`}>
        ₹{amt.toLocaleString('en-IN')}
      </span>
    ) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Bank Accounts & Cash Balance</h2>
          <p className="text-xs text-slate-500">SBI Current, HDFC Current & Showroom cash drawer liquid balances</p>
        </div>
        <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl">
          <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Liquid Cash</span>
          <span className="text-xl font-black text-amber-400">₹{totalLiquidity.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Bank Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {banks.map((acc) => (
          <Card key={acc.id} className="shadow-md rounded-2xl border border-slate-200">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{acc.type}</span>
                <h3 className="font-extrabold text-slate-900 text-base mt-1">{acc.accountName}</h3>
                <p className="text-xs text-slate-500">{acc.bankName}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Landmark className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-2 flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Current Balance:</span>
              <span className="text-2xl font-black text-slate-900">₹{acc.currentBalance.toLocaleString('en-IN')}</span>
            </div>
            {acc.accountNumber !== 'N/A' && (
              <div className="text-[10px] font-mono text-slate-400 mt-2">
                A/C: {acc.accountNumber} | IFSC: {acc.ifscCode}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Bank & Cash Transaction Ledger</h3>
        <Table dataSource={transactions} columns={txColumns} rowKey="id" loading={loading} />
      </div>
    </div>
  );
};
