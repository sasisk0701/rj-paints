import type { ByToggle, KpiItem } from "@/types/types";

interface StockOutRow {
  ref: string;
  date: string;
  source: string;
  party: string;
  product: string;
  qty: string;
  amount: string;
}

interface StockOutVariant {
  kpis: KpiItem[];
  pagination: string;
  rows: StockOutRow[];
}

export const stockOutData: ByToggle<StockOutVariant> = {
  paints: {
    kpis: [
      { label: "Stock Out (this month)", value: "168 entries", delta: "₹9.8L dispatched", deltaTone: "neutral" },
      { label: "From Sales", value: "142", delta: "84.5%", deltaTone: "neutral" },
      { label: "Damaged / Wastage", value: "6", delta: "flagged for review", deltaTone: "down" },
      { label: "Internal Usage", value: "20", delta: "site / material issue", deltaTone: "neutral" },
    ],
    pagination: "Showing 1–2 of 168 entries",
    rows: [
      { ref: "SO-2451", date: "24 Aug 2026", source: "Sales", party: "Sri Lakshmi Hardware", product: "Enamel White 4L", qty: "20", amount: "₹18,400" },
      { ref: "SO-2448", date: "22 Aug 2026", source: "Damaged Stock", party: "—", product: "Distemper Red Oxide", qty: "2", amount: "₹2,300" },
    ],
  },
  interiors: {
    kpis: [
      { label: "Stock Out (this month)", value: "119 entries", delta: "₹5.3L dispatched", deltaTone: "neutral" },
      { label: "From Sales", value: "99", delta: "83.2%", deltaTone: "neutral" },
      { label: "Damaged / Wastage", value: "3", delta: "flagged for review", deltaTone: "down" },
      { label: "Internal Usage", value: "17", delta: "site / material issue", deltaTone: "neutral" },
    ],
    pagination: "Showing 1–2 of 119 entries",
    rows: [
      { ref: "SO-2450", date: "24 Aug 2026", source: "Sales", party: "Home Decor Studio", product: "Laminate Oak Finish", qty: "6", amount: "₹7,850" },
      { ref: "SO-2449", date: "23 Aug 2026", source: "Material Issue", party: "Internal – Site 4", product: "PVC Panel 8mm", qty: "12", amount: "₹9,120" },
    ],
  },
};
