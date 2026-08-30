import { useEffect, useState, useMemo } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { message, Select } from 'antd';
import { useBusiness } from '@/hooks/useBusiness.ts';
import { activityLogService } from '@/services/api';
import { Toolbar, FilterChip } from '@/components/common/Toolbar.tsx';
import { Button } from '@/components/common/Button.tsx';
import { DataTable } from '@/components/common/DataTable.tsx';
import { Badge } from '@/components/common/Badge.tsx';
import type { TableColumn, Tone } from '@/types/types.ts';

interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  reference: string | null;
  business: string;
  createdAt: string;
}

const COLUMNS: TableColumn[] = [
  { key: 'time',      label: 'Timestamp' },
  { key: 'user',      label: 'User' },
  { key: 'action',    label: 'Action' },
  { key: 'module',    label: 'Module' },
  { key: 'reference', label: 'Reference' },
];

// Map module name → badge tone
const MODULE_TONE: Record<string, Tone> = {
  Auth:           'neutral',
  Administration: 'paints',
  Catalog:        'success',
  Inventory:      'warn',
  Trade:          'interiors',
  Finance:        'danger',
};

const ALL_MODULES = ['Auth', 'Administration', 'Catalog', 'Inventory', 'Trade', 'Finance'];

export default function ActivityLog() {
  const { toggle } = useBusiness();

  const [logs, setLogs]         = useState<LogEntry[]>([]);
  const [users, setUsers]       = useState<{ userId: string; userName: string }[]>([]);
  const [loading, setLoading]   = useState(true);
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [userFilter, setUserFilter]     = useState<string>('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await activityLogService.getLogs({
        business: toggle,
        module:   moduleFilter || undefined,
        userId:   userFilter   || undefined,
      });
      setLogs(data);
    } catch {
      message.error('Failed to load activity log');
    } finally {
      setLoading(false);
    }
  };

  // Load distinct users for filter dropdown once
  useEffect(() => {
    activityLogService.getLogUsers().then(setUsers).catch(() => {});
  }, []);

  // Refetch whenever toggle or filters change
  useEffect(() => { fetchLogs(); }, [toggle, moduleFilter, userFilter]);

  const rows = useMemo(() =>
    logs.map((l) => ({
      id: l.id,
      time: new Date(l.createdAt).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
      user: (
        <span className="font-medium text-ink">{l.userName}</span>
      ),
      action: (
        <Badge tone={MODULE_TONE[l.module] ?? 'neutral'}>{l.action}</Badge>
      ),
      module: (
        <span className="text-xs font-semibold text-ink-3 uppercase tracking-wide">{l.module}</span>
      ),
      reference: (
        <span className="font-mono text-[12px] text-ink-2">{l.reference ?? '—'}</span>
      ),
    })),
  [logs]);

  const handleExport = () => {
    if (!logs.length) { message.warning('No logs to export'); return; }
    const header = 'Timestamp,User,Action,Module,Reference\n';
    const csv = logs.map((l) =>
      `"${new Date(l.createdAt).toLocaleString('en-IN')}","${l.userName}","${l.action}","${l.module}","${l.reference ?? ''}"`
    ).join('\n');
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `activity-log-${toggle}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Log exported');
  };

  return (
    <div>
      <Toolbar
        left={
          <>
            {/* Module filter */}
            <Select
              placeholder="All Modules"
              allowClear
              size="small"
              style={{ width: 160 }}
              value={moduleFilter || undefined}
              onChange={(v) => setModuleFilter(v ?? '')}
              options={ALL_MODULES.map((m) => ({ label: m, value: m }))}
            />

            {/* User filter */}
            <Select
              placeholder="All Users"
              allowClear
              size="small"
              style={{ width: 160 }}
              value={userFilter || undefined}
              onChange={(v) => setUserFilter(v ?? '')}
              options={users.map((u) => ({ label: u.userName, value: u.userId }))}
            />

            <FilterChip>{toggle === 'paints' ? 'Paints' : 'Interiors'}</FilterChip>
          </>
        }
        right={
          <>
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchLogs}>
              Refresh
            </Button>
            <Button variant="ghost" size="sm" icon={Download} onClick={handleExport}>
              Export CSV
            </Button>
          </>
        }
      />

      <DataTable
        columns={COLUMNS}
        rows={rows}
        title="Activity Log"
        subtitle={`${logs.length} event${logs.length !== 1 ? 's' : ''} · ${toggle === 'paints' ? 'Paints' : 'Interiors'} business`}
        paginationText={`Showing ${logs.length} recent events`}
      />
    </div>
  );
}
