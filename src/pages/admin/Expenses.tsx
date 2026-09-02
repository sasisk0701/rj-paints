import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Form, Input, InputNumber, Select, DatePicker, message } from "antd";
import dayjs from "dayjs";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { expenseService, type ApiExpense, type ApiExpenseRow } from "@/services/api";
import { Toolbar, SearchBox } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { Badge } from "@/components/common/Badge.tsx";
import { KpiRow } from "@/components/common/KpiCard";
import { DataTable } from "@/components/common/DataTable";
import { AppModal } from "@/components/common/AppModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { TableColumn, KpiItem } from "@/types/types";

const COLUMNS: TableColumn[] = [
  { key: "date", label: "Date" },
  { key: "category", label: "Category" },
  { key: "title", label: "Title" },
  { key: "paymentMode", label: "Mode" },
  { key: "amount", label: "Amount", align: "num" },
  { key: "actions", label: "", align: "num" },
];

const CATEGORIES = ["Rent", "Electricity", "Transport", "Salary", "Fuel", "Maintenance", "Office", "Labour", "Other"];
const PAYMENT_MODES = ["Cash", "Bank", "UPI", "Cheque"];

export default function Expenses() {
  const { toggle } = useBusiness();
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [rows, setRows] = useState<ApiExpenseRow[]>([]);
  const [pagination, setPagination] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 400);
  };
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiExpenseRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiExpenseRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [category, setCategory] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expenseService.getAll({
        business: toggle.toUpperCase(),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      setKpis(res.kpis);
      setRows(res.rows);
      setPagination(res.pagination);
    } catch {
      message.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [toggle, debouncedSearch]);

  useEffect(() => { fetch(); }, [fetch, toggle]);

  const openAdd = () => {
    setEditing(null);
    setCategory("");
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (row: ApiExpenseRow) => {
    setEditing(row);
    let remarksVal = row.remarks;
    let workerName = "", siteLocation = "";
    try {
      const parsed = JSON.parse(row.remarks);
      if (parsed.__labour) { workerName = parsed.workerName ?? ""; siteLocation = parsed.siteLocation ?? ""; remarksVal = parsed.notes ?? ""; }
    } catch { /* plain string */ }
    form.setFieldsValue({
      category: row.category,
      title: row.title,
      paymentMode: row.paymentMode,
      amount: row.amountRaw,
      expenseDate: dayjs(row.date, "DD MMM YYYY"),
      remarks: remarksVal,
      workerName,
      siteLocation,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const isLabour = values.category === "Labour";
      const remarksValue = isLabour
        ? JSON.stringify({ __labour: true, workerName: values.workerName || "", siteLocation: values.siteLocation || "", notes: values.remarks || "" })
        : (values.remarks || null);
      const payload: Omit<ApiExpense, "id" | "createdAt" | "updatedAt"> = {
        category: values.category,
        title: isLabour ? (values.workerName ? `Labour – ${values.workerName}` : values.title) : values.title,
        amount: values.amount,
        paymentMode: values.paymentMode,
        expenseDate: values.expenseDate.toISOString(),
        remarks: remarksValue,
        business: toggle.toUpperCase() as any,
      };
      if (editing) {
        await expenseService.update(editing.id, payload);
        message.success("Expense updated");
      } else {
        await expenseService.create(payload);
        message.success("Expense added");
      }
      setModalOpen(false);
      fetch();
    } catch {
      message.error("Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await expenseService.remove(deleteTarget.id);
      message.success("Expense deleted");
      setDeleteTarget(null);
      fetch();
    } catch {
      message.error("Failed to delete expense");
    }
  };

  const tableRows = rows.map((r) => ({
    id: r.id,
    date: r.date,
    category: <Badge tone="neutral">{r.category}</Badge>,
    title: r.title,
    paymentMode: r.paymentMode,
    amount: r.amount,
    actions: (
      <span className="flex gap-1 justify-end">
        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(r)} />
        <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(r)} />
      </span>
    ),
  }));

  return (
    <div>
      <KpiRow items={kpis} />
      <Toolbar
        left={<SearchBox value={search} onChange={handleSearch} placeholder="Search expenses…" />}
        right={<Button variant="primary" size="sm" icon={Plus} onClick={openAdd}>Add Expense</Button>}
      />
      <DataTable
        columns={COLUMNS}
        rows={tableRows}
        loading={loading}
        title="Expense History"
        subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business`}
        paginationText={pagination}
      />

      <AppModal
        open={modalOpen}
        title={editing ? "Edit Expense" : "Add Expense"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {editing ? "Update" : "Save"}
            </Button>
          </>
        }
      >
        <Form form={form} layout="vertical" className="grid grid-cols-2 gap-x-4" onValuesChange={(v) => { if (v.category) setCategory(v.category); }}>
          <Form.Item name="category" label="Category" rules={[{ required: true }]} className="col-span-1">
            <Select options={CATEGORIES.map((c) => ({ value: c, label: c }))} placeholder="Select category" />
          </Form.Item>
          <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true }]} className="col-span-1">
            <Select options={PAYMENT_MODES.map((m) => ({ value: m, label: m }))} placeholder="Select mode" />
          </Form.Item>
          {category === "Labour" ? (
            <>
              <Form.Item name="workerName" label="Worker Name" rules={[{ required: true }]} className="col-span-1">
                <Input placeholder="e.g. Rajan" />
              </Form.Item>
              <Form.Item name="siteLocation" label="Site / Location" className="col-span-1">
                <Input placeholder="e.g. Kovilpatti Main Road" />
              </Form.Item>
            </>
          ) : (
            <Form.Item name="title" label="Title / Description" rules={[{ required: true }]} className="col-span-2">
              <Input placeholder="e.g. Godown rent – August" />
            </Form.Item>
          )}
          <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]} className="col-span-1">
            <InputNumber min={0} className="w-full" placeholder="0.00" />
          </Form.Item>
          <Form.Item name="expenseDate" label="Date" rules={[{ required: true }]} className="col-span-1">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="remarks" label="Remarks / Notes" className="col-span-2">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </AppModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Expense"
        description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
