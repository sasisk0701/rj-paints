import {
  LayoutGrid,
  Box,
  Tag,
  Layers,
  ArrowDown,
  ArrowUp,
  Wrench,
  ShoppingCart,
  TrendingUp,
  FileText,
  Users,
  Truck,
  Landmark,
  Wallet,
  ArrowLeftRight,
  Receipt,
  BarChart3,
  UserCog,
  Settings,
  Clock,
} from "lucide-react";
import type { NavGroupType, NavItemType } from "@/types/types";

export const NAV_ITEMS: NavItemType[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "products", label: "Products", icon: Box },
  { key: "categories", label: "Categories", icon: Tag },
  { key: "stock", label: "Stock Overview", icon: Layers },
  { key: "stock-in", label: "Stock In", icon: ArrowDown },
  { key: "stock-out", label: "Stock Out", icon: ArrowUp },
  { key: "stock-maintenance", label: "Stock Maintenance", icon: Wrench },
  { key: "purchases",   label: "Purchases",   icon: ShoppingCart },
  { key: "sales",       label: "Sales",        icon: TrendingUp },
  { key: "quotations",  label: "Quotations",   icon: FileText },
  { key: "customers", label: "Customers", icon: Users },
  { key: "suppliers", label: "Suppliers", icon: Truck },
  { key: "bank", label: "Bank", icon: Landmark },
  { key: "cash", label: "Cash", icon: Wallet },
  { key: "payments", label: "Payments & Receipts", icon: ArrowLeftRight },
  { key: "expenses", label: "Expenses", icon: Receipt },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "users", label: "User Management", icon: UserCog },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "activity-log", label: "Activity Log", icon: Clock },
];

export const NAV_GROUPS: NavGroupType[] = [
  { label: "Overview", keys: ["dashboard"] },
  { label: "Catalog", keys: ["products", "categories"] },
  { label: "Inventory", keys: ["stock", "stock-in", "stock-out", "stock-maintenance"] },
  { label: "Trade", keys: ["purchases", "sales", "quotations"] },
  { label: "Contacts", keys: ["customers", "suppliers"] },
  { label: "Finance", keys: ["bank", "cash", "payments", "expenses"] },
  { label: "Insights", keys: ["reports"] },
  { label: "Administration", keys: ["users", "settings", "activity-log"] },
];

export const NAV_BY_KEY: Record<string, NavItemType> = Object.fromEntries(
  NAV_ITEMS.map((item) => [item.key, item])
);
