import React, { useState } from 'react';
import { Card, Tag } from 'antd';
import { SHADE_COLORS } from '../../data/paintsData';
import { ShadeColor } from '../../types';
import { Palette, Check, Sparkles, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export const ShadeCardVisualizer: React.FC = () => {
  const [selectedColor, setSelectedColor] = useState<ShadeColor>(SHADE_COLORS[1]); // Royal Velvet Blue
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(SHADE_COLORS.map((c) => c.category)))];

  const filteredColors = selectedCategory === 'All'
    ? SHADE_COLORS
    : SHADE_COLORS.filter((c) => c.category === selectedCategory);

  return (
    <Card className="shadow-xl rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-600 text-white flex items-center justify-center shadow-md">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Asian Paints Digital Shade Cards</h3>
            <p className="text-xs text-slate-500">Pick your favorite shade code and preview live room wall aesthetics</p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto max-w-full pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Left Color Swatches Palette */}
        <div className="lg:col-span-6 space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Available Authorized Dealer Palette ({filteredColors.length} Shades)
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-2">
            {filteredColors.map((color) => {
              const isSelected = selectedColor.code === color.code;
              return (
                <motion.div
                  key={color.code}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedColor(color)}
                  className={`cursor-pointer rounded-xl p-3 border-2 transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 shadow-lg ring-2 ring-blue-300 ring-offset-1 bg-blue-50/20'
                      : 'border-slate-200 hover:border-slate-400 bg-white'
                  }`}
                >
                  <div
                    className="w-full h-16 rounded-lg shadow-inner relative flex items-center justify-center"
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center shadow">
                        <Check className="w-4 h-4 font-bold text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">{color.name}</span>
                      {color.popular && <Sparkles className="w-3 h-3 text-amber-500" />}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Shade: #{color.code}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Live Room Preview */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2 block">
            Live Wall Visualization Preview
          </span>

          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 h-80 sm:h-96 flex flex-col justify-end p-6">
            {/* Dynamic Wall Surface background */}
            <div
              className="absolute inset-0 transition-colors duration-700 ease-in-out"
              style={{ backgroundColor: selectedColor.hex }}
            />

            {/* Room furniture overlay image mask */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/40 pointer-events-none" />

            <img
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80"
              alt="Living Room Overlay"
              className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-75"
            />

            {/* Selected Shade Details Card Overlay */}
            <div className="relative z-10 bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-xl border border-white/20 shadow-xl max-w-sm">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-lg shadow border border-white/50"
                  style={{ backgroundColor: selectedColor.hex }}
                />
                <div>
                  <h4 className="text-base font-bold text-white leading-tight">{selectedColor.name}</h4>
                  <p className="text-xs text-slate-300">Asian Paints Code: #{selectedColor.code} • {selectedColor.category}</p>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                <span>Available at Kovilpatti Store</span>
                <a
                  href={`https://wa.me/919488475040?text=Hi%20RJ%20Paints,%20I%20want%20Asian%20Paints%20Shade%20${encodeURIComponent(selectedColor.name)}%20(Code:%20${selectedColor.code}).%20Please%20check%20stock.`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-amber-400 hover:underline"
                >
                  Order This Shade →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
