import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../context/AuthContext';
import { BusinessSwitcherModal } from './BusinessSwitcherModal';
import { Phone, RefreshCw, Menu, X, Lock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Header: React.FC = () => {
  const { currentBusiness, toggleBusiness, isModalOpen, setIsModalOpen } = useBusiness();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPaints = currentBusiness === 'paints';

  const paintsLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'Brands', path: '/brands' },
    { name: 'Hardware', path: '/hardware' },
    { name: 'Calculator', path: '/calculator' },
    { name: 'Shade Cards', path: '/shades' },
    { name: 'Contact', path: '/contact' },
  ];

  const interiorsLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/interiors' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Packages', path: '/interiors#packages' },
    { name: 'Contact', path: '/contact' },
  ];

  const navLinks = isPaints ? paintsLinks : interiorsLinks;

  return (
    <>
      {/* ─── Top Strip ─── */}
      <div
        style={{
          background: isPaints
            ? 'linear-gradient(90deg, #060E1F 0%, #0A1929 100%)'
            : 'linear-gradient(90deg, #0A0500 0%, #1A0A00 100%)',
        }}
        className="text-slate-400 text-xs py-2 px-4 sm:px-8"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex items-center space-x-3">
            <span
              className="font-bold text-xs"
              style={{ color: isPaints ? '#60A5FA' : '#FCD34D' }}
            >
              ✦ {isPaints ? 'Asian Paints Authorized Dealer' : 'Turnkey Interior & Civil Works'}
            </span>
            <span className="text-slate-600 hidden md:inline">•</span>
            <span className="text-slate-500 hidden md:inline">S. Madasamy, Kovilpatti</span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="tel:9488475040"
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs font-medium"
            >
              <Phone className="w-3 h-3" /> 9488475040
            </a>
            <a
              href="tel:6381593537"
              className="hidden sm:flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs font-medium"
            >
              <Phone className="w-3 h-3" /> 6381593537
            </a>
            <Link
              to={isAuthenticated ? '/admin' : '/login'}
              className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded"
              style={{ color: isPaints ? '#60A5FA' : '#FCD34D' }}
            >
              <Lock className="w-3 h-3" />
              {isAuthenticated ? 'Dashboard' : 'Admin'}
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Main Header ─── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-6">

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg transition-transform group-hover:scale-105"
              style={{
                background: isPaints
                  ? 'linear-gradient(135deg, #0F3D87 0%, #1D5BBF 60%, #3B82F6 100%)'
                  : 'linear-gradient(135deg, #92400E 0%, #D97706 60%, #F59E0B 100%)',
              }}
            >
              {isPaints ? 'RJ' : 'SI'}
            </div>
            <div className="hidden sm:block">
              <div className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {isPaints ? (
                  <><span className="text-slate-900">RJ PAINTS</span>
                  <span style={{ color: '#0F3D87' }}> & HARDWARES</span></>
                ) : (
                  <><span className="text-slate-900">STYLEO</span>
                  <span style={{ color: '#D97706' }}> INTERIORS</span></>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {isPaints ? 'Asian Paints Dealer • Kovilpatti' : 'Interior & Construction Works'}
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? isPaints
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            {/* Business Switcher */}
            <button
              onClick={toggleBusiness}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 border-2"
              style={isPaints ? {
                background: '#0A1929',
                color: '#FCD34D',
                borderColor: '#1E3A5F',
              } : {
                background: '#F0F4FF',
                color: '#0F3D87',
                borderColor: '#BFDBFE',
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {isPaints ? '→ Interiors' : '→ Paints Store'}
              </span>
            </button>

            {/* Primary CTA */}
            {isPaints ? (
              <Link
                to="/calculator"
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF8C00 100%)', color: '#0A1929' }}
              >
                🎨 Paint Calculator
              </Link>
            ) : (
              <a
                href="https://wa.me/919488475040?text=Hi%20Styleo%20Interiors,%20I%20need%20a%20free%20interior%20design%20consultation."
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' }}
              >
                💬 Free 3D Quote
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Rainbow Accent Line */}
        <div
          className="h-0.5 w-full"
          style={{ background: 'linear-gradient(90deg, #FF0055 0%, #FFB800 25%, #00E676 50%, #00B0FF 75%, #7C4DFF 100%)' }}
        />

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden bg-white border-b border-slate-100 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 px-4 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => { toggleBusiness(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
                    style={{ background: isPaints ? '#0A1929' : 'linear-gradient(135deg, #0F3D87, #1D5BBF)' }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Switch to {isPaints ? 'Styleo Interiors' : 'RJ Paints Store'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <BusinessSwitcherModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
