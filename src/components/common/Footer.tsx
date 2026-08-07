import React from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { Phone, Mail, MapPin, Globe, Instagram, Facebook, Youtube, ArrowRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const { currentBusiness } = useBusiness();
  const isPaints = currentBusiness === 'paints';

  const socialLinks = [
    { Icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { Icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { Icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
  ];

  const quickLinks = isPaints
    ? [
        { name: 'Products', path: '/products' },
        { name: 'Brands', path: '/brands' },
        { name: 'Hardware', path: '/hardware' },
        { name: 'Shade Cards', path: '/shades' },
        { name: 'Paint Calculator', path: '/calculator' },
      ]
    : [
        { name: 'Services', path: '/interiors' },
        { name: 'Portfolio Gallery', path: '/gallery' },
        { name: 'Packages', path: '/interiors#packages' },
        { name: 'Contact Us', path: '/contact' },
      ];

  return (
    <footer style={{ background: 'linear-gradient(180deg, #060E1F 0%, #040810 100%)' }} className="border-t border-slate-800/50">

      {/* Upper Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-16 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand Column */}
        <div className="space-y-5 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg"
              style={{
                background: isPaints
                  ? 'linear-gradient(135deg, #0F3D87, #1D5BBF)'
                  : 'linear-gradient(135deg, #D97706, #F59E0B)',
              }}
            >
              {isPaints ? 'RJ' : 'SI'}
            </div>
            <div>
              <p className="text-white font-extrabold text-sm">
                {isPaints ? 'RJ Paints & Hardwares' : 'Styleo Interiors'}
              </p>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Kovilpatti, Tamil Nadu</p>
            </div>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">
            {isPaints
              ? 'Kovilpatti\'s most trusted Asian Paints authorized dealer. Serving homeowners and contractors with premium paints, hardware & tools.'
              : 'Creating luxury interiors with 3D design, BWP marine plywood, German hardware & turnkey civil execution across Tamil Nadu.'}
          </p>
          <div className="flex items-center gap-3">
            {socialLinks.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="w-9 h-9 rounded-xl border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all hover:-translate-y-0.5"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-5">Quick Links</h4>
          <ul className="space-y-3">
            {quickLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className="text-slate-500 hover:text-white text-sm transition-colors flex items-center gap-2 hover:gap-3"
                >
                  <ArrowRight className="w-3 h-3 flex-shrink-0" />
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Both Businesses */}
        <div>
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-5">Our Businesses</h4>
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-slate-800 hover:border-blue-800/50 transition-colors">
              <p className="text-xs font-extrabold text-blue-400 uppercase tracking-widest">RJ Paints & Hardwares</p>
              <p className="text-slate-500 text-[11px] mt-1">Asian Paints Authorized Dealer</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 hover:border-amber-800/50 transition-colors">
              <p className="text-xs font-extrabold text-amber-400 uppercase tracking-widest">Styleo Interiors</p>
              <p className="text-slate-500 text-[11px] mt-1">Interior & Construction Works</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-5">Contact Us</h4>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-slate-400 text-xs">Near New Bus Stand</p>
                <p className="text-slate-400 text-xs">Kovilpatti – 628501</p>
                <p className="text-slate-400 text-xs">Tamil Nadu, India</p>
              </div>
            </li>
            {[{ num: '9488475040' }, { num: '6381593537' }, { num: '9969429723' }].map(({ num }) => (
              <li key={num}>
                <a
                  href={`tel:${num}`}
                  className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-xs font-medium"
                >
                  <Phone className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  {num}
                </a>
              </li>
            ))}
            <li>
              <a
                href="mailto:rjpaintsandhardwares@gmail.com"
                className="flex items-start gap-3 text-slate-400 hover:text-white transition-colors text-xs"
              >
                <Mail className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                rjpaintsandhardwares@gmail.com
              </a>
            </li>
            <li>
              <a
                href="https://www.styleointeriors.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-xs"
              >
                <Globe className="w-4 h-4 text-slate-600 flex-shrink-0" />
                www.styleointeriors.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Rainbow Divider */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, #FF0055 0%, #FFB800 25%, #00E676 50%, #00B0FF 75%, #7C4DFF 100%)', opacity: 0.25 }} />

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-slate-600 text-xs">
          © {new Date().getFullYear()} RJ Paints & Hardwares / Styleo Interiors. All rights reserved.
          <span className="mx-2">•</span>Proprietor: S. Madasamy
        </p>
        <div className="flex items-center gap-4 text-slate-600 text-xs">
          <span>GST Registered</span>
          <span>•</span>
          <span>Asian Paints Authorized</span>
          <span>•</span>
          <span>Made in 🇮🇳</span>
        </div>
      </div>
    </footer>
  );
};
