import { useState, useCallback } from "react";
import { Download, Printer, BarChart3, ChevronRight } from "lucide-react";
import { DatePicker, message } from "antd";
import type { Dayjs } from "dayjs";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { reportService, type ApiReportData } from "@/services/api";
import { Panel, PanelBody, PanelHeader } from "@/components/common/Panel";
import { Toolbar } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { AppModal } from "@/components/common/AppModal";

const { RangePicker } = DatePicker;

const REPORT_GROUPS = [
  {
    title: "Stock Reports",
    items: [
      { label: "Current Stock Report", type: "stock" },
      { label: "Stock In Report", type: "stock-in" },
      { label: "Stock Out Report", type: "stock-out" },
      { label: "Low Stock Report", type: "low-stock" },
    ],
  },
  {
    title: "Purchase Reports",
    items: [
      { label: "Purchase Report", type: "purchases" },
      { label: "Supplier-wise Purchase", type: "supplier-purchases" },
    ],
  },
  {
    title: "Sales Reports",
    items: [
      { label: "Sales Report", type: "sales" },
      { label: "Customer-wise Sales", type: "customer-sales" },
    ],
  },
  {
    title: "Financial Reports",
    items: [
      { label: "Expense Report", type: "expenses" },
      { label: "Customer Outstanding", type: "customer-outstanding" },
    ],
  },
];

export default function Reports() {
  const { toggle } = useBusiness();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [reportData, setReportData] = useState<ApiReportData | null>(null);
  const [reportLabel, setReportLabel] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openReport = useCallback(async (type: string, label: string) => {
    setLoading(type);
    try {
      const filters: { business?: string; from?: string; to?: string } = {
        business: toggle.toUpperCase(),
      };
      if (dateRange?.[0]) filters.from = dateRange[0].startOf("day").toISOString();
      if (dateRange?.[1]) filters.to = dateRange[1].endOf("day").toISOString();
      const data = await reportService.get(type, filters);
      setReportData(data);
      setReportLabel(label);
      setModalOpen(true);
    } catch {
      message.error("Failed to generate report");
    } finally {
      setLoading(null);
    }
  }, [toggle, dateRange]);

  const handlePrint = () => {
    if (!reportData) return;
    const html = `
      <html><head><title>${reportData.title}</title>
      <style>
        body { font-family: sans-serif; padding: 24px; }
        h2 { margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #f3f4f6; text-align: left; padding: 8px 10px; border: 1px solid #e5e7eb; }
        td { padding: 7px 10px; border: 1px solid #e5e7eb; }
        .summary { margin-top: 16px; font-size: 13px; }
        .summary span { margin-right: 24px; font-weight: 600; }
      </style></head><body>
      <h2>${reportData.title}</h2>
      <table>
        <thead><tr>${reportData.columns.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
        <tbody>${reportData.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
      <div class="summary">${Object.entries(reportData.summary).map(([k, v]) => `<span>${k}: ${v}</span>`).join("")}</div>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  };

  const handleExport = () => {
    if (!reportData) return;
    const csv = [
      reportData.columns.join(","),
      ...reportData.rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportData.title.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Toolbar
        left={
          <RangePicker
            format="DD/MM/YYYY"
            onChange={(val) => setDateRange(val as [Dayjs | null, Dayjs | null] | null)}
            placeholder={["From date", "To date"]}
            className="text-sm"
          />
        }
        right={null}
      />

      <div className="grid grid-cols-2 gap-4 max-[1100px]:grid-cols-1">
        {REPORT_GROUPS.map((group) => (
          <Panel key={group.title}>
            <PanelHeader title={group.title} />
            <PanelBody className="pt-1">
              {group.items.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 size={15} className="text-ink-2" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={ChevronRight}
                    loading={loading === item.type}
                    onClick={() => openReport(item.type, item.label)}
                  >
                    Open
                  </Button>
                </div>
              ))}
            </PanelBody>
          </Panel>
        ))}
      </div>

      <AppModal
        open={modalOpen}
        title={reportLabel}
        onClose={() => setModalOpen(false)}
        width={900}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Close</Button>
            <Button variant="ghost" icon={Printer} onClick={handlePrint}>Print</Button>
            <Button variant="primary" icon={Download} onClick={handleExport}>Export CSV</Button>
          </>
        }
      >
        {reportData && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    {reportData.columns.map((col) => (
                      <th key={col} className="text-left px-3 py-2 bg-surface border border-border font-semibold text-ink-1">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={reportData.columns.length} className="text-center py-8 text-ink-3">
                        No data found
                      </td>
                    </tr>
                  ) : (
                    reportData.rows.map((row, i) => (
                      <tr key={i} className="border-b border-border hover:bg-surface/50">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-ink-1">{cell}</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 pt-3 border-t border-border text-sm">
              {Object.entries(reportData.summary).map(([k, v]) => (
                <span key={k} className="text-ink-2">
                  <span className="font-semibold text-ink-1">{k}:</span> {v}
                </span>
              ))}
            </div>
          </div>
        )}
      </AppModal>
    </div>
  );
}
