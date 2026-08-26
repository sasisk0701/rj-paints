import { useMemo } from "react";
import { Filter, Download, Printer, BarChart3 } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { reportGroups } from "@/data/adminData";
import { Panel, PanelBody, PanelHeader } from "@/components/common/Panel";
import { Toolbar,FilterChip } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { BusinessBadge } from "@/components/common/Badge";

export default function Reports() {
  const { toggle } = useBusiness();

  const panels = useMemo(
    () =>
      reportGroups.map((group) => (
        <Panel key={group.title}>
          <PanelHeader title={group.title} actions={<BusinessBadge business={toggle} />} />
          <PanelBody className="pt-1">
            {group.items.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 size={15} className="text-ink-2" />
                  <span className="font-medium">{item}</span>
                </div>
                <Button variant="ghost" size="sm">Open</Button>
              </div>
            ))}
          </PanelBody>
        </Panel>
      )),
    [toggle]
  );

  return (
    <div>
      <Toolbar
        left={
          <>
            <FilterChip icon={Filter}>Date range ▾</FilterChip>
            <FilterChip>{toggle === "paints" ? "Paints" : "Interiors"} ▾</FilterChip>
            <FilterChip>Category ▾</FilterChip>
          </>
        }
        right={
          <>
            <Button variant="ghost" size="sm" icon={Download}>Export</Button>
            <Button variant="ghost" size="sm" icon={Printer}>Print</Button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-4 max-[1100px]:grid-cols-1">{panels}</div>
    </div>
  );
}
