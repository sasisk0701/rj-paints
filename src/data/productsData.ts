import type { ByToggle, KpiItem, Tone } from "@/types/types";

interface ProductRow {
  color: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  unit: string;
  cost: string;
  price: string;
  stock: number;
  statusTone: Tone;
  status: string;
}

interface ProductsVariant {
  kpis: KpiItem[];
  panelSub: string;
  pagination: string;
  rows: ProductRow[];
}

export const productsData: ByToggle<ProductsVariant> = {
  paints: {
    kpis: [
      { label: "Total Products", value: "742", delta: "Paints business", deltaTone: "neutral" },
      { label: "Active", value: "718", delta: "▲ 96.8%", deltaTone: "up" },
      { label: "Disabled", value: "24", delta: "flagged out of stock", deltaTone: "neutral" },
      { label: "Low Stock", value: "18", delta: "▼ need reorder", deltaTone: "down" },
    ],
    panelSub: "742 products · Paints business",
    pagination: "Showing 1–4 of 742 products",
    rows: [
      { color: "#2A2A2A", name: "Enamel White 4L", sku: "PNT-EW-04L", category: "Enamel", brand: "Asian Paints", unit: "4L", cost: "₹520", price: "₹640", stock: 6, statusTone: "danger", status: "Low" },
      { color: "#C97B4C", name: "Wood Primer 1L", sku: "PNT-WP-01L", category: "Primer", brand: "Berger", unit: "1L", cost: "₹140", price: "₹185", stock: 3, statusTone: "danger", status: "Low" },
      { color: "#B65454", name: "Distemper Red Oxide", sku: "PNT-DR-20L", category: "Distemper", brand: "Nerolac", unit: "20L", cost: "₹1,150", price: "₹1,420", stock: 4, statusTone: "danger", status: "Low" },
      { color: "#8FD3C0", name: "Exterior Emulsion 10L", sku: "PNT-EE-10L", category: "Emulsion", brand: "Asian Paints", unit: "10L", cost: "₹1,780", price: "₹2,150", stock: 42, statusTone: "success", status: "Healthy" },
    ],
  },
  interiors: {
    kpis: [
      { label: "Total Products", value: "542", delta: "Interiors business", deltaTone: "neutral" },
      { label: "Active", value: "521", delta: "▲ 96.1%", deltaTone: "up" },
      { label: "Disabled", value: "21", delta: "flagged out of stock", deltaTone: "neutral" },
      { label: "Low Stock", value: "9", delta: "▼ need reorder", deltaTone: "down" },
    ],
    panelSub: "542 products · Interiors business",
    pagination: "Showing 1–4 of 542 products",
    rows: [
      { color: "#5B7FBE", name: "PVC Panel 8mm", sku: "INT-PVC-8", category: "Panels", brand: "Interio Craft", unit: "Sheet", cost: "₹640", price: "₹820", stock: 11, statusTone: "warn", status: "Watch" },
      { color: "#D9C27E", name: "Laminate Oak Finish", sku: "INT-LAM-OAK", category: "Laminate", brand: "CenturyPly", unit: "Sheet", cost: "₹1,050", price: "₹1,340", stock: 56, statusTone: "success", status: "Healthy" },
      { color: "#9C8CD6", name: "Cabinet Hinges (100pk)", sku: "INT-HNG-100", category: "Hardware", brand: "Hettich", unit: "Pack", cost: "₹1,900", price: "₹2,400", stock: 14, statusTone: "warn", status: "Watch" },
      { color: "#7A9E7E", name: "MDF Board 12mm", sku: "INT-MDF-12", category: "Boards", brand: "Greenply", unit: "Sheet", cost: "₹980", price: "₹1,220", stock: 4, statusTone: "danger", status: "Low" },
    ],
  },
};
