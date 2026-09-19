import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Pencil, Plus, Save, Trash2, UsersRound } from 'lucide-react';
import { DatePicker, Form, Input, InputNumber, Select, Tabs, message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useBusiness } from '@/hooks/useBusiness.ts';
import {
  staffService,
  type ApiStaff,
  type ApiStaffBusiness,
  type ApiStaffWorkLog,
} from '@/services/api';
import { Toolbar, SearchBox } from '@/components/common/Toolbar.tsx';
import { Button } from '@/components/common/Button.tsx';
import { Badge } from '@/components/common/Badge.tsx';
import { KpiRow } from '@/components/common/KpiCard';
import { DataTable } from '@/components/common/DataTable';
import { AppModal } from '@/components/common/AppModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Panel, PanelBody, PanelHeader } from '@/components/common/Panel';
import type { TableColumn } from '@/types/types';

const STAFF_COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Staff' },
  { key: 'phone', label: 'Phone' },
  { key: 'designation', label: 'Designation' },
  { key: 'business', label: 'Business' },
  { key: 'dailyRate', label: 'Daily Rate', align: 'num' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', align: 'num' },
];

const HISTORY_COLUMNS: TableColumn[] = [
  { key: 'date', label: 'Date' },
  { key: 'staff', label: 'Staff' },
  { key: 'designation', label: 'Designation' },
  { key: 'hours', label: 'Hours', align: 'num' },
  { key: 'workType', label: 'Work Type' },
  { key: 'notes', label: 'Notes' },
];

type DailyEntry = {
  hoursWorked: number;
  workType: string;
  notes: string;
};

const emptyEntry = (): DailyEntry => ({
  hoursWorked: 0,
  workType: '',
  notes: '',
});

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.error || error?.message || fallback;

