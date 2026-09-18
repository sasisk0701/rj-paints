import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, Trash2, FileDown } from "lucide-react";
import { Form, Input, InputNumber, Select, DatePicker, message } from "antd";
import dayjs from "dayjs";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { cashService, type ApiCashTransaction } from "@/services/api";
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
  { key: "type", label: "Type" },
  { key: "description", label: "Description" },
  { key: "amount", label: "Amount", align: "num" },
  { key: "direction", label: "Dir." },
  { key: "actions", label: "", align: "num" },
];

const CASH_TYPES = [
  "Cash In",
  "Cash Out",
  "Freight charges",
  "Fuel",
  "Token",
  "Petty Cash",
  "Wages/ labour",
  "Rent",
  "EB/Recharge",
  "Bank",
  "Salary",
  "Co",
  "Counter Sale",
  "Advance",
  "Refund",
  "Other",
];

const amountValue = (row: ApiCashTransaction) =>
  Number(String(row.amountRaw ?? row.amount ?? 0).replace(/[^0-9.-]/g, "")) || 0;

export default function Cash() {
  const { toggle } = useBusiness();
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [rows, setRows] = useState<ApiCashTransaction[]>([]);
  const [pagination, setPagination] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<FinanceDateFilterValue>({});
  const [selectedRowIds, setSelectedRowIds] = useState<Array<string | number>>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(e.target.value), 400);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cashService.getAll({
        business: toggle.toUpperCase(),
        ...dateFilter,
      });
      setKpis(res.kpis);
      setRows(res.rows);
      setPagination(res.pagination);
      setSelectedRowIds([]);
    } catch {
      message.error("Failed to load cash transactions");
    } finally {
      setLoading(false);
    }
  }, [toggle, dateFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredRows = debouncedSearch
    ? rows.filter((r) => r.description.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : rows;

  useEffect(() => {
    const visibleIds = new Set(filteredRows.map((row) => row.id));
    setSelectedRowIds((current) => current.filter((id) => visibleIds.has(id as string)));
  }, [debouncedSearch, rows]);

  const selectedRows = filteredRows.filter((row) => selectedRowIds.includes(row.id));

  const handleDownloadBill = async (row: ApiCashTransaction) => {
    try {
      const billSettings = await getFinanceBillSettings(toggle);
      const billNumber = row.reference || `CASH-${row.id.slice(0, 8).toUpperCase()}`;
      const amountRaw = amountValue(row);

      downloadBillPdf({
        title: "Cash Transaction Bill",
        billNumber,
        date: row.date,
        business: billSettings.business,
        partyLabel: "Transaction Type",
        partyName: row.type,
        paymentMode: "Cash",
        reference: row.reference || billNumber,
        notes: `${row.direction} - ${row.description}`,
        items: [{
          description: row.description || `${row.type} cash transaction`,
          quantity: 1,
          rate: amountRaw,
          amount: amountRaw,
        }],
        totalAmount: amountRaw,
        footerNote: billSettings.footerNote,
        terms: billSettings.terms,
        fileName: `cash-bill-${billNumber}`,
      });
    } catch {
      message.error("Unable to generate bill");
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedRows.length === 0) {
      message.warning("Select at least one cash transaction");
      return;
    }
    try {
      const billSettings = await getFinanceBillSettings(toggle);
      const billNumber = combinedBillNumber("CASH-COMBINED");
      const totalAmount = selectedRows.reduce((sum, row) => sum + amountValue(row), 0);

      downloadBillPdf({
        title: "Combined Cash Transactions",
        billNumber,
        date: combinedBillDate(selectedRows.map((row) => row.date)),
        business: billSettings.business,
        partyLabel: "Selected Records",
        partyName: `${selectedRows.length} cash transactions`,
        paymentMode: "Cash",
        reference: billNumber,
        notes: `Combined bill generated from ${selectedRows.length} selected cash transactions.`,
        items: selectedRows.map((row) => ({
          description: `${row.date} | ${row.type} | ${row.direction} | ${row.description}`,
          quantity: 1,
          rate: amountValue(row),
          amount: amountValue(row),
        })),
        totalAmount,
        footerNote: billSettings.footerNote,
        terms: billSettings.terms,
        fileName: `cash-combined-bill-${billNumber}`,
      });
    } catch {
      message.error("Unable to generate combined bill");
    }
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await cashService.create({
        date: values.date.toISOString(),
        type: values.type,
        description: values.description,
        amount: values.amount,
        direction: values.direction,
        business: toggle.toUpperCase(),
        reference: values.reference,
      });
      message.success("Cash entry added");
      setModalOpen(false);
      form.resetFields();
      fetchAll();
    } catch {
      message.error("Failed to add cash entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await cashService.remove(deleteTarget.id);
      message.success("Entry deleted");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      message.error("Failed to delete");
    }
  };

  const tableRows = filteredRows.map((r) => ({
    id: r.id,
    date: r.date,
    type: <Badge tone="neutral">{r.type}</Badge>,
    description: r.description,
    amount: r.amount,
    direction: <Badge tone={r.direction === "Credit" ? "success" : "danger"}>{r.direction}</Badge>,
    actions: (
      <span className="flex gap-1 justify-end">
        <Button variant="ghost" size="sm" icon={FileDown} onClick={() => handleDownloadBill(r)}>Bill</Button>
        <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget({ id: r.id, label: r.description })} />
      </span>
    ),
  }));

  return (
    <div>
      <KpiRow items={kpis} />
      <Toolbar
        left={
          <>
            <SearchBox value={search} onChange={handleSearch} placeholder="Search cash entries…" />
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
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => { form.resetFields(); form.setFieldsValue({ date: dayjs() }); setModalOpen(true); }}
            >
              Record Cash Entry
            </Button>
          </>
        }
      />
      <DataTable
        columns={COLUMNS}
        rows={tableRows}
        loading={loading}
        title="Cash Transaction History"
        subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business`}
        paginationText={pagination}
        selectable
        selectedRowIds={selectedRowIds}
        onSelectionChange={setSelectedRowIds}
      />

      <AppModal
        open={modalOpen}
        title="Record Cash Entry"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>Save</Button>
          </>
        }
      >
        <Form form={form} layout="vertical" className="grid grid-cols-2 gap-x-4">
          <Form.Item name="type" label="Type" rules={[{ required: true }]} className="col-span-1">
            <Select options={CASH_TYPES.map((t) => ({ value: t, label: t }))} placeholder="Select type" />
          </Form.Item>
          <Form.Item name="direction" label="Direction" rules={[{ required: true }]} className="col-span-1">
            <Select options={[{ value: "Credit", label: "Credit (Cash In)" }, { value: "Debit", label: "Debit (Cash Out)" }]} />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]} className="col-span-2">
            <Input placeholder="e.g. Counter sale – walk-in" />
          </Form.Item>
          <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]} className="col-span-1">
            <InputNumber min={0} className="w-full" placeholder="0.00" />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]} className="col-span-1">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="reference" label="Reference" className="col-span-2">
            <Input placeholder="Optional" />
          </Form.Item>
        </Form>
      </AppModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Cash Entry"
        description={`Delete "${deleteTarget?.label}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
