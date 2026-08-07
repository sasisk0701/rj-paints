import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PAINT_CATEGORIES, BRANDS } from '../../data/paintsData';
import { PaintCalculator } from '../../components/paints/PaintCalculator';
import { ShadeCardVisualizer } from '../../components/paints/ShadeCardVisualizer';
import { TESTIMONIALS } from '../../data/interiorsData';
import { ArrowRight, Phone, ShieldCheck, Star, Sparkles, CheckCircle2 } from 'lucide-react';

const stats = [
  { value: '15+', label: 'Years Experience', color: '#FFB800' },
  { value: '2,000+', label: 'Projects Completed', color: '#60A5FA' },
  { value: '1,200+', label: 'Happy Customers', color: '#34D399' },
  { value: '100%', label: 'Genuine Stock', color: '#F472B6' },
];

const whyUs = [
  'Official Asian Paints Authorized Dealer in Kovilpatti',
  '100% genuine products direct from factory depot',
  'Expert colour consultation & paint estimations free',
  'Wholesale & retail pricing for contractors',
  'Same-day delivery within Kovilpatti town',
  'GST invoicing & warranty on all products',
];

export const PaintsHomePage: React.FC = () => {
  return (
    <div>
      {/* ═══════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20 sm:py-28 lg:py-36"
        style={{ background: 'linear-gradient(135deg, #060E1F 0%, #0A1929 40%, #0F2D5A 100%)' }}
      >
        {/* Background glows */}
        <div
          className="gradient-blob"
          style={{ width: 600, height: 600, top: -100, right: -150, background: 'rgba(15, 61, 135, 0.35)' }}
        />
        <div
          className="gradient-blob"
          style={{ width: 400, height: 400, bottom: -80, left: -80, background: 'rgba(255, 184, 0, 0.15)', animationDelay: '-3s' }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="space-y-8"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold"
                style={{ background: 'rgba(15, 61, 135, 0.4)', borderColor: 'rgba(96, 165, 250, 0.3)', color: '#93C5FD' }}>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Asian Paints Authorized Dealer • Kovilpatti, Tamil Nadu
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08]">
                  Transform Your
                  <br />
                  <span className="rainbow-text">Space With</span>
                  <br />
                  Premium Paints
                </h1>
                <p className="text-slate-300 text-base sm:text-lg max-w-lg leading-relaxed mt-4">
                  Kovilpatti's most trusted paint store. Explore Asia's #1 brand — Asian Paints Royale Luxury Emulsion, Apex Ultima, Berger, Birla White WallCare Putty & professional hardware.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  to="/products"
                  className="flex items-center gap-2 px-7 py-4 rounded-2xl text-sm font-extrabold text-white shadow-2xl transition-all hover:-translate-y-1"
                  style={{ background: 'linear-gradient(135deg, #1D5BBF 0%, #0F3D87 100%)', boxShadow: '0 12px 40px rgba(15,61,135,0.45)' }}
                >
                  Explore Paint Products
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/calculator"
                  className="flex items-center gap-2 px-7 py-4 rounded-2xl text-sm font-extrabold border-2 transition-all hover:-translate-y-1"
                  style={{ borderColor: '#FFB800', color: '#FFB800', background: 'transparent' }}
                >
                  🎨 Paint Calculator
                </Link>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="stat-card text-center">
                    <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-xs text-slate-400 mt-1 leading-tight">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="relative hidden lg:block"
            >
              {/* Main Image Card */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <img
                  src="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=900&q=85"
                  alt="Asian Paints Premium Interior"
                  className="w-full h-[520px] object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(6,14,31,0.8) 0%, rgba(6,14,31,0.1) 50%, transparent 100%)' }}
                />
                {/* Floating info card */}
                <div className="absolute bottom-6 left-6 right-6 glass-card-dark p-4 rounded-2xl border"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Kovilpatti Showroom</p>
                      <p className="text-sm font-bold text-white mt-0.5">S. Madasamy — Proprietor</p>
                      <p className="text-xs text-slate-400">Near New Bus Stand, Kovilpatti - 628501</p>
                    </div>
                    <div className="text-right">
                      <div className="flex text-amber-400 text-sm">★★★★★</div>
                      <p className="text-xs text-slate-400 mt-0.5">5.0 Google Rating</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Authorized Badge */}
              <div className="absolute -top-5 -right-5 glass-card-dark rounded-2xl px-4 py-3 border shadow-2xl"
                style={{ borderColor: 'rgba(96,165,250,0.2)' }}>
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Authorized</p>
                <p className="text-lg font-black text-white">Asian Paints</p>
                <p className="text-xs text-slate-400">Official Dealer</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          BRANDS TRUST BAR
      ═══════════════════════════════════════ */}
      <section className="bg-white border-b border-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Authorized Partners & Stocked Brands</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            {BRANDS.map((brand) => (
              <div
                key={brand.id}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ borderColor: brand.isAuthorized ? '#BFDBFE' : '#F1F5F9', background: brand.isAuthorized ? '#EFF6FF' : '#F8FAFC' }}
              >
                <span className="font-extrabold text-sm text-slate-800">{brand.name}</span>
                {brand.isAuthorized && (
                  <span className="text-[9px] font-black text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                    Auth
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PRODUCT CATEGORIES GRID
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Wide Selection</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Browse By Category</h2>
              <p className="text-slate-500 text-sm mt-2 max-w-md">From interior silk emulsion to waterproofing chemicals — all categories stocked fresh from the factory</p>
            </div>
            <Link
              to="/products"
              className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
            >
              View All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PAINT_CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <Link
                  to={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="product-card group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl flex flex-col block"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    <div
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase"
                      style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', color: 'white' }}
                    >
                      In Stock
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{cat.description}</p>
                    <div className="flex items-center gap-1 mt-4 text-xs font-bold text-blue-600 group-hover:gap-2 transition-all">
                      Shop Now <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          WHY CHOOSE US
      ═══════════════════════════════════════ */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #0A1929 0%, #0F2D5A 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">Why Customers Trust Us</p>
                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  Kovilpatti's Premier<br />Paint & Hardware Expert
                </h2>
                <p className="text-slate-400 text-sm mt-4 leading-relaxed max-w-md">
                  With over 15 years of serving contractors, builders, and homeowners across Kovilpatti, we are the most trusted Asian Paints partner in Tamil Nadu.
                </p>
              </div>
              <ul className="space-y-3">
                {whyUs.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4 flex flex-wrap gap-4">
                <a
                  href="tel:9488475040"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-extrabold text-slate-900 transition-all hover:-translate-y-1"
                  style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF8C00 100%)', boxShadow: '0 8px 30px rgba(255,184,0,0.35)' }}
                >
                  <Phone className="w-4 h-4" />
                  Call 9488475040
                </a>
                <a
                  href={`https://wa.me/919488475040?text=Hi%20RJ%20Paints%2C%20I%20need%20a%20paint%20quote.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-extrabold text-white border-2 transition-all hover:-translate-y-1"
                  style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  💬 WhatsApp Quote
                </a>
              </div>
            </div>

            {/* Image collage */}
            <div className="grid grid-cols-2 gap-4 hidden lg:grid">
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden h-48 border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <img src="https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80"
                    alt="Exterior Paint" className="w-full h-full object-cover" />
                </div>
                <div className="rounded-2xl overflow-hidden h-64 border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <img src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80"
                    alt="Paint Store" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="rounded-2xl overflow-hidden h-64 border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <img src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80"
                    alt="Interior Paint" className="w-full h-full object-cover" />
                </div>
                <div className="rounded-2xl overflow-hidden h-48 border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <img src="https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=600&q=80"
                    alt="Hardware" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          INTERACTIVE PAINT CALCULATOR
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Free Tool</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Asian Paints Quantity Estimator</h2>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
              Enter room dimensions to instantly calculate how many paint cans you need with accurate GST pricing
            </p>
          </div>
          <PaintCalculator />
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SHADE CARD VISUALIZER
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Digital Shade Cards</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Pick Your Perfect Wall Colour</h2>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
              Visualize Asian Paints colour shades live on a photorealistic room before ordering
            </p>
          </div>
          <ShadeCardVisualizer />
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Customer Reviews</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">What Kovilpatti Says</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="flex text-amber-400 mb-4 text-sm">
                  {'★'.repeat(t.rating)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold text-xs flex items-center justify-center">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role} • {t.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          BOTTOM CTA BANNER
      ═══════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div
            className="rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0A1929 0%, #0F3D87 50%, #1D5BBF 100%)' }}
          >
            <div className="gradient-blob" style={{ width: 400, height: 400, top: -100, right: -100, background: 'rgba(255,184,0,0.15)' }} />
            <div className="relative z-10">
              <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-4" />
              <h3 className="text-3xl sm:text-4xl font-black text-white mb-3">
                Need Bulk Supply For Your Next Project?
              </h3>
              <p className="text-slate-300 text-sm sm:text-base mb-8 max-w-2xl mx-auto">
                Call S. Madasamy directly for wholesale Asian Paints pricing, contractor discounts & same-day Kovilpatti delivery for civil, residential and commercial projects.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="tel:9488475040"
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-extrabold text-slate-900 shadow-2xl transition-all hover:-translate-y-1"
                  style={{ background: 'linear-gradient(135deg, #FFB800, #FF8C00)', boxShadow: '0 12px 40px rgba(255,184,0,0.4)' }}
                >
                  <Phone className="w-4 h-4" /> 9488475040
                </a>
                <a
                  href={`https://wa.me/919488475040`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-extrabold text-white border-2 transition-all hover:-translate-y-1"
                  style={{ borderColor: 'rgba(255,255,255,0.25)' }}
                >
                  💬 WhatsApp Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
