import { useState } from "react";
import { DatePicker, Select } from "antd";
import type { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

type DateFilterMode = "single" | "range";

export interface FinanceDateFilterValue {
  from?: string;
  to?: string;
}

interface FinanceDateFilterProps {
  onChange: (value: FinanceDateFilterValue) => void;
}

/**
 * Shared date filter for Finance pages.
 * Single date is sent as a full-day from/to window; range uses the
 * selected start/end days. This matches the existing finance API filters.
 */
export function FinanceDateFilter({ onChange }: FinanceDateFilterProps) {
  const [mode, setMode] = useState<DateFilterMode>("single");
  const [singleDate, setSingleDate] = useState<Dayjs | null>(null);
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const clearFilter = () => {
    setSingleDate(null);
    setRange(null);
    onChange({});
  };

  const handleModeChange = (value: DateFilterMode) => {
    setMode(value);
    clearFilter();
  };

  const handleSingleDate = (value: Dayjs | null) => {
    setSingleDate(value);
    if (!value) {
      onChange({});
      return;
    }
    onChange({
      from: value.startOf("day").toISOString(),
      to: value.endOf("day").toISOString(),
    });
  };

  const handleRange = (value: [Dayjs | null, Dayjs | null] | null) => {
    setRange(value);
    const [from, to] = value ?? [];
    if (!from || !to) {
      onChange({});
      return;
    }
    onChange({
      from: from.startOf("day").toISOString(),
      to: to.endOf("day").toISOString(),
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select<DateFilterMode>
        value={mode}
        onChange={handleModeChange}
        className="w-[125px]"
        options={[
          { value: "single", label: "Single date" },
          { value: "range", label: "Date range" },
        ]}
      />
      {mode === "single" ? (
        <DatePicker
          value={singleDate}
          onChange={handleSingleDate}
          format="DD/MM/YYYY"
          placeholder="Select date"
          allowClear
          className="w-[145px]"
        />
      ) : (
        <RangePicker
          value={range}
          onChange={(value) => handleRange(value as [Dayjs | null, Dayjs | null] | null)}
          format="DD/MM/YYYY"
          placeholder={["From date", "To date"]}
          allowClear
        />
      )}
    </div>
  );
}
