import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { Form, Input, InputNumber, Select, DatePicker, message } from "antd";
import dayjs from "dayjs";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { bankService, type ApiBankAccount } from "@/services/api";
import { Toolbar, SearchBox } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { Badge } from "@/components/common/Badge.tsx";
import { KpiRow } from "@/components/common/KpiCard";
import { DataTable } from "@/components/common/DataTable";
import { AppModal } from "@/components/common/AppModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Panel } from "@/components/common/Panel.tsx";
import type { TableColumn, KpiItem } from "@/types/types";

const TXN_COLS: TableColumn[] = [
  { key: "date", label: "Date" },
  { key: "type", label: "Type" },
  { key: "description", label: "Description" },
  { key: "account", label: "Account" },
  { key: "amount", label: "Amount", align: "num" },
  { key: "direction", label: "Dir." },
  { key: "actions", label: "", align: "num" },
];

const TXN_TYPES = ["Deposit", "Withdrawal", "Transfer", "Cheque", "NEFT/RTGS", "UPI", "Other"];

export default function Bank() {
  const { toggle } = useBusiness();
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<ApiBankAccount[]>([]);
  const [pagination, setPagination] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [accModalOpen, setAccModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<ApiBankAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [txnForm] = Form.useForm();
  const [accForm] = Form.useForm();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(e.target.value), 400);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [txnRes, accs] = await Promise.all([
        bankService.getTransactions({ business: toggle.toUpperCase() }),
        bankService.getAccounts(toggle.toUpperCase()),
      ]);
      setKpis(txnRes.kpis);
      setRows(txnRes.rows);
      setPagination(txnRes.pagination);
      setAccounts(accs);
    } catch {
      message.error("Failed to load bank data");
    } finally {
      setLoading(false);
    }
  }, [toggle]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredRows = debouncedSearch
    ? rows.filter(r => r.description.toLowerCase().includes(debouncedSearch.toLowerCase()) || r.account.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : rows;

  const handleSaveTxn = async () => {
    const values = await txnForm.validateFields();
    setSaving(true);
    try {
      await bankService.createTransaction({
        bankAccountId: values.bankAccountId,
        date: values.date.toISOString(),
        type: values.type,
        description: values.description,
        amount: values.amount,
        direction: values.direction,
        reference: values.reference,
      });
      message.success("Transaction added");
      setTxnModalOpen(false);
      txnForm.resetFields();
      fetchAll();
    } catch {
      message.error("Failed to add transaction");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAcc = async () => {
    const values = await accForm.validateFields();
    setSaving(true);
    try {
      const payload = { ...values, business: toggle.toUpperCase() };
      if (editingAcc) {
        await bankService.updateAccount(editingAcc.id, payload);
        message.success("Account updated");
      } else {
        await bankService.createAccount(payload);
        message.success("Account added");
      }
      setAccModalOpen(false);
      accForm.resetFields();
      fetchAll();
    } catch {
      message.error("Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTxn = async () => {
    if (!deleteTarget) return;
    try {
      await bankService.deleteTransaction(deleteTarget.id);
      message.success("Transaction deleted");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      message.error("Failed to delete");
    }
  };

  const openEditAcc = (acc: ApiBankAccount) => {
    setEditingAcc(acc);
    accForm.setFieldsValue(acc);
    setAccModalOpen(true);
  };

  const tableRows = filteredRows.map((r) => ({
    id: r.id,
    date: r.date,
    type: <Badge tone="neutral">{r.type}</Badge>,
    description: r.description,
    account: r.account,
    amount: r.amount,
    direction: <Badge tone={r.direction === "Credit" ? "success" : "danger"}>{r.direction}</Badge>,
    actions: (
      <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget({ id: r.id, label: r.description })} />
    ),
  }));

  return (
    <div>
      <KpiRow items={kpis} />

      {/* Account Cards */}
      <div className="grid gap-3.5 mb-4" style={{ gridTemplateColumns: `repeat(${Math.max(accounts.length, 1)}, 1fr)` }}>
        {accounts.length === 0 ? (
          <Panel className="p-4 text-ink-3 text-sm">No bank accounts yet. Add one below.</Panel>
        ) : accounts.map((a) => (
          <Panel key={a.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{a.accountName}</div>
                <div className="font-mono text-[11.5px] text-ink-3">A/C {a.accountNumber} · IFSC {a.ifscCode}</div>
                <div className="text-xs text-ink-3 mt-0.5">{a.bankName} · {a.type}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="font-display text-[19px] font-semibold">₹{a.currentBalance.toLocaleString("en-IN")}</div>
                <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEditAcc(a)} />
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <Toolbar
        left={<SearchBox value={search} onChange={handleSearch} placeholder="Search transactions…" />}
        right={
          <>
            <Button variant="ghost" size="sm" icon={Building2} onClick={() => { setEditingAcc(null); accForm.resetFields(); setAccModalOpen(true); }}>Add Account</Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => { txnForm.resetFields(); setTxnModalOpen(true); }}>Add Transaction</Button>
          </>
        }
      />
      <DataTable
        columns={TXN_COLS}
        rows={tableRows}
        loading={loading}
        title="Bank Transaction History"
        subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business`}
        paginationText={pagination}
      />

      {/* Add Transaction Modal */}
      <AppModal
        open={txnModalOpen}
        title="Add Bank Transaction"
        onClose={() => setTxnModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTxnModalOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSaveTxn}>Save</Button>
          </>
        }
      >
        <Form form={txnForm} layout="vertical" className="grid grid-cols-2 gap-x-4">
          <Form.Item name="bankAccountId" label="Account" rules={[{ required: true }]} className="col-span-2">
            <Select
              options={accounts.map((a) => ({ value: a.id, label: `${a.bankName} – ${a.accountName}` }))}
              placeholder="Select account"
            />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]} className="col-span-1">
            <Select options={TXN_TYPES.map((t) => ({ value: t, label: t }))} placeholder="Select type" />
          </Form.Item>
          <Form.Item name="direction" label="Direction" rules={[{ required: true }]} className="col-span-1">
            <Select options={[{ value: "Credit", label: "Credit (In)" }, { value: "Debit", label: "Debit (Out)" }]} />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]} className="col-span-2">
            <Input placeholder="e.g. Asian Paints Depot payment" />
          </Form.Item>
          <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]} className="col-span-1">
            <InputNumber min={0} className="w-full" placeholder="0.00" />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]} className="col-span-1">
            <DatePicker className="w-full" format="DD/MM/YYYY" defaultValue={dayjs()} />
          </Form.Item>
          <Form.Item name="reference" label="Reference / Cheque No." className="col-span-2">
            <Input placeholder="Optional" />
          </Form.Item>
        </Form>
      </AppModal>

      {/* Add/Edit Account Modal */}
      <AppModal
        open={accModalOpen}
        title={editingAcc ? "Edit Bank Account" : "Add Bank Account"}
        onClose={() => setAccModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAccModalOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSaveAcc}>{editingAcc ? "Update" : "Save"}</Button>
          </>
        }
      >
        <Form form={accForm} layout="vertical" className="grid grid-cols-2 gap-x-4">
          <Form.Item name="accountName" label="Account Name" rules={[{ required: true }]} className="col-span-2">
            <Input placeholder="e.g. Indian Bank – Current" />
          </Form.Item>
          <Form.Item name="bankName" label="Bank Name" rules={[{ required: true }]} className="col-span-1">
            <Input placeholder="e.g. Indian Bank" />
          </Form.Item>
          <Form.Item name="type" label="Account Type" rules={[{ required: true }]} className="col-span-1">
            <Select options={["Current", "Savings", "OD"].map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="accountNumber" label="Account Number" rules={[{ required: true }]} className="col-span-1">
            <Input placeholder="e.g. IB0492817" />
          </Form.Item>
          <Form.Item name="ifscCode" label="IFSC Code" rules={[{ required: true }]} className="col-span-1">
            <Input placeholder="e.g. IDIB000A492" />
          </Form.Item>
          <Form.Item name="currentBalance" label="Opening Balance (₹)" className="col-span-2">
            <InputNumber min={0} className="w-full" placeholder="0.00" />
          </Form.Item>
        </Form>
      </AppModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Transaction"
        description={`Delete "${deleteTarget?.label}"? This cannot be undone.`}
        onConfirm={handleDeleteTxn}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
