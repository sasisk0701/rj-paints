import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Form, Input, InputNumber, Select, DatePicker, message } from "antd";
import dayjs from "dayjs";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { cashService } from "@/services/api";
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
  { key: "type", label: "Type" },
  { key: "description", label: "Description" },
  { key: "amount", label: "Amount", align: "num" },
  { key: "direction", label: "Dir." },
  { key: "actions", label: "", align: "num" },
];

const CASH_TYPES = ["Cash In", "Cash Out", "Petty Cash", "Counter Sale", "Advance", "Refund", "Other"];

export default function Cash() {
  const { toggle } = useBusiness();
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [pagination, setPagination] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
      const res = await cashService.getAll({ business: toggle.toUpperCase() });
      setKpis(res.kpis);
      setRows(res.rows);
      setPagination(res.pagination);
    } catch {
      message.error("Failed to load cash transactions");
    } finally {
      setLoading(false);
    }
  }, [toggle]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredRows = debouncedSearch
    ? rows.filter(r => r.description.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : rows;

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
      <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget({ id: r.id, label: r.description })} />
    ),
  }));

  return (
    <div>
      <KpiRow items={kpis} />
      <Toolbar
        left={<SearchBox value={search} onChange={handleSearch} placeholder="Search cash entries…" />}
        right={<Button variant="primary" size="sm" icon={Plus} onClick={() => { form.resetFields(); setModalOpen(true); }}>Record Cash Entry</Button>}
      />
      <DataTable
        columns={COLUMNS}
        rows={tableRows}
        loading={loading}
        title="Cash Transaction History"
        subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business`}
        paginationText={pagination}
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
            <DatePicker className="w-full" format="DD/MM/YYYY" defaultValue={dayjs()} />
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
