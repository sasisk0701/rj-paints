import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { INTERIOR_SERVICES, PORTFOLIO_PROJECTS, INTERIOR_PACKAGES, DESIGN_PROCESS_STEPS, TESTIMONIALS } from '../../data/interiorsData';
import { BeforeAfterSlider } from '../../components/interiors/BeforeAfterSlider';
import { ProjectInquiryModal } from '../../components/interiors/ProjectInquiryModal';
import { ArrowRight, CheckCircle2, Phone, Sparkles, Star } from 'lucide-react';

const stats = [
  { value: '150+', label: 'Interiors Delivered', color: '#F59E0B' },
  { value: '5 Yr', label: 'Service Warranty', color: '#34D399' },
  { value: '3D First', label: 'Design Approach', color: '#60A5FA' },
  { value: '100%', label: 'BWP Marine Ply', color: '#F472B6' },
];

export const InteriorsHomePage: React.FC = () => {
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('Modular Kitchen');

  const openInquiry = (service?: string) => {
    if (service) setSelectedService(service);
    setInquiryOpen(true);
  };

  return (
    <div>
      {/* ═══════════════════════════════════════
          LUXURY HERO SECTION
      ═══════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20 sm:py-28 lg:py-36"
        style={{ background: 'linear-gradient(135deg, #060400 0%, #1A0A00 40%, #3D1500 100%)' }}
      >
        <div className="gradient-blob" style={{ width: 700, height: 700, top: -200, right: -200, background: 'rgba(217, 119, 6, 0.2)' }} />
        <div className="gradient-blob" style={{ width: 400, height: 400, bottom: -100, left: -50, background: 'rgba(15, 61, 135, 0.15)', animationDelay: '-4s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold"
                style={{ background: 'rgba(217,119,6,0.2)', borderColor: 'rgba(251,191,36,0.3)', color: '#FCD34D' }}>
                <Sparkles className="w-4 h-4 text-amber-400" />
                Turnkey Interior & Civil Execution • Kovilpatti
              </div>

              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08]">
                  Crafting
                  <br />
                  <span style={{
                    background: 'linear-gradient(90deg, #F59E0B 0%, #EF4444 50%, #EC4899 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Opulent Interiors
                  </span>
                  <br />
                  Since 2009
                </h1>
                <p className="text-slate-300 text-base sm:text-lg max-w-lg leading-relaxed mt-4">
                  From photorealistic 3D interior design and BWP marine ply modular kitchens to Gyproc false ceilings, lacquered glass wardrobes & full residential civil construction in Kovilpatti.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => openInquiry('Full Villa Interior')}
                  className="flex items-center gap-2 px-7 py-4 rounded-2xl text-sm font-extrabold text-slate-900 shadow-2xl transition-all hover:-translate-y-1"
                  style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 12px 40px rgba(245,158,11,0.4)' }}
                >
                  Get Free 3D Design Quote
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  to="/gallery"
                  className="flex items-center gap-2 px-7 py-4 rounded-2xl text-sm font-extrabold text-white border-2 transition-all hover:-translate-y-1"
                  style={{ borderColor: 'rgba(251,191,36,0.4)' }}
                >
                  View Portfolio
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map((s) => (
                  <div key={s.label} className="stat-card text-center">
                    <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs text-slate-400 mt-1 leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2"
                style={{ borderColor: 'rgba(251,191,36,0.15)' }}>
                <img
                  src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85"
                  alt="Styleo Luxury Interior"
                  className="w-full h-[520px] object-cover"
                />
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(6,4,0,0.75) 0%, transparent 60%)' }} />
                <div className="absolute bottom-6 left-6 right-6 glass-card-dark p-4 rounded-2xl border"
                  style={{ borderColor: 'rgba(251,191,36,0.15)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Styleo Interiors</p>
                      <p className="text-sm font-bold text-white mt-0.5">Proprietor: S. Madasamy</p>
                      <p className="text-xs text-slate-400">www.styleointeriors.com</p>
                    </div>
                    <button
                      onClick={() => openInquiry()}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900"
                      style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                    >
                      Book Now →
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-5 -right-5 glass-card-dark rounded-2xl px-4 py-3 border shadow-2xl"
                style={{ borderColor: 'rgba(251,191,36,0.15)' }}>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Warranty</p>
                <p className="text-lg font-black text-white">5 Years</p>
                <p className="text-xs text-slate-400">All Projects</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SERVICES GRID
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Our Core Expertise</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">End-to-End Interior & Civil Services</h2>
            <p className="text-slate-500 text-sm mt-3 max-w-lg mx-auto">
              All services executed with precision German hardware, BWP marine plywood & photorealistic 3D design first
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {INTERIOR_SERVICES.map((srv, i) => (
              <motion.div
                key={srv.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="product-card group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl flex flex-col"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={srv.image}
                    alt={srv.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 rounded-lg text-xs font-bold text-amber-400"
                      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                      {srv.tagline}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                      {srv.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{srv.description}</p>
                    <ul className="mt-4 space-y-1.5">
                      {srv.features.map((f, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => openInquiry(srv.title)}
                    className="mt-6 w-full py-3 rounded-xl text-xs font-extrabold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' }}
                  >
                    Inquire About {srv.title}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          BEFORE / AFTER SLIDER
      ═══════════════════════════════════════ */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #0A0500 0%, #1A0A00 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">Transformation Proof</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Before & After Renovations</h2>
            <p className="text-slate-400 text-sm mt-2">Drag the slider to reveal the Styleo difference</p>
          </div>
          <BeforeAfterSlider />
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PACKAGES
      ═══════════════════════════════════════ */}
      <section id="packages" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Transparent Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Interior Renovation Packages</h2>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">All-inclusive packages backed by material transparency</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {INTERIOR_PACKAGES.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-3xl p-8 flex flex-col justify-between border-2 transition-all ${
                  pkg.recommended ? 'scale-105 shadow-2xl' : 'shadow-lg'
                }`}
                style={{
                  background: pkg.recommended ? 'linear-gradient(135deg, #0A0500 0%, #1A0A00 100%)' : 'white',
                  borderColor: pkg.recommended ? '#D97706' : '#F1F5F9',
                }}
              >
                {pkg.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-[11px] font-black text-slate-900 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                    ⭐ Most Popular
                  </div>
                )}

                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest ${pkg.recommended ? 'text-amber-400' : 'text-amber-600'}`}>
                    {pkg.target}
                  </p>
                  <h3 className={`text-2xl font-extrabold mt-1 ${pkg.recommended ? 'text-white' : 'text-slate-900'}`}>
                    {pkg.name}
                  </h3>
                  <div className={`mt-4 pb-4 border-b ${pkg.recommended ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className={`text-3xl font-black ${pkg.recommended ? 'text-amber-400' : 'text-slate-900'}`}>
                      {pkg.price}
                    </span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {pkg.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${pkg.recommended ? 'text-amber-400' : 'text-amber-600'}`} />
                        <span className={`text-sm ${pkg.recommended ? 'text-slate-300' : 'text-slate-600'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => openInquiry(pkg.name)}
                  className="mt-8 w-full py-4 rounded-2xl text-sm font-extrabold transition-all hover:opacity-90 hover:-translate-y-0.5"
                  style={{
                    background: pkg.recommended
                      ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                      : 'linear-gradient(135deg, #1E293B, #0F172A)',
                    color: pkg.recommended ? '#0A0500' : 'white',
                  }}
                >
                  Book Package Consultation
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PROCESS STEPS
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Hassle-Free Execution</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Our 5-Step Turnkey Process</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {DESIGN_PROCESS_STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 text-center"
              >
                <span className="text-5xl font-black text-amber-400/20 block">{step.step}</span>
                <h4 className="font-bold text-slate-900 text-sm mt-2">{step.title}</h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{step.desc}</p>
                {i < DESIGN_PROCESS_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 text-amber-400 font-black text-lg">→</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Client Stories</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Kovilpatti Homeowners Trust Us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="text-amber-400 mb-4 text-sm">{'★'.repeat(t.rating)}</div>
                <p className="text-slate-600 text-sm leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-full text-white font-bold text-xs flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #D97706, #B45309)' }}>
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
          BOTTOM CTA
      ═══════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div
            className="rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0A0500 0%, #2D1200 50%, #8B4513 100%)' }}
          >
            <div className="gradient-blob" style={{ width: 400, height: 400, top: -100, left: -100, background: 'rgba(245,158,11,0.15)' }} />
            <div className="relative z-10">
              <h3 className="text-3xl sm:text-4xl font-black text-white mb-3">
                Ready to Transform Your Space?
              </h3>
              <p className="text-slate-300 text-sm sm:text-base mb-8 max-w-xl mx-auto">
                Get a free 3D photorealistic interior design consultation from S. Madasamy and discover what your home could look like.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => openInquiry('Full Villa Interior')}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-extrabold text-slate-900 shadow-2xl transition-all hover:-translate-y-1"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 12px 40px rgba(245,158,11,0.4)' }}
                >
                  Get Free Design Consultation
                </button>
                <a
                  href="tel:9488475040"
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-extrabold text-white border-2 transition-all hover:-translate-y-1"
                  style={{ borderColor: 'rgba(251,191,36,0.3)' }}
                >
                  <Phone className="w-4 h-4" /> 9488475040
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProjectInquiryModal
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        defaultService={selectedService}
      />
    </div>
  );
};
