import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, FileDown } from "lucide-react";
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
import { FinanceDateFilter, type FinanceDateFilterValue } from "@/components/common/DateFilter";
import type { TableColumn, KpiItem } from "@/types/types";
import { downloadBillPdf } from "@/utils/billPdf";
import { combinedBillDate, combinedBillNumber, getFinanceBillSettings } from "@/utils/financeBill";

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

const expenseNotes = (row: ApiExpenseRow) => {
  if (!row.remarks) return row.title;
  try {
    const parsed = JSON.parse(row.remarks);
    if (parsed.__labour) {
      return [
        parsed.workerName ? `Worker: ${parsed.workerName}` : "",
        parsed.siteLocation ? `Site: ${parsed.siteLocation}` : "",
        parsed.notes || "",
      ].filter(Boolean).join(" | ") || row.title;
    }
  } catch {
    // Plain text remarks are valid.
  }
  return row.remarks;
};

export default function Expenses() {
  const { toggle } = useBusiness();
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [rows, setRows] = useState<ApiExpenseRow[]>([]);
  const [pagination, setPagination] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<FinanceDateFilterValue>({});
  const [selectedRowIds, setSelectedRowIds] = useState<Array<string | number>>([]);
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
        ...dateFilter,
      });
      setKpis(res.kpis);
      setRows(res.rows);
      setPagination(res.pagination);
      setSelectedRowIds([]);
    } catch {
      message.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [toggle, debouncedSearch, dateFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const selectedRows = rows.filter((row) => selectedRowIds.includes(row.id));

  const openAdd = () => {
    setEditing(null);
    setCategory("");
    form.resetFields();
    form.setFieldsValue({ expenseDate: dayjs() });
    setModalOpen(true);
  };

  const openEdit = (row: ApiExpenseRow) => {
    setEditing(row);
    let remarksVal = row.remarks;
    let workerName = "";
    let siteLocation = "";
    try {
      const parsed = JSON.parse(row.remarks);
      if (parsed.__labour) {
        workerName = parsed.workerName ?? "";
        siteLocation = parsed.siteLocation ?? "";
        remarksVal = parsed.notes ?? "";
      }
    } catch {
      // Plain text remarks are valid.
    }
    setCategory(row.category);
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

  const handleDownloadBill = async (row: ApiExpenseRow) => {
    try {
      const billSettings = await getFinanceBillSettings(toggle);
      const billNumber = `EXP-${row.id.slice(0, 8).toUpperCase()}`;

      downloadBillPdf({
        title: "Expense Bill",
        billNumber,
        date: row.date,
        business: billSettings.business,
        partyLabel: "Expense Category",
        partyName: row.category,
        paymentMode: row.paymentMode,
        reference: billNumber,
        notes: expenseNotes(row),
        items: [{
          description: row.title,
          quantity: 1,
          rate: row.amountRaw,
          amount: row.amountRaw,
        }],
        totalAmount: row.amountRaw,
        footerNote: billSettings.footerNote,
        terms: billSettings.terms,
        fileName: `expense-bill-${billNumber}`,
      });
    } catch {
      message.error("Unable to generate bill");
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedRows.length === 0) {
      message.warning("Select at least one expense");
      return;
    }
    try {
      const billSettings = await getFinanceBillSettings(toggle);
      const billNumber = combinedBillNumber("EXP-COMBINED");
      const totalAmount = selectedRows.reduce((sum, row) => sum + Number(row.amountRaw || 0), 0);
      const modes = Array.from(new Set(selectedRows.map((row) => row.paymentMode)));

      downloadBillPdf({
        title: "Combined Expense Bill",
        billNumber,
        date: combinedBillDate(selectedRows.map((row) => row.date)),
        business: billSettings.business,
        partyLabel: "Selected Records",
        partyName: `${selectedRows.length} expenses`,
        paymentMode: modes.length === 1 ? modes[0] : "Multiple",
        reference: billNumber,
        notes: `Combined bill generated from ${selectedRows.length} selected expense records.`,
        items: selectedRows.map((row) => ({
          description: `${row.date} | ${row.category} | ${row.title}${row.remarks ? ` | ${expenseNotes(row)}` : ""}`,
          quantity: 1,
          rate: row.amountRaw,
          amount: row.amountRaw,
        })),
        totalAmount,
        footerNote: billSettings.footerNote,
        terms: billSettings.terms,
        fileName: `expense-combined-bill-${billNumber}`,
      });
    } catch {
      message.error("Unable to generate combined bill");
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
        <Button variant="ghost" size="sm" icon={FileDown} onClick={() => handleDownloadBill(r)}>Bill</Button>
        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(r)} />
        <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(r)} />
      </span>
    ),
  }));

  return (
    <div>
      <KpiRow items={kpis} />
      <Toolbar
        left={
          <>
            <SearchBox value={search} onChange={handleSearch} placeholder="Search expenses…" />
            <FinanceDateFilter onChange={setDateFilter} />
          </>
        }
        right={
          <>
            <Button
              variant="ghost"
              size="sm"
              icon={FileDown}
              disabled={selectedRows.length === 0}
              onClick={handleDownloadSelected}
            >
              Download Selected ({selectedRows.length})
            </Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={openAdd}>Add Expense</Button>
          </>
        }
      />
      <DataTable
        columns={COLUMNS}
        rows={tableRows}
        loading={loading}
        title="Expense History"
        subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business`}
        paginationText={pagination}
        selectable
        selectedRowIds={selectedRowIds}
        onSelectionChange={setSelectedRowIds}
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
