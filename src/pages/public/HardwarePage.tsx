import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Tag } from 'antd';
import { Wrench, ShieldCheck, ShoppingCart, ArrowRight } from 'lucide-react';
import { INITIAL_PRODUCTS } from '../../data/paintsData';

export const HardwarePage: React.FC = () => {
  const hardwareItems = INITIAL_PRODUCTS.filter(
    (p) => p.category === 'Hardware & Fittings' || p.category === 'Brushes & Rollers'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 font-bold text-xs uppercase rounded-full inline-flex items-center mb-3">
          <Wrench className="w-3.5 h-3.5 mr-1" />
          Wholesale & Retail Hardware Section
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white">Hardware & Architectural Fittings</h1>
        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
          Godrej door locks, brass handles, stainless steel hinges, power tool accessories, paint rollers & masking tapes in Kovilpatti.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {hardwareItems.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              <img src={item.image} alt={item.name} className="h-44 w-full object-cover rounded-xl mb-4" />
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{item.category}</span>
              <h3 className="font-bold text-slate-900 text-base mt-1">{item.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{item.description}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-lg font-black text-slate-900">₹{item.sellingPrice}</span>
              <a
                href={`https://wa.me/919488475040?text=Hi%20RJ%20Paints,%20I%20want%20to%20buy%20${encodeURIComponent(item.name)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Inquire</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