export default function StaffMaintenance() {
  const { toggle } = useBusiness();
  const business = toggle.toUpperCase() as 'PAINTS' | 'INTERIORS';

  const [activeTab, setActiveTab] = useState('staff');
  const [staff, setStaff] = useState<ApiStaff[]>([]);
  const [dailyLogs, setDailyLogs] = useState<ApiStaffWorkLog[]>([]);
  const [historyLogs, setHistoryLogs] = useState<ApiStaffWorkLog[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingDaily, setSavingDaily] = useState(false);
  const [search, setSearch] = useState('');
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<ApiStaff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiStaff | null>(null);
  const [savingStaff, setSavingStaff] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState(false);
  const [workDate, setWorkDate] = useState<Dayjs>(dayjs());
  const [dailyEntries, setDailyEntries] = useState<Record<string, DailyEntry>>({});
  const [historyRange, setHistoryRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs(),
  ]);
  const [historyStaffId, setHistoryStaffId] = useState<string | undefined>();
  const [staffForm] = Form.useForm();

  const loadStaff = useCallback(async () => {
    setLoadingStaff(true);
    try {
      const rows = await staffService.getAll({ business });
      setStaff(rows);
    } catch (error) {
      message.error(getErrorMessage(error, 'Failed to load staff'));
    } finally {
      setLoadingStaff(false);
    }
  }, [business]);

  const loadDaily = useCallback(async () => {
    setLoadingDaily(true);
    try {
      const rows = await staffService.getLogs({
        business,
        date: workDate.format('YYYY-MM-DD'),
      });
      setDailyLogs(rows);
    } catch (error) {
      message.error(getErrorMessage(error, 'Failed to load daily staff records'));
    } finally {
      setLoadingDaily(false);
    }
  }, [business, workDate]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const rows = await staffService.getLogs({
        business,
        from: historyRange[0].format('YYYY-MM-DD'),
        to: historyRange[1].format('YYYY-MM-DD'),
        ...(historyStaffId ? { staffId: historyStaffId } : {}),
      });
      setHistoryLogs(rows);
    } catch (error) {
      message.error(getErrorMessage(error, 'Failed to load staff history'));
    } finally {
      setLoadingHistory(false);
    }
  }, [business, historyRange, historyStaffId]);

  useEffect(() => {
    setSearch('');
    setHistoryStaffId(undefined);
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    if (activeTab === 'daily') loadDaily();
  }, [activeTab, loadDaily]);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
  }, [activeTab, loadHistory]);

  useEffect(() => {
    const logByStaff = new Map(dailyLogs.map((log) => [log.staffId, log]));
    const nextEntries: Record<string, DailyEntry> = {};
    staff
      .filter((item) => item.status !== 'INACTIVE')
      .forEach((item) => {
        const log = logByStaff.get(item.id);
        nextEntries[item.id] = log
          ? {
              hoursWorked: Number(log.hoursWorked || 0),
              workType: log.workType || '',
              notes: log.notes || '',
            }
          : emptyEntry();
      });
    setDailyEntries(nextEntries);
  }, [dailyLogs, staff, workDate]);

  const activeStaff = useMemo(
    () => staff.filter((item) => item.status !== 'INACTIVE'),
    [staff]
  );

  const filteredStaff = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return staff;
    return staff.filter((item) =>
      [item.name, item.phone || '', item.designation || '']
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [search, staff]);

  const totalDailyHours = useMemo(
    () => activeStaff.reduce((sum, item) => sum + Number(dailyEntries[item.id]?.hoursWorked || 0), 0),
    [activeStaff, dailyEntries]
  );

  const staffWithHours = useMemo(
    () => activeStaff.filter((item) => Number(dailyEntries[item.id]?.hoursWorked || 0) > 0).length,
    [activeStaff, dailyEntries]
  );

  const averageHours = staffWithHours ? totalDailyHours / staffWithHours : 0;

  const kpis = useMemo(() => [
    {
      label: 'Active Staff',
      value: String(activeStaff.length),
      delta: toggle === 'paints' ? 'Paints staff' : 'Interiors staff',
      deltaTone: 'neutral' as const,
    },
    {
      label: 'Working Today',
      value: String(staffWithHours),
      delta: workDate.format('DD MMM YYYY'),
      deltaTone: staffWithHours > 0 ? 'up' as const : 'neutral' as const,
    },
    {
      label: 'Hours Today',
      value: totalDailyHours.toFixed(totalDailyHours % 1 === 0 ? 0 : 1),
      delta: 'Total entered hours',
      deltaTone: 'neutral' as const,
    },
    {
      label: 'Avg. Hours',
      value: averageHours.toFixed(1),
      delta: staffWithHours ? 'Per working staff' : 'No hours entered',
      deltaTone: 'neutral' as const,
    },
  ], [activeStaff.length, averageHours, staffWithHours, toggle, totalDailyHours, workDate]);

  const openAddStaff = () => {
    setEditingStaff(null);
    staffForm.resetFields();
    staffForm.setFieldsValue({
      business,
      status: 'ACTIVE',
      dailyRate: null,
    });
    setStaffModalOpen(true);
  };

  const openEditStaff = (item: ApiStaff) => {
    setEditingStaff(item);
    staffForm.setFieldsValue({
      name: item.name,
      phone: item.phone || '',
      designation: item.designation || '',
      business: item.business,
      dailyRate: item.dailyRate ?? null,
      status: item.status || 'ACTIVE',
    });
    setStaffModalOpen(true);
  };

  const handleSaveStaff = async () => {
    try {
      const values = await staffForm.validateFields();
      setSavingStaff(true);
      const payload = {
        name: values.name.trim(),
        phone: values.phone?.trim() || '',
        designation: values.designation?.trim() || '',
        business: values.business as ApiStaffBusiness,
        dailyRate: values.dailyRate ?? null,
        status: values.status,
      };

      if (editingStaff) {
        await staffService.update(editingStaff.id, payload);
        message.success('Staff updated');
      } else {
        await staffService.create(payload);
        message.success('Staff added');
      }

      setStaffModalOpen(false);
      staffForm.resetFields();
      await loadStaff();
      if (activeTab === 'daily') await loadDaily();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(getErrorMessage(error, 'Failed to save staff'));
    } finally {
      setSavingStaff(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteTarget) return;
    setDeletingStaff(true);
    try {
      await staffService.remove(deleteTarget.id);
      message.success('Staff removed');
      setDeleteTarget(null);
      await loadStaff();
      if (activeTab === 'daily') await loadDaily();
    } catch (error) {
      message.error(getErrorMessage(error, 'Failed to remove staff'));
    } finally {
      setDeletingStaff(false);
    }
  };

  const updateDailyEntry = (staffId: string, patch: Partial<DailyEntry>) => {
    setDailyEntries((current) => ({
      ...current,
      [staffId]: {
        ...(current[staffId] || emptyEntry()),
        ...patch,
      },
    }));
  };

  const handleSaveDaily = async () => {
    if (!activeStaff.length) {
      message.warning('Add at least one staff member first');
      return;
    }

    setSavingDaily(true);
    try {
      await staffService.saveDaily({
        workDate: workDate.format('YYYY-MM-DD'),
        records: activeStaff.map((item) => {
          const entry = dailyEntries[item.id] || emptyEntry();
          return {
            staffId: item.id,
            hoursWorked: Number(entry.hoursWorked || 0),
            workType: entry.workType.trim(),
            notes: entry.notes.trim(),
          };
        }),
      });
      message.success(`Daily staff records saved for ${workDate.format('DD MMM YYYY')}`);
      await loadDaily();
    } catch (error) {
      message.error(getErrorMessage(error, 'Failed to save daily staff records'));
    } finally {
      setSavingDaily(false);
    }
  };

  const staffRows = filteredStaff.map((item) => ({
    id: item.id,
    name: (
      <div>
        <div className="font-semibold text-ink">{item.name}</div>
        <div className="text-[11px] text-ink-3">{item.id.slice(0, 8).toUpperCase()}</div>
      </div>
    ),
    phone: item.phone || '—',
    designation: item.designation || '—',
    business: (
      <Badge tone={item.business === 'PAINTS' ? 'paints' : item.business === 'INTERIORS' ? 'interiors' : 'neutral'}>
        {item.business === 'PAINTS' ? 'Paints' : item.business === 'INTERIORS' ? 'Interiors' : 'Both'}
      </Badge>
    ),
    dailyRate: item.dailyRate == null ? '—' : `₹${Number(item.dailyRate).toLocaleString('en-IN')}`,
    status: <Badge tone={item.status === 'ACTIVE' ? 'success' : 'neutral'}>{item.status}</Badge>,
    actions: (
      <div className="flex gap-1 justify-end">
        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEditStaff(item)}>Edit</Button>
        <Button variant="dangerGhost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(item)} />
      </div>
    ),
  }));

  const historyRows = historyLogs.map((log) => ({
    id: log.id,
    date: dayjs(log.workDate).format('DD MMM YYYY'),
    staff: <span className="font-semibold">{log.staff?.name || '—'}</span>,
    designation: log.staff?.designation || '—',
    hours: <span className="font-semibold">{Number(log.hoursWorked).toFixed(Number(log.hoursWorked) % 1 === 0 ? 0 : 1)} hrs</span>,
    workType: log.workType || '—',
    notes: log.notes || '—',
  }));

  const staffTab = (
    <>
      <Toolbar
        left={
          <SearchBox
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search staff name, phone…"
          />
        }
        right={
          <Button variant="primary" size="sm" icon={Plus} onClick={openAddStaff}>
            Add Staff
          </Button>
        }
      />

      {staff.length === 0 && !loadingStaff ? (
        <Panel>
          <PanelBody className="py-14 text-center">
            <UsersRound size={34} className="mx-auto text-ink-3 mb-3" />
            <div className="font-semibold text-ink">No staff added yet</div>
            <div className="text-sm text-ink-3 mt-1 mb-4">
              Create staff members for the {toggle === 'paints' ? 'Paints' : 'Interiors'} business.
            </div>
            <Button variant="primary" size="sm" icon={Plus} onClick={openAddStaff}>Add First Staff</Button>
          </PanelBody>
        </Panel>
      ) : (
        <DataTable
          columns={STAFF_COLUMNS}
          rows={staffRows}
          title="Staff List"
          subtitle={`${staffRows.length} staff member${staffRows.length === 1 ? '' : 's'} shown`}
          loading={loadingStaff}
          paginationText={`Showing ${staffRows.length} staff member${staffRows.length === 1 ? '' : 's'}`}
        />
      )}
    </>
  );

  const dailyTab = (
    <div className="space-y-4">
      <Toolbar
        left={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-2">Work Date</span>
            <DatePicker
              value={workDate}
              onChange={(value) => value && setWorkDate(value)}
              format="DD MMM YYYY"
              allowClear={false}
            />
          </div>
        }
        right={
          <Button
            variant="primary"
            size="sm"
            icon={Save}
            loading={savingDaily}
            disabled={!activeStaff.length}
            onClick={handleSaveDaily}
          >
            Save Daily Records
          </Button>
        }
      />

      <Panel>
        <PanelHeader
          title="Daily Work Entry"
          subtitle={`${workDate.format('DD MMM YYYY')} · ${toggle === 'paints' ? 'Paints' : 'Interiors'} staff`}
        />
        {loadingDaily ? (
          <PanelBody className="py-14 text-center text-sm text-ink-3">Loading daily records…</PanelBody>
        ) : activeStaff.length === 0 ? (
          <PanelBody className="py-14 text-center">
            <div className="font-semibold text-ink">No active staff found</div>
            <div className="text-sm text-ink-3 mt-1 mb-4">Add staff before entering daily working hours.</div>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => { setActiveTab('staff'); openAddStaff(); }}>
              Add Staff
            </Button>
          </PanelBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-surface-2">
                  <th className="text-left px-4 py-3 border-b border-border text-[11px] uppercase tracking-wide text-ink-3">Staff</th>
                  <th className="text-left px-4 py-3 border-b border-border text-[11px] uppercase tracking-wide text-ink-3 w-[150px]">Hours</th>
                  <th className="text-left px-4 py-3 border-b border-border text-[11px] uppercase tracking-wide text-ink-3 min-w-[190px]">Work Type</th>
                  <th className="text-left px-4 py-3 border-b border-border text-[11px] uppercase tracking-wide text-ink-3 min-w-[260px]">Notes</th>
                </tr>
              </thead>
              <tbody>
                {activeStaff.map((item) => {
                  const entry = dailyEntries[item.id] || emptyEntry();
                  return (
                    <tr key={item.id} className="hover:bg-surface-2/60">
                      <td className="px-4 py-3 border-b border-border align-middle">
                        <div className="font-semibold text-ink">{item.name}</div>
                        <div className="text-[11px] text-ink-3">{item.designation || 'Staff'} · {item.business === 'BOTH' ? 'Both' : item.business === 'PAINTS' ? 'Paints' : 'Interiors'}</div>
                      </td>
                      <td className="px-4 py-3 border-b border-border align-middle">
                        <InputNumber
                          min={0}
                          max={24}
                          step={0.5}
                          value={entry.hoursWorked}
                          onChange={(value) => updateDailyEntry(item.id, { hoursWorked: Number(value || 0) })}
                          addonAfter="hrs"
                          style={{ width: 125 }}
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-border align-middle">
                        <Input
                          value={entry.workType}
                          onChange={(event) => updateDailyEntry(item.id, { workType: event.target.value })}
                          placeholder="Painting / Site work / Office…"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-border align-middle">
                        <Input
                          value={entry.notes}
                          onChange={(event) => updateDailyEntry(item.id, { notes: event.target.value })}
                          placeholder="Optional notes"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );

  const historyTab = (
    <>
      <Toolbar
        left={
          <>
            <DatePicker.RangePicker
              value={historyRange}
              allowClear={false}
              format="DD MMM YYYY"
              onChange={(value) => {
                if (value?.[0] && value?.[1]) setHistoryRange([value[0], value[1]]);
              }}
            />
            <Select
              allowClear
              value={historyStaffId}
              onChange={setHistoryStaffId}
              placeholder="All staff"
              style={{ width: 190 }}
              options={staff.map((item) => ({ label: item.name, value: item.id }))}
            />
          </>
        }
        right={
          <Button variant="ghost" size="sm" icon={CalendarDays} onClick={loadHistory}>
            Refresh
          </Button>
        }
      />

      <DataTable
        columns={HISTORY_COLUMNS}
        rows={historyRows}
        title="Work History"
        subtitle={`${historyRange[0].format('DD MMM YYYY')} - ${historyRange[1].format('DD MMM YYYY')}`}
        loading={loadingHistory}
        paginationText={`Showing ${historyRows.length} daily record${historyRows.length === 1 ? '' : 's'}`}
      />
    </>
  );

  return (
    <div>
      <KpiRow items={kpis} />

      <Panel className="mb-4">
        <div className="px-5 pt-2">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'staff', label: <span className="inline-flex items-center gap-1.5"><UsersRound size={14} />Staff List</span> },
              { key: 'daily', label: <span className="inline-flex items-center gap-1.5"><Clock3 size={14} />Daily Work</span> },
              { key: 'history', label: <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />History</span> },
            ]}
          />
        </div>
      </Panel>

      {activeTab === 'staff' ? staffTab : activeTab === 'daily' ? dailyTab : historyTab}

      <AppModal
        open={staffModalOpen}
        title={editingStaff ? 'Edit Staff' : 'Add Staff'}
        subtitle={editingStaff ? `Editing ${editingStaff.name}` : 'Create a staff member for daily work tracking'}
        onClose={() => {
          setStaffModalOpen(false);
          setEditingStaff(null);
          staffForm.resetFields();
        }}
        onConfirm={handleSaveStaff}
        confirmText={editingStaff ? 'Save Changes' : 'Add Staff'}
        loading={savingStaff}
        width={620}
      >
        <Form form={staffForm} layout="vertical">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              name="name"
              label="Staff Name"
              rules={[{ required: true, message: 'Staff name is required' }]}
              className="col-span-2"
            >
              <Input placeholder="Enter staff name" />
            </Form.Item>

            <Form.Item name="phone" label="Phone">
              <Input maxLength={15} placeholder="9876543210" />
            </Form.Item>

            <Form.Item name="designation" label="Designation">
              <Input placeholder="Painter / Carpenter / Supervisor" />
            </Form.Item>

            <Form.Item name="business" label="Business" rules={[{ required: true, message: 'Business is required' }]}>
              <Select
                options={[
                  { label: 'Paints', value: 'PAINTS' },
                  { label: 'Interiors', value: 'INTERIORS' },
                  { label: 'Both', value: 'BOTH' },
                ]}
              />
            </Form.Item>

            <Form.Item name="dailyRate" label="Daily Rate (₹)">
              <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="Optional" />
            </Form.Item>

            <Form.Item name="status" label="Status" rules={[{ required: true }]} className="col-span-2">
              <Select
                options={[
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'Inactive', value: 'INACTIVE' },
                ]}
              />
            </Form.Item>
          </div>
        </Form>
      </AppModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Remove "${deleteTarget?.name || ''}"?`}
        description="The staff member will be marked inactive and hidden from daily entry. Existing work history is retained."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteStaff}
        loading={deletingStaff}
        confirmText="Remove Staff"
      />
    </div>
  );
}
