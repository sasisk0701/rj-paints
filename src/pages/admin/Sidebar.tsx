import { memo, useMemo } from "react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { NAV_GROUPS, NAV_BY_KEY } from "@/constants/nav";
import { Avatar } from "@/components/common/Swatch.tsx";

/**
 * Sidebar
 */
function SidebarBase() {
  const groups = useMemo(
    () =>
      NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-3 px-2.5 pt-4 pb-1.5">
            {group.label}
          </div>
          <div className="flex flex-col gap-px px-1">
            {group.keys.map((key) => {
              const item = NAV_BY_KEY[key];
              const Icon = item.icon;
              return (
                <NavLink
                  key={key}
                  to={`/admin/${key}`}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-medium",
                      isActive
                        ? "bg-primary-soft text-primary-ink font-semibold"
                        : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                    )
                  }
                >
                  <Icon size={16} className="flex-none opacity-80" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      )),
    []
  );

  return (
    <aside className="w-[252px] flex-none bg-surface border-r border-border flex flex-col sticky top-0 h-screen overflow-y-auto">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-border">
        <div className="w-[30px] h-[30px] rounded-[9px] bg-gradient-to-br from-paints from-48% to-interiors to-52% shadow-sm" />
        <div>
          <div className="font-display font-semibold text-[16.5px]">AJ Enterprises</div>
          <div className="text-[10.5px] text-ink-3 uppercase tracking-wide mt-px">
            Stock &amp; Trade Admin
          </div>
        </div>
      </div>

      {groups}

      <div className="mt-auto px-5 py-3.5 border-t border-border">
        <div className="flex items-center gap-2.5">
          <Avatar initials="SK" size={32} />
          <div>
            <div className="text-[13px] font-semibold text-ink">Selvi Kannan</div>
            <div className="text-[11.5px] text-ink-3">Stock Manager</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export const Sidebar = memo(SidebarBase);
