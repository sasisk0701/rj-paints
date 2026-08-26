import { memo, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Search, Bell } from "lucide-react";
import { NAV_BY_KEY } from "@/constants/nav";
import { BusinessSwitch } from "./BusinessSwitch.tsx";
import { Avatar } from "@/components/common/Swatch.tsx";

/**
 * Topbar
 */
function TopbarBase() {
  const location = useLocation();

  const { title, crumb } = useMemo(() => {
    const key = location.pathname.replace("/", "") || "dashboard";
    const item = NAV_BY_KEY[key];
    return {
      title: item ? item.label : "Dashboard",
      crumb: item ? item.label : "Overview / Dashboard",
    };
  }, [location.pathname]);

  return (
    <header className="h-16 flex-none bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 gap-4">
      <div className="min-w-0">
        <div className="text-[17px] font-semibold font-display truncate">
          {title}
        </div>
        <div className="text-xs text-ink-3">{crumb}</div>
      </div>

      <BusinessSwitch />

      <div className="flex items-center gap-3 flex-none">
        <div className="hidden md:flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-2.5 py-[7px] w-[220px] text-ink-3">
          <Search size={14} />
          <span className="text-xs">Search products, orders…</span>
        </div>
        <button
          type="button"
          className="w-[34px] h-[34px] rounded-lg border border-border bg-surface flex items-center justify-center text-ink-2 hover:bg-surface-2"
        >
          <Bell size={16} />
        </button>
        <Avatar initials="SK" size={34} />
      </div>
    </header>
  );
}

export const Topbar = memo(TopbarBase);
