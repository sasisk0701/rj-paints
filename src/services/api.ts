import axios from 'axios';
import { Product, Supplier, StockInRecord, StockOutRecord, LabourPayment, ExpenseRecord, BankAccount, BankTransaction } from '../types';
import type { KpiItem, Tone } from '../types/types';
import { INITIAL_PRODUCTS } from '../data/paintsData';
import { INITIAL_SUPPLIERS, INITIAL_STOCK_IN, INITIAL_STOCK_OUT, INITIAL_LABOUR, INITIAL_EXPENSES, INITIAL_BANK_ACCOUNTS, INITIAL_TRANSACTIONS } from '../data/mockAdminData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('rj_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── LocalStorage helpers (used by modules not yet migrated to API) ────────
const getStoredData = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const setStoredData = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* noop */ }
};

export const initializeDatabase = () => {
  if (!localStorage.getItem('rj_db_products'))    setStoredData('rj_db_products', INITIAL_PRODUCTS);
  if (!localStorage.getItem('rj_db_suppliers'))   setStoredData('rj_db_suppliers', INITIAL_SUPPLIERS);
  if (!localStorage.getItem('rj_db_stock_in'))    setStoredData('rj_db_stock_in', INITIAL_STOCK_IN);
  if (!localStorage.getItem('rj_db_stock_out'))   setStoredData('rj_db_stock_out', INITIAL_STOCK_OUT);
  if (!localStorage.getItem('rj_db_labour'))      setStoredData('rj_db_labour', INITIAL_LABOUR);
  if (!localStorage.getItem('rj_db_expenses'))    setStoredData('rj_db_expenses', INITIAL_EXPENSES);
  if (!localStorage.getItem('rj_db_banks'))       setStoredData('rj_db_banks', INITIAL_BANK_ACCOUNTS);
  if (!localStorage.getItem('rj_db_transactions'))setStoredData('rj_db_transactions', INITIAL_TRANSACTIONS);
};

initializeDatabase();

// ─── Auth Service ──────────────────────────────────────────────────────────
export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await axiosClient.post('/api/auth/login', { email, password });
    return data as { token: string; user: { id: string; email: string; name: string; role: string } };
  },
  logout: async () => {
    await axiosClient.post('/api/auth/logout').catch(() => {});
  },
  me: async () => {
    const { data } = await axiosClient.get('/api/auth/me');
    return data as { id: string; email: string; name: string; role: string; createdAt: string };
  },
};

// ─── Admin: Users ──────────────────────────────────────────────────────────
export const adminUserService = {
  getUsers: async () => {
    const { data } = await axiosClient.get('/api/admin/users');
    return data as { id: string; email: string; name: string; role: string; createdAt: string }[];
  },
  createUser: async (payload: { email: string; name: string; password: string }) => {
    const { data } = await axiosClient.post('/api/admin/users', payload);
    return data;
  },
  deleteUser: async (id: string) => {
    await axiosClient.delete(`/api/admin/users/${id}`);
  },
};

// ─── Admin: Settings ───────────────────────────────────────────────────────
export const settingsService = {
  getSettings: async (): Promise<Record<string, string>> => {
    const { data } = await axiosClient.get('/api/admin/settings');
    return data;
  },
  saveSettings: async (updates: Record<string, string>) => {
    await axiosClient.put('/api/admin/settings', updates);
  },
};

// ─── Categories ──────────────────────────────────────────────────────────────
export interface ApiCategory {
  id: string; name: string; business: string; description: string | null;
  color: string; createdAt: string; _count?: { products: number };
}
export const categoryService = {
  getAll: async (business?: string): Promise<ApiCategory[]> => {
    const { data } = await axiosClient.get('/api/categories', { params: business ? { business } : {} });
    return data;
  },
  create: async (payload: { name: string; business: string; description?: string; color?: string }) => {
    const { data } = await axiosClient.post('/api/categories', payload);
    return data as ApiCategory;
  },
  update: async (id: string, payload: { name?: string; description?: string; color?: string }) => {
    const { data } = await axiosClient.put(`/api/categories/${id}`, payload);
    return data as ApiCategory;
  },
  remove: async (id: string) => { await axiosClient.delete(`/api/categories/${id}`); },
};

