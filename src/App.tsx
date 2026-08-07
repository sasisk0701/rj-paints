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
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategoriesBrands />} />
              <Route path="suppliers" element={<AdminSuppliers />} />
              <Route path="stock-in" element={<AdminStockIn />} />
              <Route path="stock-out" element={<AdminStockOut />} />
              <Route path="labour" element={<AdminLabour />} />
              <Route path="expenses" element={<AdminExpenses />} />
              <Route path="bank" element={<AdminBank />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Fallback wildcard route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </BusinessProvider>
    </AuthProvider>
  );
};

export default App;
