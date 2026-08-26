import type { ByToggle, KpiItem, Tone } from "@/types/types";

interface LowStockItem {
  color: string;
  name: string;
  stock: number;
  min: number;
}

interface Transaction {
  ref: string;
  type: string;
  party: string;
  amount: string;
  statusTone: Tone;
  status: string;
}

interface DashboardVariant {
  kpis: KpiItem[];
  chartBars: [number, number][];
  summary: { label: string; sub: string };
  lowStock: LowStockItem[];
  transactions: Transaction[];
}

/**
 * Mock data for the Dashboard page, split by business. In a real build
 * this file is where you'd swap static objects for an API/query hook —
 * every page already reads through `data[business]`, so only this file
 * would change.
 */
export const dashboardData: ByToggle<DashboardVariant> = {
  paints: {
    kpis: [
      { label: "Total Products", value: "742", delta: "▲ 3.2% vs last month", deltaTone: "up" },
      { label: "Total Stock Value", value: "₹41.2L", delta: "▲ 5.1% vs last month", deltaTone: "up" },
      { label: "Low Stock Items", value: "18", delta: "▼ needs reorder", deltaTone: "down" },
      { label: "Customer Outstanding", value: "₹3.1L", delta: "7 overdue invoices", deltaTone: "down" },
      { label: "Bank + Cash Balance", value: "₹14.6L", delta: "Paints-linked accounts", deltaTone: "neutral" },
    ],
    chartBars: [
      [120, 90], [95, 110], [140, 85], [110, 120], [150, 95], [100, 130], [135, 100], [160, 90],
    ],
    summary: { label: "742 products", sub: "₹41.2L stock value · 62% of combined total" },
    lowStock: [
      { color: "#2A2A2A", name: "Enamel White 4L", stock: 6, min: 20 },
      { color: "#C97B4C", name: "Wood Primer 1L", stock: 3, min: 15 },
      { color: "#B65454", name: "Distemper Red Oxide", stock: 4, min: 10 },
      { color: "#8FD3C0", name: "Enamel Blue 1L", stock: 9, min: 12 },
    ],
    transactions: [
      { ref: "SO-2451", type: "Sales", party: "Sri Lakshmi Hardware", amount: "₹18,400", statusTone: "success", status: "Paid" },
      { ref: "PO-1129", type: "Purchase", party: "Asian Paints Depot", amount: "₹92,000", statusTone: "warn", status: "Pending" },
      { ref: "SI-0982", type: "Stock In", party: "Berger Distributors", amount: "₹54,200", statusTone: "neutral", status: "Recorded" },
      { ref: "EXP-330", type: "Expense", party: "Transport", amount: "₹3,200", statusTone: "success", status: "Paid" },
    ],
  },
  interiors: {
    kpis: [
      { label: "Total Products", value: "542", delta: "▲ 2.4% vs last month", deltaTone: "up" },
      { label: "Total Stock Value", value: "₹27.2L", delta: "▲ 7.0% vs last month", deltaTone: "up" },
      { label: "Low Stock Items", value: "9", delta: "▼ needs reorder", deltaTone: "down" },
      { label: "Customer Outstanding", value: "₹1.8L", delta: "5 overdue invoices", deltaTone: "down" },
      { label: "Bank + Cash Balance", value: "₹7.5L", delta: "Interiors-linked accounts", deltaTone: "neutral" },
    ],
    chartBars: [
      [80, 60], [100, 75], [70, 95], [90, 70], [60, 100], [85, 65], [95, 80], [75, 110],
    ],
    summary: { label: "542 products", sub: "₹27.2L stock value · 38% of combined total" },
    lowStock: [
      { color: "#5B7FBE", name: "PVC Panel 8mm", stock: 11, min: 15 },
      { color: "#D9C27E", name: "Laminate Walnut Finish", stock: 5, min: 15 },
      { color: "#9C8CD6", name: "Cabinet Hinges (100pk)", stock: 14, min: 25 },
      { color: "#7A9E7E", name: "MDF Board 12mm", stock: 4, min: 12 },
    ],
    transactions: [
      { ref: "SO-2450", type: "Sales", party: "Home Decor Studio", amount: "₹7,850", statusTone: "success", status: "Paid" },
      { ref: "PO-1126", type: "Purchase", party: "Interio Craft Supplies", amount: "₹68,900", statusTone: "danger", status: "Overdue" },
      { ref: "SI-0979", type: "Stock In", party: "CenturyPly Traders", amount: "₹1,08,400", statusTone: "neutral", status: "Recorded" },
      { ref: "EXP-331", type: "Expense", party: "Warehouse maintenance", amount: "₹4,600", statusTone: "success", status: "Paid" },
    ],
  },
};