// ─── Products (API) ───────────────────────────────────────────────────────────
export interface ApiProduct {
  id: string; name: string; categoryId: string | null; categoryName: string;
  brand: string; sku: string; barcode: string; description: string | null;
  purchasePrice: number; sellingPrice: number; gstRate: number;
  stock: number; minStock: number; unit: string; image: string | null;
  business: string; status: string; createdAt: string; updatedAt: string;
  category?: { id: string; name: string; color: string } | null;
}
export const apiProductService = {
  getAll: async (filters?: { business?: string; category?: string; status?: string; search?: string }): Promise<ApiProduct[]> => {
    const { data } = await axiosClient.get('/api/products', { params: filters || {} });
    return data;
  },
  create: async (payload: Partial<ApiProduct>): Promise<ApiProduct> => {
    const { data } = await axiosClient.post('/api/products', payload);
    return data;
  },
  update: async (id: string, payload: Partial<ApiProduct>): Promise<ApiProduct> => {
    const { data } = await axiosClient.put(`/api/products/${id}`, payload);
    return data;
  },
  remove: async (id: string) => { await axiosClient.delete(`/api/products/${id}`); },
};

// ─── Admin: Activity Log ───────────────────────────────────────────────────
export const activityLogService = {
  getLogs: async (filters?: { business?: string; module?: string; userId?: string; limit?: number }) => {
    const params: Record<string, string | number> = { limit: filters?.limit ?? 100 };
    if (filters?.business) params.business = filters.business;
    if (filters?.module)   params.module   = filters.module;
    if (filters?.userId)   params.userId   = filters.userId;
    const { data } = await axiosClient.get('/api/admin/activity-log', { params });
    return data as {
      id: string;
      userId: string;
      userName: string;
      action: string;
      module: string;
      reference: string | null;
      business: string;
      createdAt: string;
    }[];
  },
  getLogUsers: async () => {
    const { data } = await axiosClient.get('/api/admin/activity-log/users');
    return data as { userId: string; userName: string }[];
  },
};

// ─── Products (localStorage — to be migrated) ─────────────────────────────
export const productService = {
  getProducts: async (): Promise<Product[]> =>
    getStoredData<Product[]>('rj_db_products', INITIAL_PRODUCTS),

  addProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const products = getStoredData<Product[]>('rj_db_products', INITIAL_PRODUCTS);
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setStoredData('rj_db_products', [newProduct, ...products]);
    return newProduct;
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product> => {
    const products = getStoredData<Product[]>('rj_db_products', INITIAL_PRODUCTS);
    let updated: Product | null = null;
    const list = products.map((p) => {
      if (p.id === id) { updated = { ...p, ...updates, updatedAt: new Date().toISOString().split('T')[0] }; return updated; }
      return p;
    });
    setStoredData('rj_db_products', list);
    return updated || products[0];
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    const products = getStoredData<Product[]>('rj_db_products', INITIAL_PRODUCTS);
    setStoredData('rj_db_products', products.filter((p) => p.id !== id));
    return true;
  },
};

