import { useState, useCallback, useEffect, useMemo } from "react";
import { Download, RefreshCw } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { dashboardService, type ApiDashboardData } from "@/services/api";
import { Toolbar } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { Badge } from "@/components/common/Badge.tsx";
import { Swatch } from "@/components/common/Swatch";
import { PanelHeader, PanelBody, Panel } from "@/components/common/Panel.tsx";
import { KpiRow } from "@/components/common/KpiCard";
import type { Tone } from "@/types/types";

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
  const [data, setData] = useState<ApiDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const accent = toggle === "paints" ? "#0E8A6D" : "#C4762E";
  const badgeTone: Tone = toggle === "paints" ? "paints" : "interiors";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardService.get(toggle.toUpperCase());
      setData(res);
    } catch {
      // silently fail — keep stale data if any
    } finally {
      setLoading(false);
    }
  }, [toggle]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const chartBars = useMemo(
    () => data ? renderChartBars(data.chartBars, accent) : null,
    [data, accent]
  );

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <Toolbar
        left={<div className="text-xs text-ink-3">{today} · {toggle === "paints" ? "Paints" : "Interiors"} business</div>}
        right={
          <>
            <Button variant="ghost" size="sm" icon={RefreshCw} loading={loading} onClick={fetchData}>Refresh</Button>
            <Button variant="ghost" size="sm" icon={Download}>Export</Button>
          </>
        }
      />

      <KpiRow items={data?.kpis ?? []} />

      <div className="grid grid-cols-[1.4fr_1fr] gap-4 mb-4 max-[1100px]:grid-cols-1">
        <Panel>
          <PanelHeader
            title="Stock In vs Stock Out"
            subtitle={`${toggle === "paints" ? "Paints" : "Interiors"} business · last 8 weeks`}
          />
          <PanelBody>
            {loading && !data ? (
              <div className="h-[200px] flex items-center justify-center text-ink-3 text-sm">Loading…</div>
            ) : (
              <>
                <svg viewBox="0 0 560 200" width="100%" height="200" style={{ overflow: "visible" }}>
                  <line x1="0" y1="170" x2="560" y2="170" stroke="#E3E5EA" strokeWidth="1" />
                  {chartBars}
                </svg>
                <div className="flex gap-4 mt-2.5 text-xs text-ink-2">
                  <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5" style={{ backgroundColor: accent }} />Stock In</span>
                  <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 bg-ink-3" />Stock Out</span>
                </div>
              </>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Business Summary" />
          <PanelBody className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Swatch color={accent} />
              <div className="flex-1">
                <div className="font-semibold">{toggle === "paints" ? "RJ Paints & Hardwares" : "Styleo Interiors"}</div>
                <div className="text-xs text-ink-3">
                  {data ? `${data.kpis[0]?.value ?? "—"} products · ${data.kpis[1]?.value ?? "—"} stock value` : "Loading…"}
                </div>
              </div>
              <Badge tone={badgeTone}>Active view</Badge>
            </div>
            <div className="h-px bg-border" />
            {data && data.lowStock.length > 0 && (
              <div className="text-xs text-danger font-medium">
                ⚠ {data.lowStock.length} product{data.lowStock.length > 1 ? "s" : ""} below minimum stock level
              </div>
            )}
            <div className="text-xs text-ink-3">
              Switch the tab in the top bar to compare against the other business.
            </div>
          </PanelBody>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <PanelHeader title="Recent Transactions" />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["Ref", "Type", "Party", "Amount", "Status"].map((h) => (
                    <th key={h} className="text-left text-[11px] uppercase tracking-wide font-bold text-ink-3 px-3.5 py-2.5 border-b border-border bg-surface-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!data || data.transactions.length === 0 ? (
                  <tr><td colSpan={5} className="px-3.5 py-6 text-center text-ink-3 text-sm">{loading ? "Loading…" : "No recent transactions"}</td></tr>
                ) : data.transactions.map((t, i) => (
                  <tr key={i} className="hover:bg-surface-2">
                    <td className="px-3.5 py-3 border-b border-border font-mono text-[13px]">{t.ref}</td>
                    <td className="px-3.5 py-3 border-b border-border">{t.type}</td>
                    <td className="px-3.5 py-3 border-b border-border">{t.party}</td>
                    <td className="px-3.5 py-3 border-b border-border text-right font-mono">{t.amount}</td>
                    <td className="px-3.5 py-3 border-b border-border">
                      <Badge tone={t.statusTone as Tone}>{t.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Low Stock Alerts" />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["Product", "Stock", "Min"].map((h) => (
                    <th key={h} className="text-left text-[11px] uppercase tracking-wide font-bold text-ink-3 px-3.5 py-2.5 border-b border-border bg-surface-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!data || data.lowStock.length === 0 ? (
                  <tr><td colSpan={3} className="px-3.5 py-6 text-center text-ink-3 text-sm">{loading ? "Loading…" : "✓ All products above minimum stock"}</td></tr>
                ) : data.lowStock.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-2">
                    <td className="px-3.5 py-3 border-b border-border">
                      <div className="flex items-center gap-2.5">
                        <Swatch color={accent} size="sm" />
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
