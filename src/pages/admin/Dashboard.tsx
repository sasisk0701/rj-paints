import { useMemo } from "react";
import { Clock, Download, Plus } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { dashboardData } from "@/data/dashboardData";
import { Toolbar,FilterChip } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { Badge } from "@/components/common/Badge.tsx";
import { Swatch } from "@/components/common/Swatch";
import { PanelHeader } from "@/components/common/Panel.tsx";
import { PanelBody } from "@/components/common/Panel.tsx";
import { KpiRow } from "@/components/common/KpiCard";
import { Panel } from "@/components/common/Panel.tsx";

/**
 * Renders the "Stock In vs Stock Out" bar chart as inline SVG.
 * Kept as a small pure function (not a component) since it's only ever
 * called once per render from within the memoized chart block below.
 */
function renderChartBars(bars: [number, number][], accent: string) {
  return bars.map(([h1, h2], i) => (
    <g key={i}>
      <rect x={20 + i * 68} y={170 - h1} width="22" height={h1} rx="4" fill={accent} opacity="0.85" />
      <rect x={44 + i * 68} y={170 - h2} width="22" height={h2} rx="4" fill="#9598A1" opacity="0.55" />
    </g>
  ));
}

export default function Dashboard() {
  const { toggle } = useBusiness();

  // Re-select the dataset only when `business` changes, not on every
  // parent re-render (e.g. from an unrelated Topbar state update).
  const data = useMemo(() => dashboardData[toggle], [toggle]);
  const accent = toggle === "paints" ? "#0E8A6D" : "#C4762E";
  const badgeTone = toggle === "paints" ? "paints" : "interiors";

  const chartBars = useMemo(
    () => renderChartBars(data.chartBars, accent),
    [data.chartBars, accent]
  );

  return (
    <div>
      <Toolbar
        left={
          <div className="text-xs text-ink-3">
            Wednesday, 25 August 2026 · {toggle === "paints" ? "Paints" : "Interiors"} business
          </div>
        }
        right={
          <>
            <FilterChip icon={Clock}>Last 30 days</FilterChip>
            <Button variant="ghost" size="sm" icon={Download}>Export</Button>
            <Button variant="primary" size="sm" icon={Plus}>New Stock In</Button>
          </>
        }
      />

      <KpiRow items={data.kpis} />

      <div className="grid grid-cols-[1.4fr_1fr] gap-4 mb-4 max-[1100px]:grid-cols-1">
        <Panel>
          <PanelHeader
            title="Stock In vs Stock Out"
            subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business · last 8 weeks`}
            actions={<FilterChip>{toggle === "paints" ? "Paints ▾" : "Interiors ▾"}</FilterChip>}
          />
          <PanelBody>
            <svg viewBox="0 0 560 200" width="100%" height="200" style={{ overflow: "visible" }}>
              <line x1="0" y1="170" x2="560" y2="170" stroke="#E3E5EA" strokeWidth="1" />
              {chartBars}
            </svg>
            <div className="flex gap-4 mt-2.5 text-xs text-ink-2">
              <span>
                <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5" style={{ backgroundColor: accent }} />
                Stock In
              </span>
              <span>
                <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 bg-ink-3" />
                Stock Out
              </span>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Business Summary" />
          <PanelBody className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Swatch color={accent} />
              <div className="flex-1">
                <div className="font-semibold">{toggle === "paints" ? "Paints" : "Interiors"}</div>
                <div className="text-xs text-ink-3">{data.summary.sub}</div>
              </div>
              <Badge tone={badgeTone}>Active view</Badge>
            </div>
            <div className="h-px bg-border" />
            <div className="text-xs text-ink-3">
              Switch the tab in the top bar to compare against the other business.
            </div>
          </PanelBody>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <PanelHeader title="Recent Transactions" actions={<Button variant="ghost" size="sm">View all</Button>} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["Ref", "Type", "Party", "Business", "Amount", "Status"].map((h) => (
                    <th key={h} className="text-left text-[11px] uppercase tracking-wide font-bold text-ink-3 px-3.5 py-2.5 border-b border-border bg-surface-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t) => (
                  <tr key={t.ref} className="hover:bg-surface-2">
                    <td className="px-3.5 py-3 border-b border-border font-mono text-[13px]">{t.ref}</td>
                    <td className="px-3.5 py-3 border-b border-border">{t.type}</td>
                    <td className="px-3.5 py-3 border-b border-border">{t.party}</td>
                    <td className="px-3.5 py-3 border-b border-border">
                      <Badge tone={badgeTone}>{toggle === "paints" ? "Paints" : "Interiors"}</Badge>
                    </td>
                    <td className="px-3.5 py-3 border-b border-border text-right font-mono">{t.amount}</td>
                    <td className="px-3.5 py-3 border-b border-border">
                      <Badge tone={t.statusTone}>{t.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Low Stock Alerts" actions={<Button variant="ghost" size="sm">Manage</Button>} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["Product", "Stock", "Min"].map((h) => (
                    <th key={h} className="text-left text-[11px] uppercase tracking-wide font-bold text-ink-3 px-3.5 py-2.5 border-b border-border bg-surface-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.lowStock.map((item) => (
                  <tr key={item.name} className="hover:bg-surface-2">
                    <td className="px-3.5 py-3 border-b border-border">
                      <div className="flex items-center gap-2.5">
                        <Swatch color={item.color} size="sm" />
                        <span className="font-semibold">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 border-b border-border text-right font-mono text-danger">{item.stock}</td>
                    <td className="px-3.5 py-3 border-b border-border text-right font-mono">{item.min}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
