import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { BusinessProvider, useBusiness } from './context/BusinessContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';

// Public Pages
import { GatewayPage } from './pages/public/GatewayPage';
import { PaintsHomePage } from './pages/public/PaintsHomePage';
import { InteriorsHomePage } from './pages/public/InteriorsHomePage';
import { ProductsPage } from './pages/public/ProductsPage';
import { HardwarePage } from './pages/public/HardwarePage';
import { BrandsPage } from './pages/public/BrandsPage';
import { GalleryPage } from './pages/public/GalleryPage';
import { PaintCalculatorPage } from './pages/public/PaintCalculatorPage';
import { ShadeCardsPage } from './pages/public/ShadeCardsPage';
import { ContactPage } from './pages/public/ContactPage';
import { AdminLoginPage } from './pages/public/AdminLoginPage';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminCategoriesBrands } from './pages/admin/AdminCategoriesBrands';
import { AdminSuppliers } from './pages/admin/AdminSuppliers';
import { AdminStockIn } from './pages/admin/AdminStockIn';
import { AdminStockOut } from './pages/admin/AdminStockOut';
import { AdminLabour } from './pages/admin/AdminLabour';
import { AdminExpenses } from './pages/admin/AdminExpenses';
import { AdminBank } from './pages/admin/AdminBank';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminSettings } from './pages/admin/AdminSettings';
import { ToggleProvider } from './context/ToggleContext';

import AppShell from './pages/admin/AppShell.tsx';

import Dashboard from './pages/admin/Dashboard.tsx';
import Products from './pages/admin/Products.tsx';
import Categories from './pages/admin/Categories.tsx';
import StockOverview from './pages/admin/StockOverview.tsx';
import StockIn from './pages/admin/StockIn.tsx';
import StockOut from './pages/admin/StockOut.tsx';
import StockMaintenance from './pages/admin/StockMaintenance.tsx';
import Purchases from './pages/admin/Purchases.tsx';
import Sales from './pages/admin/Sales.tsx';
import Customers from './pages/admin/Customers.tsx';
import Suppliers from './pages/admin/Suppliers.tsx';
import Bank from './pages/admin/Bank.tsx';
import Cash from './pages/admin/Cash.tsx';
import Payments from './pages/admin/Payments.tsx';
import Expenses from './pages/admin/Expenses.tsx';
import Reports from './pages/admin/Reports.tsx';
import UsersPage from "./pages/admin/Users.tsx";
import Settings from './pages/admin/Settings.tsx';
import ActivityLog from './pages/admin/ActivityLog.tsx';


// Dynamic Home Selector Component
const DynamicHomePage: React.FC = () => {
  const { currentBusiness } = useBusiness();
  return currentBusiness === 'paints' ? <PaintsHomePage /> : <InteriorsHomePage />;
};

// Public Layout Wrapper
const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// Protected Admin Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BusinessProvider>
        <ToggleProvider>
        <BrowserRouter>
          <Routes>
            {/* Gateway Page */}
            <Route path="/gateway" element={<GatewayPage />} />

            {/* Public Layout Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<DynamicHomePage />} />
              <Route path="/paints" element={<PaintsHomePage />} />
              <Route path="/interiors" element={<InteriorsHomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/hardware" element={<HardwarePage />} />
              <Route path="/brands" element={<BrandsPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/calculator" element={<PaintCalculatorPage />} />
              <Route path="/shades" element={<ShadeCardsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<AdminLoginPage />} />
            </Route>

            {/* Protected Admin Dashboard Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />

            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="stock" element={<StockOverview />} />
            <Route path="stock-in" element={<StockIn />} />
            <Route path="stock-out" element={<StockOut />} />
            <Route path="stock-maintenance" element={<StockMaintenance />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="sales" element={<Sales />} />
            <Route path="customers" element={<Customers />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="bank" element={<Bank />} />
            <Route path="cash" element={<Cash />} />
            <Route path="payments" element={<Payments />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="activity-log" element={<ActivityLog />} />

            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>

            {/* Fallback wildcard route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </ToggleProvider>
      </BusinessProvider>
    </AuthProvider>
  );
};

export default App;
