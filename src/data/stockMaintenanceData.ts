import type { ByToggle, KpiItem, Tone } from "@/types/types";

interface MaintenanceRow {
  name: string;
  system: string;
  counted: string;
  diff: string;
  statusTone: Tone;
  status: string;
}

interface StockMaintenanceVariant {
  kpis: KpiItem[];
  rows: MaintenanceRow[];
}

export const stockMaintenanceData: ByToggle<StockMaintenanceVariant> = {
  paints: {
    kpis: [
      { label: "Pending Verifications", value: "2", delta: "physical counts due", deltaTone: "down" },
      { label: "Stock Differences Found", value: "9", delta: "last cycle", deltaTone: "neutral" },
      { label: "Wastage Logged", value: "₹5,200", delta: "this month", deltaTone: "neutral" },
      { label: "Corrections Applied", value: "7", delta: "of 9 differences", deltaTone: "neutral" },
    ],
    rows: [
      { name: "Enamel White 4L", system: "System: 12", counted: "Counted: 6", diff: "-6", statusTone: "danger", status: "Shortage" },
      { name: "Distemper Red Oxide", system: "System: 42", counted: "Counted: 40", diff: "-2", statusTone: "warn", status: "Minor Diff." },
    ],
  },
  interiors: {
    kpis: [
      { label: "Pending Verifications", value: "1", delta: "physical counts due", deltaTone: "down" },
      { label: "Stock Differences Found", value: "5", delta: "last cycle", deltaTone: "neutral" },
      { label: "Wastage Logged", value: "₹3,200", delta: "this month", deltaTone: "neutral" },
      { label: "Corrections Applied", value: "4", delta: "of 5 differences", deltaTone: "neutral" },
    ],
    rows: [
      { name: "PVC Panel 8mm", system: "System: 178", counted: "Counted: 180", diff: "+2", statusTone: "success", status: "Surplus" },
      { name: "MDF Board 12mm", system: "System: 62", counted: "Counted: 60", diff: "-2", statusTone: "warn", status: "Minor Diff." },
    ],
  },
};
