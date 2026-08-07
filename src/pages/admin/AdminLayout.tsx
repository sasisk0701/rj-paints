import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutGrid,
  Package,
  Tags,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  HardHat,
  Receipt,
  Landmark,
  FileSpreadsheet,
  Settings,
  LogOut,
  Bell,
  Search,
  ShieldCheck,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { Badge, Dropdown, MenuProps } from 'antd';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard Overview', path: '/admin', icon: LayoutGrid },
    { name: 'Products Inventory', path: '/admin/products', icon: Package },
    { name: 'Categories & Brands', path: '/admin/categories', icon: Tags },
    { name: 'Suppliers Master', path: '/admin/suppliers', icon: Users },
    { name: 'Stock In (Purchase)', path: '/admin/stock-in', icon: ArrowDownLeft },
    { name: 'Stock Out (Sales)', path: '/admin/stock-out', icon: ArrowUpRight },
    { name: 'Labour Payments', path: '/admin/labour', icon: HardHat },
    { name: 'Expense Logs', path: '/admin/expenses', icon: Receipt },
    { name: 'Bank & Accounts', path: '/admin/bank', icon: Landmark },
    { name: 'Reports & Export', path: '/admin/reports', icon: FileSpreadsheet },
    { name: 'System Settings', path: '/admin/settings', icon: Settings },
  ];

  const profileMenuItems: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <div className="px-2 py-1">
          <div className="font-bold text-slate-900">{user?.name}</div>
          <div className="text-xs text-slate-500">{user?.email}</div>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: '2',
      label: (
        <button onClick={handleLogout} className="flex items-center text-red-600 font-semibold w-full text-xs">
          <LogOut className="w-3.5 h-3.5 mr-2" />
          <span>Sign Out</span>
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-sans">
      {/* Mobile Header Topbar */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 font-black text-white flex items-center justify-center text-sm">
            RJ
          </div>
          <span className="font-bold text-sm">RJ Paints Admin</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-white">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col justify-between ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center shadow-lg">
              RJ
            </div>
            <div>
              <h2 className="font-black text-white text-base leading-tight">RJ PAINTS & STYLEO</h2>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Enterprise Admin Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-900 text-blue-300 font-bold flex items-center justify-center text-xs">
              SM
            </div>
            <div className="overflow-hidden">
              <span className="font-bold text-white text-xs block truncate">{user?.name || 'S. Madasamy'}</span>
              <span className="text-[10px] text-slate-500 block truncate">Owner & Admin</span>
            </div>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 p-1">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Body */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Active Management Module
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-900 text-sm">
              {navItems.find((n) => n.path === location.pathname)?.name || 'Admin Overview'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/" className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200">
              View Public Website →
            </Link>

            <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight">
              <div className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-full">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                  SM
                </div>
                <span className="text-xs font-bold text-slate-800">S. Madasamy</span>
              </div>
            </Dropdown>
          </div>
        </header>

        {/* Dynamic Page Router Outlet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
