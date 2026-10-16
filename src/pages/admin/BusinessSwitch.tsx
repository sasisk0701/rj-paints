import { memo } from "react";

function BusinessSwitchBase() {
  return (
    <div className="flex items-center rounded-full p-[3px] gap-0.5 flex-none border border-slate-200 bg-slate-100">
      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-paints shadow-sm" style={{ backgroundColor: "#D1FAE5" }}>
        Paints
      </span>
    </div>
  );
}

export const BusinessSwitch = memo(BusinessSwitchBase);