// ─── Suppliers (API-backed) ───────────────────────────────────────────────
export interface ApiSupplier {
  id: string; name: string; gstNumber: string; phone: string;
  email: string | null; address: string | null; city: string;
  business: string; outstandingBalance: number; notes: string | null;
  createdAt: string; updatedAt: string;
}
export const supplierService = {
  getAll: async (filters?: { business?: string; search?: string }): Promise<ApiSupplier[]> => {
    const { data } = await axiosClient.get('/api/suppliers', { params: filters || {} });
    return data;
  },
  create: async (payload: Omit<ApiSupplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiSupplier> => {
    const { data } = await axiosClient.post('/api/suppliers', payload);
    return data;
  },
  update: async (id: string, payload: Partial<ApiSupplier>): Promise<ApiSupplier> => {
    const { data } = await axiosClient.put(`/api/suppliers/${id}`, payload);
    return data;
  },
  remove: async (id: string) => { await axiosClient.delete(`/api/suppliers/${id}`); },
};

// ─── Customers (API-backed) ───────────────────────────────────────────────
export interface ApiCustomer {
  id: string; name: string; phone: string; email: string | null;
  address: string | null; city: string; business: string;
  creditLimit: number; outstandingBalance: number; notes: string | null;
  createdAt: string; updatedAt: string;
}
export const customerService = {
  getAll: async (filters?: { business?: string; search?: string }): Promise<ApiCustomer[]> => {
    const { data } = await axiosClient.get('/api/customers', { params: filters || {} });
    return data;
  },
  create: async (payload: Omit<ApiCustomer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiCustomer> => {
    const { data } = await axiosClient.post('/api/customers', payload);
    return data;
  },
  update: async (id: string, payload: Partial<ApiCustomer>): Promise<ApiCustomer> => {
    const { data } = await axiosClient.put(`/api/customers/${id}`, payload);
    return data;
  },
  remove: async (id: string) => { await axiosClient.delete(`/api/customers/${id}`); },
};

export interface InventoryKpi extends KpiItem {}

export interface InventoryOverviewRow {
  id: string;
  name: string;
  opening: string;
  available: string;
  min: string;
  statusTone: Tone;
  status: string;
}

export interface InventoryStockInRow {
  id: string;
  ref: string;
  date: string;
  source: string;
  party: string;
  product: string;
  qty: string;
  amount: string;
  reference: string;
}

export interface InventoryStockOutRow {
  id: string;
  ref: string;
  date: string;
  source: string;
  party: string;
  product: string;
  qty: string;
  amount: string;
}

export interface InventoryMaintenanceRow {
  id: string;
  name: string;
  system: string;
  counted: string;
  diff: string;
  statusTone: Tone;
  status: string;
  notes?: string;
  itemName?: string;
  date?: string;
}

export interface InventoryListResponse<Row> {
  kpis: InventoryKpi[];
  pagination: string;
  rows: Row[];
}

export interface StockMovementItemInput {
  productId: string;
  quantity: number;
  purchasePrice?: number;
  sellingPrice?: number;
  discount?: number;
  gstRate?: number;
  systemStock?: number;
  physicalCount?: number;
  notes?: string;
}

export interface StockInPayload {
  invoiceNo: string;
  supplierId?: string | null;
  supplierName: string;
  purchaseDate: string;
  paymentMode: string;
  notes?: string;
  items: Array<Pick<StockMovementItemInput, 'productId' | 'quantity' | 'purchasePrice' | 'gstRate'>>;
}

export interface StockOutPayload {
  invoiceNo: string;
  customerName: string;
  customerPhone: string;
  saleDate: string;
  paymentMode: string;
  notes?: string;
  items: Array<Pick<StockMovementItemInput, 'productId' | 'quantity' | 'sellingPrice' | 'discount' | 'gstRate'>>;
}

export interface StockAdjustmentPayload {
  referenceNo: string;
  adjustmentDate: string;
  business: string;
  notes?: string;
  items: Array<Pick<StockMovementItemInput, 'productId' | 'systemStock' | 'physicalCount' | 'notes'>>;
}

// ─── Inventory (API-backed) ───────────────────────────────────────────────
export const inventoryService = {
  getOverview: async (business: string): Promise<InventoryListResponse<InventoryOverviewRow>> => {
    const { data } = await axiosClient.get('/api/inventory/overview', { params: { business } });
    return data;
  },

  getStockIn: async (business: string): Promise<InventoryListResponse<InventoryStockInRow>> => {
    const { data } = await axiosClient.get('/api/inventory/stock-in', { params: { business } });
    return data;
  },

  createStockIn: async (record: StockInPayload): Promise<unknown> => {
    const { data } = await axiosClient.post('/api/inventory/stock-in', record);
    return data;
  },

  getStockOut: async (business: string): Promise<InventoryListResponse<InventoryStockOutRow>> => {
    const { data } = await axiosClient.get('/api/inventory/stock-out', { params: { business } });
    return data;
  },

  createStockOut: async (record: StockOutPayload): Promise<unknown> => {
    const { data } = await axiosClient.post('/api/inventory/stock-out', record);
    return data;
  },

  getMaintenance: async (business: string): Promise<InventoryListResponse<InventoryMaintenanceRow>> => {
    const { data } = await axiosClient.get('/api/inventory/maintenance', { params: { business } });
    return data;
  },

  createMaintenance: async (record: StockAdjustmentPayload): Promise<unknown> => {
    const { data } = await axiosClient.post('/api/inventory/maintenance', record);
    return data;
  },
};

// ─── Purchases (API-backed) ─────────────────────────────────────────────────
export interface ApiPurchase {
  id: string; poNumber: string; supplierName: string; supplierId?: string | null;
  purchaseDate: string; paymentMode: string; status: string;
  subtotal: number; gstAmount: number; totalAmount: number;
  notes?: string | null; business: string; createdAt: string;
  items?: ApiPurchaseItem[];
}
export interface ApiPurchaseItem {
  id: string; productId: string; productName: string;
  quantity: number; purchasePrice: number; gstRate: number; amount: number;
}
export const purchaseService = {
  getAll: async (filters?: { business?: string; search?: string; status?: string }): Promise<ApiPurchase[]> => {
    const { data } = await axiosClient.get('/api/purchases', { params: filters || {} });
    return data;
  },
  create: async (payload: Omit<ApiPurchase, 'id' | 'createdAt' | 'subtotal' | 'gstAmount' | 'totalAmount'> & { items: Omit<ApiPurchaseItem, 'id'>[] }): Promise<ApiPurchase> => {
    const { data } = await axiosClient.post('/api/purchases', payload);
    return data;
  },
  update: async (id: string, payload: Partial<ApiPurchase>): Promise<ApiPurchase> => {
    const { data } = await axiosClient.put(`/api/purchases/${id}`, payload);
    return data;
  },
  remove: async (id: string) => { await axiosClient.delete(`/api/purchases/${id}`); },
};

// ─── Sales (API-backed) ───────────────────────────────────────────────────────
export interface ApiSale {
  id: string; invoiceNumber: string; customerName: string; customerPhone: string;
  customerId?: string | null; saleDate: string; paymentMode: string; status: string;
  subtotal: number; discountAmount: number; gstAmount: number; totalAmount: number;
  notes?: string | null; business: string; createdAt: string;
  items?: ApiSaleItem[];
}
export interface ApiSaleItem {
  id: string; productId: string; productName: string;
  quantity: number; sellingPrice: number; discount: number; gstRate: number; amount: number;
}
export const saleService = {
  getAll: async (filters?: { business?: string; search?: string; status?: string }): Promise<ApiSale[]> => {
    const { data } = await axiosClient.get('/api/sales', { params: filters || {} });
    return data;
  },
  create: async (payload: Omit<ApiSale, 'id' | 'createdAt' | 'subtotal' | 'discountAmount' | 'gstAmount' | 'totalAmount'> & { items: Omit<ApiSaleItem, 'id'>[] }): Promise<ApiSale> => {
    const { data } = await axiosClient.post('/api/sales', payload);
    return data;
  },
  update: async (id: string, payload: Partial<ApiSale>): Promise<ApiSale> => {
    const { data } = await axiosClient.put(`/api/sales/${id}`, payload);
    return data;
  },
  remove: async (id: string) => { await axiosClient.delete(`/api/sales/${id}`); },
};

// ─── Quotations (API-backed) ──────────────────────────────────────────────────
export interface ApiQuotation {
  id: string; quoteNumber: string; customerName: string; customerPhone: string;
  customerEmail?: string | null; validUntil: string; status: string;
  subtotal: number; discountAmount: number; gstAmount: number; totalAmount: number;
  notes?: string | null; terms?: string | null; business: string; createdAt: string;
  items?: ApiQuotationItem[];
}
export interface ApiQuotationItem {
  id: string; productId?: string | null; description: string;
  quantity: number; unitPrice: number; discount: number; gstRate: number; amount: number;
}
export const quotationService = {
  getAll: async (filters?: { business?: string; search?: string; status?: string }): Promise<ApiQuotation[]> => {
    const { data } = await axiosClient.get('/api/quotations', { params: filters || {} });
    return data;
  },
  create: async (payload: Omit<ApiQuotation, 'id' | 'createdAt' | 'subtotal' | 'discountAmount' | 'gstAmount' | 'totalAmount'> & { items: Omit<ApiQuotationItem, 'id'>[] }): Promise<ApiQuotation> => {
    const { data } = await axiosClient.post('/api/quotations', payload);
    return data;
  },
  update: async (id: string, payload: Partial<ApiQuotation>): Promise<ApiQuotation> => {
    const { data } = await axiosClient.put(`/api/quotations/${id}`, payload);
    return data;
  },
  remove: async (id: string) => { await axiosClient.delete(`/api/quotations/${id}`); },
  convertToSale: async (id: string): Promise<ApiSale> => {
    const { data } = await axiosClient.post(`/api/quotations/${id}/convert-to-sale`);
    return data;
  },
};

// ─── Expenses (API-backed) ───────────────────────────────────────────────
export interface ApiExpense {
  id: string; category: string; title: string; amount: number;
  paymentMode: string; expenseDate: string; remarks: string | null;
  business: string; createdAt: string; updatedAt: string;
}
export interface ApiExpenseRow {
  id: string; date: string; category: string; title: string;
  paymentMode: string; amount: string; amountRaw: number; remarks: string;
}
export interface ApiExpenseResponse {
  kpis: KpiItem[];
  rows: ApiExpenseRow[];
  pagination: string;
}
export const expenseService = {
  getAll: async (filters?: { category?: string; search?: string; from?: string; to?: string }): Promise<ApiExpenseResponse> => {
    const { data } = await axiosClient.get('/api/expenses', { params: filters || {} });
    return data;
  },
  create: async (payload: Omit<ApiExpense, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiExpense> => {
    const { data } = await axiosClient.post('/api/expenses', payload);
    return data;
  },
  update: async (id: string, payload: Partial<ApiExpense>): Promise<ApiExpense> => {
    const { data } = await axiosClient.put(`/api/expenses/${id}`, payload);
    return data;
  },
  remove: async (id: string) => { await axiosClient.delete(`/api/expenses/${id}`); },
};

// ─── Reports (API-backed) ─────────────────────────────────────────────────
export interface ApiReportData {
  title: string;
  columns: string[];
  rows: string[][];
  summary: Record<string, string | number>;
}
export const reportService = {
  get: async (type: string, filters?: { business?: string; from?: string; to?: string }): Promise<ApiReportData> => {
    const { data } = await axiosClient.get(`/api/reports/${type}`, { params: filters || {} });
    return data;
  },
};

// ─── Dashboard (API-backed) ──────────────────────────────────────────────────
export interface ApiDashboardData {
  kpis: KpiItem[];
  chartBars: [number, number][];
  lowStock: { id: string; name: string; stock: number; min: number }[];
  transactions: { ref: string; type: string; party: string; amount: string; status: string; statusTone: string }[];
}
export const dashboardService = {
  get: async (business: string): Promise<ApiDashboardData> => {
    const { data } = await axiosClient.get('/api/dashboard', { params: { business } });
    return data;
  },
};

// ─── Bank (API-backed) ───────────────────────────────────────────────────
export interface ApiBankAccount {
  id: string; accountName: string; bankName: string; accountNumber: string;
  ifscCode: string; currentBalance: number; type: string; business: string;
  createdAt: string;
}
export interface ApiBankTransaction {
  id: string; bankAccountId: string; date: string; type: string;
  description: string; amount: string; amountRaw: number;
  direction: string; account: string; reference: string;
}
export interface ApiBankResponse {
  kpis: KpiItem[];
  rows: ApiBankTransaction[];
  pagination: string;
}
export const bankService = {
  getAccounts: async (business?: string): Promise<ApiBankAccount[]> => {
    const { data } = await axiosClient.get('/api/bank/accounts', { params: business ? { business } : {} });
    return data;
  },
  createAccount: async (payload: Omit<ApiBankAccount, 'id' | 'createdAt'>): Promise<ApiBankAccount> => {
    const { data } = await axiosClient.post('/api/bank/accounts', payload);
    return data;
  },
  updateAccount: async (id: string, payload: Partial<ApiBankAccount>): Promise<ApiBankAccount> => {
    const { data } = await axiosClient.put(`/api/bank/accounts/${id}`, payload);
    return data;
  },
  deleteAccount: async (id: string) => { await axiosClient.delete(`/api/bank/accounts/${id}`); },
  getTransactions: async (filters?: { business?: string; accountId?: string; from?: string; to?: string }): Promise<ApiBankResponse> => {
    const { data } = await axiosClient.get('/api/bank/transactions', { params: filters || {} });
    return data;
  },
  createTransaction: async (payload: { bankAccountId: string; date: string; type: string; description: string; amount: number; direction: string; reference?: string }) => {
    const { data } = await axiosClient.post('/api/bank/transactions', payload);
    return data;
  },
  deleteTransaction: async (id: string) => { await axiosClient.delete(`/api/bank/transactions/${id}`); },
};

// ─── Cash (API-backed) ───────────────────────────────────────────────────
export interface ApiCashTransaction {
  id: string; date: string; type: string; description: string;
  amount: string; amountRaw: number; direction: string; reference: string;
}
export interface ApiCashResponse {
  kpis: KpiItem[];
  rows: ApiCashTransaction[];
  pagination: string;
}
export const cashService = {
  getAll: async (filters?: { business?: string; from?: string; to?: string }): Promise<ApiCashResponse> => {
    const { data } = await axiosClient.get('/api/cash/transactions', { params: filters || {} });
    return data;
  },
  create: async (payload: { date: string; type: string; description: string; amount: number; direction: string; business: string; reference?: string }) => {
    const { data } = await axiosClient.post('/api/cash/transactions', payload);
    return data;
  },
  remove: async (id: string) => { await axiosClient.delete(`/api/cash/transactions/${id}`); },
};

// ─── Payments (API-backed) ───────────────────────────────────────────────
export interface ApiPaymentRecord {
  id: string; refNumber: string; date: string; type: string;
  party: string; paymentMode: string; amount: string; amountRaw: number; notes: string;
}
export interface ApiPaymentsResponse {
  kpis: KpiItem[];
  rows: ApiPaymentRecord[];
  pagination: string;
}
export const paymentService = {
  getAll: async (filters?: { business?: string; type?: string; search?: string; from?: string; to?: string }): Promise<ApiPaymentsResponse> => {
    const { data } = await axiosClient.get('/api/payments', { params: filters || {} });
    return data;
  },
  create: async (payload: { refNumber: string; date: string; type: string; party: string; paymentMode: string; amount: number; notes?: string; business: string }) => {
    const { data } = await axiosClient.post('/api/payments', payload);
    return data;
  },
  update: async (id: string, payload: Partial<{ date: string; type: string; party: string; paymentMode: string; amount: number; notes: string }>) => {
    const { data } = await axiosClient.put(`/api/payments/${id}`, payload);
    return data;
  },
  remove: async (id: string) => { await axiosClient.delete(`/api/payments/${id}`); },
};

// ─── Finance (localStorage — to be migrated) ──────────────────────────────
export const financeService = {
  getLabour: async (): Promise<LabourPayment[]> =>
    getStoredData<LabourPayment[]>('rj_db_labour', INITIAL_LABOUR),

  addLabour: async (labour: Omit<LabourPayment, 'id'>): Promise<LabourPayment> => {
    const list = getStoredData<LabourPayment[]>('rj_db_labour', INITIAL_LABOUR);
    const newLab: LabourPayment = { ...labour, id: `lab-${Date.now()}` };
    setStoredData('rj_db_labour', [newLab, ...list]);
    return newLab;
  },

  getExpenses: async (): Promise<ExpenseRecord[]> =>
    getStoredData<ExpenseRecord[]>('rj_db_expenses', INITIAL_EXPENSES),

  addExpense: async (expense: Omit<ExpenseRecord, 'id'>): Promise<ExpenseRecord> => {
    const list = getStoredData<ExpenseRecord[]>('rj_db_expenses', INITIAL_EXPENSES);
    const newExp: ExpenseRecord = { ...expense, id: `exp-${Date.now()}` };
    setStoredData('rj_db_expenses', [newExp, ...list]);
    return newExp;
  },

  getBankAccounts: async (): Promise<BankAccount[]> =>
    getStoredData<BankAccount[]>('rj_db_banks', INITIAL_BANK_ACCOUNTS),

  getTransactions: async (): Promise<BankTransaction[]> =>
    getStoredData<BankTransaction[]>('rj_db_transactions', INITIAL_TRANSACTIONS),
};

// ─── Database Backup ───────────────────────────────────────────────────────
export const databaseBackupService = {
  exportDatabaseJSON: (): string => {
    const data = {
      products:     localStorage.getItem('rj_db_products'),
      suppliers:    localStorage.getItem('rj_db_suppliers'),
      stockIn:      localStorage.getItem('rj_db_stock_in'),
      stockOut:     localStorage.getItem('rj_db_stock_out'),
      labour:       localStorage.getItem('rj_db_labour'),
      expenses:     localStorage.getItem('rj_db_expenses'),
      banks:        localStorage.getItem('rj_db_banks'),
      transactions: localStorage.getItem('rj_db_transactions'),
      exportedAt:   new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },
  restoreDatabaseJSON: (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.products)     localStorage.setItem('rj_db_products', parsed.products);
      if (parsed.suppliers)    localStorage.setItem('rj_db_suppliers', parsed.suppliers);
      if (parsed.stockIn)      localStorage.setItem('rj_db_stock_in', parsed.stockIn);
      if (parsed.stockOut)     localStorage.setItem('rj_db_stock_out', parsed.stockOut);
      if (parsed.labour)       localStorage.setItem('rj_db_labour', parsed.labour);
      if (parsed.expenses)     localStorage.setItem('rj_db_expenses', parsed.expenses);
      if (parsed.banks)        localStorage.setItem('rj_db_banks', parsed.banks);
      if (parsed.transactions) localStorage.setItem('rj_db_transactions', parsed.transactions);
      return true;
    } catch {
      return false;
    }
  },
};
