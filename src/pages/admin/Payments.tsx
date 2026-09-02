import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Form, Input, InputNumber, Select, DatePicker, message } from "antd";
import dayjs from "dayjs";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { paymentService, type ApiPaymentRecord } from "@/services/api";
import { Toolbar, SearchBox } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { Badge } from "@/components/common/Badge.tsx";
import { KpiRow } from "@/components/common/KpiCard";
import { DataTable } from "@/components/common/DataTable";
import { AppModal } from "@/components/common/AppModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { TableColumn, KpiItem } from "@/types/types";

const COLUMNS: TableColumn[] = [
  { key: "refNumber", label: "Ref #" },
  { key: "date", label: "Date" },
  { key: "type", label: "Type" },
  { key: "party", label: "Party" },
  { key: "paymentMode", label: "Mode" },
  { key: "amount", label: "Amount", align: "num" },
  { key: "actions", label: "", align: "num" },
];

const PAYMENT_MODES = ["Cash", "Bank", "UPI", "Cheque", "NEFT/RTGS", "Credit"];

export default function Payments() {
  const { toggle } = useBusiness();
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [rows, setRows] = useState<ApiPaymentRecord[]>([]);
  const [pagination, setPagination] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiPaymentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiPaymentRecord | null>(null);
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
      const res = await paymentService.getAll({
        business: toggle.toUpperCase(),
        search: debouncedSearch || undefined,
      });
      setKpis(res.kpis);
      setRows(res.rows);
      setPagination(res.pagination);
    } catch {
      message.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [toggle, debouncedSearch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    // Auto-generate ref number
    form.setFieldValue("refNumber", `REF-${Date.now().toString().slice(-6)}`);
    setModalOpen(true);
  };

  const openEdit = (row: ApiPaymentRecord) => {
    setEditing(row);
    form.setFieldsValue({
      refNumber: row.refNumber,
      type: row.type,
      party: row.party,
      paymentMode: row.paymentMode,
      amount: row.amountRaw,
      date: dayjs(row.date, "DD MMM YYYY"),
      notes: row.notes,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = {
        refNumber: values.refNumber,
        date: values.date.toISOString(),
        type: values.type,
        party: values.party,
        paymentMode: values.paymentMode,
        amount: values.amount,
        notes: values.notes || undefined,
        business: toggle.toUpperCase(),
      };
      if (editing) {
        await paymentService.update(editing.id, payload);
        message.success("Payment updated");
      } else {
        await paymentService.create(payload);
        message.success("Payment recorded");
      }
      setModalOpen(false);
      fetchAll();
    } catch {
      message.error("Failed to save payment");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await paymentService.remove(deleteTarget.id);
      message.success("Payment deleted");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      message.error("Failed to delete");
    }
  };

  const tableRows = rows.map((r) => ({
    id: r.id,
    refNumber: <span className="font-mono">{r.refNumber}</span>,
    date: r.date,
    type: <Badge tone={r.type === "Receipt" ? "success" : "warn"}>{r.type}</Badge>,
    party: r.party,
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
        left={<SearchBox value={search} onChange={handleSearch} placeholder="Search payments…" />}
        right={
          <>
            <Button variant="ghost" size="sm" icon={Plus} onClick={() => { setEditing(null); form.resetFields(); form.setFieldValue("type", "Payment"); form.setFieldValue("refNumber", `PAY-${Date.now().toString().slice(-6)}`); setModalOpen(true); }}>Record Payment</Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => { setEditing(null); form.resetFields(); form.setFieldValue("type", "Receipt"); form.setFieldValue("refNumber", `RCT-${Date.now().toString().slice(-6)}`); setModalOpen(true); }}>Record Receipt</Button>
          </>
        }
      />
      <DataTable
        columns={COLUMNS}
        rows={tableRows}
        loading={loading}
        title="Payments & Receipts"
        subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business`}
        paginationText={pagination}
      />

      <AppModal
        open={modalOpen}
        title={editing ? "Edit Payment" : "Record Payment / Receipt"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>{editing ? "Update" : "Save"}</Button>
          </>
        }
      >
        <Form form={form} layout="vertical" className="grid grid-cols-2 gap-x-4">
          <Form.Item name="refNumber" label="Reference #" rules={[{ required: true }]} className="col-span-1">
            <Input placeholder="e.g. RCT-001" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]} className="col-span-1">
            <Select options={[{ value: "Receipt", label: "Receipt (Money In)" }, { value: "Payment", label: "Payment (Money Out)" }]} />
          </Form.Item>
          <Form.Item name="party" label="Party Name" rules={[{ required: true }]} className="col-span-2">
            <Input placeholder="e.g. Asian Paints Depot" />
          </Form.Item>
          <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true }]} className="col-span-1">
            <Select options={PAYMENT_MODES.map((m) => ({ value: m, label: m }))} />
          </Form.Item>
          <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]} className="col-span-1">
            <InputNumber min={0} className="w-full" placeholder="0.00" />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]} className="col-span-1">
            <DatePicker className="w-full" format="DD/MM/YYYY" defaultValue={dayjs()} />
          </Form.Item>
          <Form.Item name="notes" label="Notes" className="col-span-2">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </AppModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Payment"
        description={`Delete "${deleteTarget?.refNumber}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
