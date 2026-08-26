import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { Button } from "@/components/common/Button.tsx";
import { settingsData, settingsNav, type CompanySettings } from "@/data/adminData.ts";
import { Panel, PanelBody, PanelHeader } from "@/components/common/Panel.tsx";
import { BusinessBadge } from "@/components/common/Badge";

export default function Settings() {
  const { toggle } = useBusiness();
  const defaults = useMemo(() => settingsData[toggle], [toggle]);

  // Local form state, re-seeded whenever the selected business changes
  // (so switching to Interiors shows the Interiors company details).
  const [form, setForm] = useState<CompanySettings>(defaults);
  useEffect(() => setForm(defaults), [defaults]);

  // Stable handler factory: returns the same function reference for a
  // given field name across renders, so each <input> doesn't get a
  // brand new onChange prop every keystroke.
  const handleChange = useCallback(
    (field: keyof CompanySettings) => (e: ChangeEvent<HTMLInputElement>) => {
      const nextValue = e.target.value;
      setForm((prev) => ({ ...prev, [field]: nextValue }));
    },
    []
  );

  const navItems = useMemo(
    () =>
      settingsNav.map((label, i) => (
        <div
          key={label}
          className={`px-2.5 py-2 rounded-lg text-[13.5px] font-medium cursor-pointer ${
            i === 0 ? "bg-primary-soft text-primary-ink font-semibold" : "text-ink-2 hover:bg-surface-2"
          }`}
        >
          {label}
        </div>
      )),
    []
  );

  return (
    <div className="grid grid-cols-[240px_1fr] gap-4 max-[1100px]:grid-cols-1">
      <Panel className="p-2 h-fit">{navItems}</Panel>

      <Panel>
        <PanelHeader title="Company Details" actions={<BusinessBadge business={toggle} />} />
        <PanelBody>
          <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
            <Field label="Company Name" value={form.name} onChange={handleChange("name")} />
            <Field label="GST Number" value={form.gst} onChange={handleChange("gst")} />
          </div>
          <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1 mt-3.5">
            <Field label="Registered Address" value={form.address} onChange={handleChange("address")} />
            <Field label="Contact Number" value={form.phone} onChange={handleChange("phone")} />
          </div>
          <div className="flex gap-2.5 mt-4">
            <Button variant="primary" size="sm">Save Changes</Button>
            <Button variant="ghost" size="sm">Cancel</Button>
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

/** Small local field component — kept inline since it's only used here. */
function Field({ label, value, onChange }: FieldProps) {
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
