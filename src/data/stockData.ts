import type { ByToggle, KpiItem, Tone } from "@/types/types";

interface StockRow {
  name: string;
  opening: string;
  available: string;
  min: string;
  statusTone: Tone;
  status: string;
}

interface StockVariant {
  kpis: KpiItem[];
  pagination: string;
  rows: StockRow[];
}

export const stockData: ByToggle<StockVariant> = {
  paints: {
    kpis: [
      { label: "Current Stock (units)", value: "22,180", delta: "Paints business", deltaTone: "neutral" },
      { label: "Stock Value", value: "₹41.2L", delta: "▲ 5.1% MoM", deltaTone: "up" },
      { label: "Low Stock SKUs", value: "18", delta: "below minimum level", deltaTone: "down" },
      { label: "Stock Movements Today", value: "38", delta: "in + out combined", deltaTone: "neutral" },
    ],
    pagination: "Showing 1–3 of 742 SKUs",
    rows: [
      { name: "Enamel White 4L", opening: "128", available: "6", min: "20", statusTone: "danger", status: "Below Min" },
      { name: "Exterior Emulsion 10L", opening: "150", available: "42", min: "20", statusTone: "success", status: "Healthy" },
      { name: "Distemper Red Oxide", opening: "40", available: "4", min: "10", statusTone: "danger", status: "Below Min" },
    ],
  },
  interiors: {
    kpis: [
      { label: "Current Stock (units)", value: "16,232", delta: "Interiors business", deltaTone: "neutral" },
      { label: "Stock Value", value: "₹27.2L", delta: "▲ 7.0% MoM", deltaTone: "up" },
      { label: "Low Stock SKUs", value: "9", delta: "below minimum level", deltaTone: "down" },
      { label: "Stock Movements Today", value: "25", delta: "in + out combined", deltaTone: "neutral" },
    ],
    pagination: "Showing 1–3 of 542 SKUs",
    rows: [
      { name: "PVC Panel 8mm", opening: "180", available: "11", min: "15", statusTone: "warn", status: "Watch" },
      { name: "Laminate Oak Finish", opening: "200", available: "56", min: "25", statusTone: "success", status: "Healthy" },
      { name: "MDF Board 12mm", opening: "60", available: "4", min: "12", statusTone: "danger", status: "Below Min" },
    ],
  },
};
