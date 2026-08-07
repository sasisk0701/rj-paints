export type BusinessType = 'paints' | 'interiors';

export interface CompanyInfo {
  name: string;
  interiorsName: string;
  owner: string;
  location: string;
  website: string;
  paintPartner: string;
  contactNumbers: string[];
  email: string;
  address: string;
  gstNumber: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin';
  name: string;
}

export interface Category {
  id: string;
  name: string;
  business: BusinessType | 'both';
  description?: string;
  image?: string;
  productCount?: number;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  isAuthorized?: boolean;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  sku: string;
  barcode: string;
  description: string;
  purchasePrice: number;
  sellingPrice: number;
  gstRate: number; // e.g., 18 for 18%
  stock: number;
  minStock: number;
  unit: string; // Liter, Kg, Piece, Box, Sq.Ft
  image: string;
  business: BusinessType | 'both';
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  gstNumber: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  outstandingBalance: number;
  createdAt: string;
}

export interface StockInItem {
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  gstRate: number;
  total: number;
}

export interface StockInRecord {
  id: string;
  invoiceNo: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: string;
  items: StockInItem[];
  subtotal: number;
  totalGst: number;
  grandTotal: number;
  paymentMode: 'Cash' | 'UPI' | 'Cheque' | 'Bank Transfer' | 'Credit';
  notes?: string;
  createdAt: string;
}

export interface StockOutItem {
  productId: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
  discount: number;
  gstRate: number;
  total: number;
}

export interface StockOutRecord {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerPhone: string;
  saleDate: string;
  items: StockOutItem[];
  subtotal: number;
  discountTotal: number;
  totalGst: number;
  grandTotal: number;
  paymentMode: 'Cash' | 'UPI' | 'Cheque' | 'Bank Transfer' | 'Credit';
  notes?: string;
  createdAt: string;
}

export interface LabourPayment {
  id: string;
  name: string;
  phone: string;
  siteLocation: string;
  description: string;
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer';
  paymentDate: string;
  remarks?: string;
}

export interface ExpenseRecord {
  id: string;
  category: 'Rent' | 'Electricity' | 'Fuel' | 'Transport' | 'Salary' | 'Miscellaneous';
  title: string;
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  expenseDate: string;
  remarks?: string;
}

export interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  currentBalance: number;
  type: 'Current' | 'Savings' | 'Cash In Hand';
}

export interface BankTransaction {
  id: string;
  type: 'Income' | 'Expense' | 'Transfer';
  amount: number;
  paymentMode: 'UPI' | 'Cash' | 'Cheque' | 'Bank Transfer';
  accountFrom?: string;
  accountTo?: string;
  referenceNo?: string;
  description: string;
  date: string;
}

export interface ShadeColor {
  name: string;
  code: string;
  hex: string;
  category: string;
  popular?: boolean;
}

export interface InteriorProject {
  id: string;
  title: string;
  category: 'Modular Kitchen' | 'False Ceiling' | 'Wardrobe' | 'Living Room' | 'Bedroom' | 'Office' | 'Construction';
  location: string;
  image: string;
  beforeImage?: string;
  afterImage?: string;
  description: string;
  completionYear: string;
}

export interface QuoteRequest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  serviceNeeded: string;
  business: BusinessType;
  message: string;
  date: string;
  status: 'Pending' | 'Contacted' | 'Closed';
}
