import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { message, Switch } from 'antd';
import { settingsService, databaseBackupService } from '@/services/api';
import { Button } from '@/components/common/Button.tsx';
import { Panel, PanelBody, PanelHeader } from '@/components/common/Panel.tsx';

// ─── Nav sections ──────────────────────────────────────────────────────────
const NAV = [
  'Company Details',
  'Paints Company',
  'Interiors Company',
  'Tax / GST',
  'Invoice Settings',
  'Currency & Units',
  'Notifications',
  'Backup / Data',
] as const;

type NavSection = typeof NAV[number];

// ─── Main Component ────────────────────────────────────────────────────────
export default function Settings() {
  const [active, setActive] = useState<NavSection>('Company Details');
  const [all, setAll] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load all settings once on mount
  useEffect(() => {
    settingsService.getSettings()
      .then(setAll)
      .catch(() => message.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: string) =>
    setAll((prev) => ({ ...prev, [key]: value }));

  const save = async (keys: string[]) => {
    try {
      setSaving(true);
      const updates = Object.fromEntries(keys.map((k) => [k, all[k] ?? '']));
      await settingsService.saveSettings(updates);
      message.success('Settings saved');
    } catch {
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-[220px_1fr] gap-4 max-[1100px]:grid-cols-1">
      {/* Sidebar nav */}
      <Panel className="p-2 h-fit">
        {NAV.map((label) => (
          <div
            key={label}
            onClick={() => setActive(label)}
            className={`px-2.5 py-2 rounded-lg text-[13.5px] font-medium cursor-pointer ${
              active === label
                ? 'bg-primary-soft text-primary-ink font-semibold'
                : 'text-ink-2 hover:bg-surface-2'
            }`}
          >
            {label}
          </div>
        ))}
      </Panel>

      {/* Content panel */}
      <Panel>
        {loading ? (
          <PanelBody><p className="text-sm text-ink-3 py-4">Loading settings…</p></PanelBody>
        ) : (
          <>
            {active === 'Company Details'  && <CompanyDetails   all={all} set={set} save={save} saving={saving} />}
            {active === 'Paints Company'   && <PaintsCompany    all={all} set={set} save={save} saving={saving} />}
            {active === 'Interiors Company'&& <InteriorsCompany all={all} set={set} save={save} saving={saving} />}
            {active === 'Tax / GST'        && <TaxGST           all={all} set={set} save={save} saving={saving} />}
            {active === 'Invoice Settings' && <InvoiceSettings  all={all} set={set} save={save} saving={saving} />}
            {active === 'Currency & Units' && <CurrencyUnits    all={all} set={set} save={save} saving={saving} />}
            {active === 'Notifications'    && <Notifications    all={all} set={set} save={save} saving={saving} />}
            {active === 'Backup / Data'    && <BackupData />}
          </>
        )}
      </Panel>
    </div>
  );
}

// ─── Shared props ──────────────────────────────────────────────────────────
interface SectionProps {
  all: Record<string, string>;
  set: (key: string, value: string) => void;
  save: (keys: string[]) => void;
  saving: boolean;
}

// ─── Field helpers ─────────────────────────────────────────────────────────
function Field({ label, value, onChange }: { label: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-ink-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="border border-border-strong rounded-lg px-2.5 py-2 text-[13.5px] text-ink bg-surface focus:border-primary outline-none"
      />
    </div>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-ink-2">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={3}
        className="border border-border-strong rounded-lg px-2.5 py-2 text-[13.5px] text-ink bg-surface focus:border-primary outline-none resize-none"
      />
    </div>
  );
}

function SaveBar({ keys, save, saving }: { keys: string[]; save: (k: string[]) => void; saving: boolean }) {
  return (
    <div className="flex gap-2.5 mt-5">
      <Button variant="primary" size="sm" onClick={() => save(keys)} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </div>
  );
}

// ─── Section: Company Details (owner / shared info) ───────────────────────
function CompanyDetails({ all, set, save, saving }: SectionProps) {
  const keys = ['owner_name', 'owner_phone2', 'owner_phone3'];
  return (
    <>
      <PanelHeader title="Company Details" subtitle="Proprietor & shared contact information" />
      <PanelBody>
        <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
          <Field label="Owner / Proprietor Name" value={all['owner_name'] ?? ''} onChange={(e) => set('owner_name', e.target.value)} />
          <Field label="Primary Phone"           value={all['paints_phone'] ?? ''} onChange={(e) => set('paints_phone', e.target.value)} />
          <Field label="Secondary Phone"         value={all['owner_phone2'] ?? ''} onChange={(e) => set('owner_phone2', e.target.value)} />
          <Field label="Third Phone"             value={all['owner_phone3'] ?? ''} onChange={(e) => set('owner_phone3', e.target.value)} />
        </div>
        <SaveBar keys={[...keys, 'paints_phone']} save={save} saving={saving} />
      </PanelBody>
    </>
  );
}

// ─── Section: Paints Company ───────────────────────────────────────────────
function PaintsCompany({ all, set, save, saving }: SectionProps) {
  const keys = ['paints_company_name', 'paints_gst', 'paints_address', 'paints_phone', 'paints_email', 'paints_website', 'paints_paint_partner'];
  return (
    <>
      <PanelHeader title="Paints Company" subtitle="RJ Paints & Hardwares details" />
      <PanelBody>
        <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
          <Field label="Company Name"       value={all['paints_company_name']  ?? ''} onChange={(e) => set('paints_company_name', e.target.value)} />
          <Field label="GST Number"         value={all['paints_gst']           ?? ''} onChange={(e) => set('paints_gst', e.target.value)} />
          <Field label="Phone"              value={all['paints_phone']         ?? ''} onChange={(e) => set('paints_phone', e.target.value)} />
          <Field label="Email"              value={all['paints_email']         ?? ''} onChange={(e) => set('paints_email', e.target.value)} />
          <Field label="Website"            value={all['paints_website']       ?? ''} onChange={(e) => set('paints_website', e.target.value)} />
          <Field label="Paint Partnership"  value={all['paints_paint_partner'] ?? ''} onChange={(e) => set('paints_paint_partner', e.target.value)} />
        </div>
        <div className="mt-3.5">
          <Field label="Address" value={all['paints_address'] ?? ''} onChange={(e) => set('paints_address', e.target.value)} />
        </div>
        <SaveBar keys={keys} save={save} saving={saving} />
      </PanelBody>
    </>
  );
}

// ─── Section: Interiors Company ────────────────────────────────────────────
function InteriorsCompany({ all, set, save, saving }: SectionProps) {
  const keys = ['interiors_company_name', 'interiors_gst', 'interiors_address', 'interiors_phone', 'interiors_email', 'interiors_website'];
  return (
    <>
      <PanelHeader title="Interiors Company" subtitle="Styleo Interiors & Construction Works details" />
      <PanelBody>
        <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
          <Field label="Company Name" value={all['interiors_company_name'] ?? ''} onChange={(e) => set('interiors_company_name', e.target.value)} />
          <Field label="GST Number"   value={all['interiors_gst']          ?? ''} onChange={(e) => set('interiors_gst', e.target.value)} />
          <Field label="Phone"        value={all['interiors_phone']        ?? ''} onChange={(e) => set('interiors_phone', e.target.value)} />
          <Field label="Email"        value={all['interiors_email']        ?? ''} onChange={(e) => set('interiors_email', e.target.value)} />
          <Field label="Website"      value={all['interiors_website']      ?? ''} onChange={(e) => set('interiors_website', e.target.value)} />
        </div>
        <div className="mt-3.5">
          <Field label="Address" value={all['interiors_address'] ?? ''} onChange={(e) => set('interiors_address', e.target.value)} />
        </div>
        <SaveBar keys={keys} save={save} saving={saving} />
      </PanelBody>
    </>
  );
}

// ─── Section: Tax / GST ────────────────────────────────────────────────────
function TaxGST({ all, set, save, saving }: SectionProps) {
  const keys = ['tax_default_gst_rate', 'tax_hsn_code_paints', 'tax_hsn_code_hardware', 'tax_hsn_code_interiors'];
  return (
    <>
      <PanelHeader title="Tax / GST" subtitle="GST rates and HSN codes" />
      <PanelBody>
        <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
          <Field label="Default GST Rate (%)"    value={all['tax_default_gst_rate']   ?? '18'} onChange={(e) => set('tax_default_gst_rate', e.target.value)} />
          <Field label="HSN Code — Paints"       value={all['tax_hsn_code_paints']    ?? '3209'} onChange={(e) => set('tax_hsn_code_paints', e.target.value)} />
          <Field label="HSN Code — Hardware"     value={all['tax_hsn_code_hardware']  ?? '8302'} onChange={(e) => set('tax_hsn_code_hardware', e.target.value)} />
          <Field label="HSN Code — Interiors"    value={all['tax_hsn_code_interiors'] ?? '9403'} onChange={(e) => set('tax_hsn_code_interiors', e.target.value)} />
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Switch
            checked={all['tax_gst_registered'] === 'true'}
            onChange={(v) => set('tax_gst_registered', String(v))}
          />
          <span className="text-[13.5px] text-ink">GST Registered Business</span>
        </div>
        <SaveBar keys={[...keys, 'tax_gst_registered']} save={save} saving={saving} />
      </PanelBody>
    </>
  );
}

// ─── Section: Invoice Settings ─────────────────────────────────────────────
function InvoiceSettings({ all, set, save, saving }: SectionProps) {
  const keys = ['invoice_prefix_paints', 'invoice_prefix_interiors', 'invoice_next_number', 'invoice_footer_note', 'invoice_terms'];
  return (
    <>
      <PanelHeader title="Invoice Settings" subtitle="Invoice numbering and print defaults" />
      <PanelBody>
        <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
          <Field label="Invoice Prefix — Paints"    value={all['invoice_prefix_paints']    ?? 'RJ-INV'}  onChange={(e) => set('invoice_prefix_paints', e.target.value)} />
          <Field label="Invoice Prefix — Interiors" value={all['invoice_prefix_interiors'] ?? 'STY-INV'} onChange={(e) => set('invoice_prefix_interiors', e.target.value)} />
          <Field label="Next Invoice Number"        value={all['invoice_next_number']      ?? '1'}       onChange={(e) => set('invoice_next_number', e.target.value)} />
        </div>
        <div className="mt-3.5 flex flex-col gap-3.5">
          <Textarea label="Invoice Footer Note" value={all['invoice_footer_note'] ?? ''} onChange={(e) => set('invoice_footer_note', e.target.value)} />
          <Textarea label="Payment Terms"       value={all['invoice_terms']       ?? ''} onChange={(e) => set('invoice_terms', e.target.value)} />
        </div>
        <SaveBar keys={keys} save={save} saving={saving} />
      </PanelBody>
    </>
  );
}

// ─── Section: Currency & Units ─────────────────────────────────────────────
function CurrencyUnits({ all, set, save, saving }: SectionProps) {
  const keys = ['currency_symbol', 'currency_code', 'default_unit', 'date_format'];
  return (
    <>
      <PanelHeader title="Currency & Units" subtitle="Display format preferences" />
      <PanelBody>
        <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
          <Field label="Currency Symbol" value={all['currency_symbol'] ?? '₹'}          onChange={(e) => set('currency_symbol', e.target.value)} />
          <Field label="Currency Code"   value={all['currency_code']   ?? 'INR'}         onChange={(e) => set('currency_code', e.target.value)} />
          <Field label="Default Unit"    value={all['default_unit']    ?? 'Liter'}       onChange={(e) => set('default_unit', e.target.value)} />
          <Field label="Date Format"     value={all['date_format']     ?? 'DD/MM/YYYY'}  onChange={(e) => set('date_format', e.target.value)} />
        </div>
        <SaveBar keys={keys} save={save} saving={saving} />
      </PanelBody>
    </>
  );
}

// ─── Section: Notifications ────────────────────────────────────────────────
function Notifications({ all, set, save, saving }: SectionProps) {
  const keys = ['notify_low_stock', 'notify_low_stock_email', 'notify_new_sale', 'notify_whatsapp'];
  return (
    <>
      <PanelHeader title="Notifications" subtitle="Alert preferences for stock and sales" />
      <PanelBody>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <div className="text-[13.5px] font-semibold text-ink">Low Stock Alerts</div>
              <div className="text-xs text-ink-3">Get notified when stock falls below minimum level</div>
            </div>
            <Switch
              checked={all['notify_low_stock'] === 'true'}
              onChange={(v) => set('notify_low_stock', String(v))}
            />
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <div className="text-[13.5px] font-semibold text-ink">New Sale Alerts</div>
              <div className="text-xs text-ink-3">Get notified when a new sale invoice is created</div>
            </div>
            <Switch
              checked={all['notify_new_sale'] === 'true'}
              onChange={(v) => set('notify_new_sale', String(v))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1 mt-2">
            <Field label="Alert Email"           value={all['notify_low_stock_email'] ?? ''} onChange={(e) => set('notify_low_stock_email', e.target.value)} />
            <Field label="WhatsApp Alert Number" value={all['notify_whatsapp']        ?? ''} onChange={(e) => set('notify_whatsapp', e.target.value)} />
          </div>
        </div>
        <SaveBar keys={keys} save={save} saving={saving} />
      </PanelBody>
    </>
  );
}

// ─── Section: Backup / Data ────────────────────────────────────────────────
function BackupData() {
  const handleExport = () => {
    const json = databaseBackupService.exportDatabaseJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rj-paints-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Backup downloaded');
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = databaseBackupService.restoreDatabaseJSON(ev.target?.result as string);
      ok ? message.success('Data restored successfully') : message.error('Invalid backup file');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      <PanelHeader title="Backup / Data" subtitle="Export and restore your local data" />
      <PanelBody>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-2">
            <div>
              <div className="text-[13.5px] font-semibold text-ink">Export Database Backup</div>
              <div className="text-xs text-ink-3 mt-0.5">Download a full JSON snapshot of all local data</div>
            </div>
            <Button variant="primary" size="sm" onClick={handleExport}>Download Backup</Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-2">
            <div>
              <div className="text-[13.5px] font-semibold text-ink">Restore from Backup</div>
              <div className="text-xs text-ink-3 mt-0.5">Upload a previously exported JSON backup file</div>
            </div>
            <label className="cursor-pointer">
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg border border-border text-[13px] font-medium text-ink hover:bg-surface-2">
                Choose File
              </span>
            </label>
          </div>
        </div>
      </PanelBody>
    </>
  );
}
