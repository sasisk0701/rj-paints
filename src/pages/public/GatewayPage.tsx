import React from 'react';
import { motion } from 'framer-motion';
import { useBusiness } from '../../context/BusinessContext';
import { useNavigate } from 'react-router-dom';
import { Paintbrush, Building2, ArrowRight, Phone, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const GatewayPage: React.FC = () => {
  const { setBusiness } = useBusiness();
  const navigate = useNavigate();

  const handleChoose = (type: 'paints' | 'interiors') => {
    setBusiness(type);
    navigate('/');
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(135deg, #040810 0%, #060E1F 50%, #08111F 100%)' }}>

      {/* Background effects */}
      <div className="gradient-blob" style={{ width: 800, height: 800, top: -200, right: -300, background: 'rgba(15, 61, 135, 0.2)' }} />
      <div className="gradient-blob" style={{ width: 600, height: 600, bottom: -200, left: -200, background: 'rgba(217, 119, 6, 0.15)', animationDelay: '-5s' }} />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      {/* Header */}
      <div className="relative z-10 px-6 sm:px-10 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0F3D87 0%, #F59E0B 100%)' }}>
            RJ
          </div>
          <div>
            <p className="text-base font-black text-white tracking-tight">RJ PAINTS & STYLEO INTERIORS</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">S. Madasamy • Kovilpatti, Tamil Nadu</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold"
          style={{ borderColor: 'rgba(96,165,250,0.2)', color: '#93C5FD', background: 'rgba(15,61,135,0.2)' }}>
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          Asian Paints Authorized Dealer
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 max-w-5xl mx-auto w-full">

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-extrabold uppercase tracking-wider"
            style={{ borderColor: 'rgba(251,191,36,0.25)', color: '#FCD34D', background: 'rgba(245,158,11,0.1)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            Welcome to Our Enterprise Platform
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
            Which Service Do You <span className="rainbow-text">Require Today?</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Select your preferred service below to tailor your entire experience, products & pricing.
          </p>
        </motion.div>

        {/* Dual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">

          {/* Paints Card */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -10, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleChoose('paints')}
            className="cursor-pointer rounded-3xl p-8 relative overflow-hidden border-2 transition-all group"
            style={{ background: 'linear-gradient(135deg, #060E1F 0%, #0A1929 100%)', borderColor: 'rgba(96,165,250,0.15)' }}
          >
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'radial-gradient(ellipse at top right, rgba(29,91,191,0.2) 0%, transparent 70%)' }} />

            <div className="relative z-10 space-y-6">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
                style={{ background: 'linear-gradient(135deg, #0F3D87 0%, #1D5BBF 100%)', boxShadow: '0 12px 40px rgba(15,61,135,0.5)' }}>
                <Paintbrush className="w-8 h-8 text-white" />
              </div>

              <div>
                <span className="text-xs font-extrabold text-blue-400 uppercase tracking-widest block mb-1">
                  Asian Paints Authorized Store
                </span>
                <h2 className="text-2xl font-black text-white">RJ Paints & Hardwares</h2>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed">
                Explore Royale Luxury Emulsion, Apex Ultima, Berger, Nippon, Birla White WallCare putty, hardware fittings & professional painting tools in Kovilpatti.
              </p>

              <ul className="space-y-2">
                {['Interactive Wall Paint Calculator', 'Asian Paints Digital Shade Cards', 'Hardware & Tool Store'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="text-blue-400 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                  Enter Paints Store <ArrowRight className="w-4 h-4" />
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <ArrowRight className="w-4 h-4 text-blue-400 group-hover:text-white" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Interiors Card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -10, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleChoose('interiors')}
            className="cursor-pointer rounded-3xl p-8 relative overflow-hidden border-2 transition-all group"
            style={{ background: 'linear-gradient(135deg, #0A0500 0%, #1A0A00 100%)', borderColor: 'rgba(251,191,36,0.15)' }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'radial-gradient(ellipse at top right, rgba(217,119,6,0.2) 0%, transparent 70%)' }} />

            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
                style={{ background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)', boxShadow: '0 12px 40px rgba(217,119,6,0.5)' }}>
                <Building2 className="w-8 h-8 text-slate-900" />
              </div>

              <div>
                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest block mb-1">
                  Turnkey Interior & Civil
                </span>
                <h2 className="text-2xl font-black text-white">Styleo Interiors & Construction</h2>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed">
                Custom acrylic modular kitchens, Gyproc false ceilings, sliding wardrobes, 3D photorealistic interior design & complete residential civil building works.
              </p>

              <ul className="space-y-2">
                {['Before & After Renovation Slider', '3D Photorealistic Design First', 'Turnkey Civil Construction'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="text-amber-400 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                  Explore Interiors <ArrowRight className="w-4 h-4" />
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-600/20 flex items-center justify-center group-hover:bg-amber-600 transition-colors">
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:text-slate-900" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="relative z-10 border-t px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-xs text-slate-600">Near New Bus Stand, Kovilpatti – 628501, Tamil Nadu</p>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <a href="tel:9488475040" className="hover:text-slate-300 flex items-center gap-1 transition-colors">
            <Phone className="w-3 h-3" /> 9488475040
          </a>
          <span className="text-slate-700">•</span>
          <a href="mailto:rjpaintsandhardwares@gmail.com" className="hover:text-slate-300 transition-colors">
            rjpaintsandhardwares@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
};
