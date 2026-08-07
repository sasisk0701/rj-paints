import React from 'react';
import { BRANDS } from '../../data/paintsData';
import { ShieldCheck, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BrandsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-12">
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <span className="px-3.5 py-1 rounded-full bg-blue-900/80 border border-blue-700 text-blue-300 text-xs font-bold uppercase tracking-wider inline-flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1 text-amber-400" />
            Official Partnership
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white">Asian Paints Authorized Dealer</h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            RJ Paints & Hardwares is Kovilpatti's trusted authorized dealership for Asian Paints, Berger Paints, Nippon, Birla White wallcare putty, and Pidilite Dr. Fixit waterproofing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {BRANDS.map((brand) => (
          <div
            key={brand.id}
            className={`rounded-3xl p-8 border-2 transition-all flex flex-col justify-between ${
              brand.isAuthorized
                ? 'bg-blue-50/50 border-blue-600 shadow-xl'
                : 'bg-white border-slate-200 shadow-md'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <h3 className="text-2xl font-black text-slate-900">{brand.name}</h3>
                {brand.isAuthorized && (
                  <span className="px-3 py-1 bg-blue-600 text-white font-bold text-[10px] uppercase rounded-full shadow">
                    Authorized Dealer
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-4 leading-relaxed">{brand.description}</p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Kovilpatti Showroom Stock</span>
              <Link
                to={`/products?brand=${encodeURIComponent(brand.name)}`}
                className="text-blue-600 font-bold text-xs flex items-center hover:underline"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
