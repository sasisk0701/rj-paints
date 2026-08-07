import React, { useState } from 'react';
import { Card, InputNumber, Select, Button, Tag, Divider } from 'antd';
import { Calculator, CheckCircle, RefreshCw, ShoppingCart, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export const PaintCalculator: React.FC = () => {
  const [length, setLength] = useState<number>(15);
  const [width, setWidth] = useState<number>(12);
  const [height, setHeight] = useState<number>(10);
  const [doors, setDoors] = useState<number>(2);
  const [windows, setWindows] = useState<number>(2);
  const [coats, setCoats] = useState<number>(2);
  const [includeCeiling, setIncludeCeiling] = useState<boolean>(true);
  const [paintType, setPaintType] = useState<string>('royale');

  // Paint Types Coverage rates (sq ft per liter for 1 coat) and avg price per liter
  const paintSpecs: Record<string, { name: string; coverage: number; pricePerLiter: number; unitText: string }> = {
    royale: { name: 'Asian Paints Royale Luxury Emulsion', coverage: 140, pricePerLiter: 255, unitText: 'Smooth Silk Finish' },
    ultima: { name: 'Asian Paints Apex Ultima Exterior', coverage: 110, pricePerLiter: 292, unitText: '7-Year Weather Protect' },
    tractor: { name: 'Asian Paints Tractor Emulsion', coverage: 120, pricePerLiter: 120, unitText: 'Economy Matte' },
    primer: { name: 'Asian Paints TruCare Wall Primer', coverage: 130, pricePerLiter: 102, unitText: 'Deep Masonry Sealer' },
    putty: { name: 'Birla White WallCare Putty (Kg)', coverage: 15, pricePerLiter: 23, unitText: 'Base Coat Smoothing' }
  };

  const selectedSpec = paintSpecs[paintType];

  // Mathematical Calculations
  const wallArea = 2 * (length + width) * height;
  const ceilingArea = includeCeiling ? length * width : 0;
  const doorDeduction = doors * 21; // Standard door 3x7 = 21 sqft
  const windowDeduction = windows * 15; // Standard window 3x5 = 15 sqft
  const netArea = Math.max(0, wallArea + ceilingArea - (doorDeduction + windowDeduction));
  const totalPaintableArea = netArea * coats;

  const litersNeeded = Math.ceil((totalPaintableArea / selectedSpec.coverage) * 10) / 10;
  const estimatedCost = Math.ceil(litersNeeded * selectedSpec.pricePerLiter);

  // Bucket breakdown calculation (20L, 10L, 4L, 1L)
  let remainingLiters = Math.ceil(litersNeeded);
  const bucket20L = Math.floor(remainingLiters / 20);
  remainingLiters %= 20;
  const bucket10L = Math.floor(remainingLiters / 10);
  remainingLiters %= 10;
  const bucket4L = Math.floor(remainingLiters / 4);
  remainingLiters %= 4;
  const tin1L = remainingLiters;

  return (
    <Card className="shadow-xl rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Asian Paints Quantity & Cost Estimator</h3>
          <p className="text-xs text-slate-500">Accurate wall surface & bucket requirement calculator for Kovilpatti homes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Left Inputs Column */}
        <div className="lg:col-span-7 space-y-5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">1. Room Dimensions (Feet)</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Length (Ft)</label>
              <InputNumber min={1} max={200} value={length} onChange={(v) => setLength(v || 10)} className="w-full" size="large" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Width (Ft)</label>
              <InputNumber min={1} max={200} value={width} onChange={(v) => setWidth(v || 10)} className="w-full" size="large" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Height (Ft)</label>
              <InputNumber min={1} max={50} value={height} onChange={(v) => setHeight(v || 10)} className="w-full" size="large" />
            </div>
          </div>

          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 pt-2">2. Openings & Coats</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Doors Count</label>
              <InputNumber min={0} max={20} value={doors} onChange={(v) => setDoors(v || 0)} className="w-full" size="large" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Windows Count</label>
              <InputNumber min={0} max={30} value={windows} onChange={(v) => setWindows(v || 0)} className="w-full" size="large" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Coats</label>
              <Select
                value={coats}
                onChange={setCoats}
                className="w-full"
                size="large"
                options={[
                  { value: 1, label: '1 Coat (Touchup)' },
                  { value: 2, label: '2 Coats (Recommended)' },
                  { value: 3, label: '3 Coats (Deep Finish)' }
                ]}
              />
            </div>
          </div>

          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 pt-2">3. Paint Grade Selection</h4>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product Type</label>
            <Select
              value={paintType}
              onChange={setPaintType}
              className="w-full"
              size="large"
              options={[
                { value: 'royale', label: 'Asian Paints Royale Luxury Emulsion (Silk)' },
                { value: 'ultima', label: 'Asian Paints Apex Ultima Exterior Emulsion' },
                { value: 'tractor', label: 'Asian Paints Tractor Emulsion (Budget)' },
                { value: 'primer', label: 'Asian Paints TruCare Interior Wall Primer' },
                { value: 'putty', label: 'Birla White WallCare Putty (Kg)' }
              ]}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="ceiling-check"
              checked={includeCeiling}
              onChange={(e) => setIncludeCeiling(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="ceiling-check" className="text-sm font-semibold text-slate-700 cursor-pointer">
              Include Ceiling Painting Area ({length * width} sq ft)
            </label>
          </div>
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between shadow-inner">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Calculated Result</span>
              <Tag color="blue">{selectedSpec.unitText}</Tag>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Total Net Surface Area:</span>
                <span className="font-bold text-white text-sm">{netArea} Sq.Ft</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Total Painted Area ({coats} Coats):</span>
                <span className="font-bold text-white text-sm">{totalPaintableArea} Sq.Ft</span>
              </div>

              <Divider className="border-slate-800 my-2" />

              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <span className="text-xs text-slate-400 block mb-1">Required Paint Quantity:</span>
                <div className="text-3xl font-extrabold text-amber-400">
                  {litersNeeded} <span className="text-lg font-bold text-white">{paintType === 'putty' ? 'Kg' : 'Liters'}</span>
                </div>
              </div>

              {/* Bucket Mix Breakdown */}
              <div className="space-y-1 text-xs text-slate-300">
                <span className="font-bold text-slate-400">Pack Combination Suggestion:</span>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {bucket20L > 0 && <div className="bg-slate-800 px-2.5 py-1.5 rounded border border-slate-700">20L Bucket: <strong className="text-white">{bucket20L} nos</strong></div>}
                  {bucket10L > 0 && <div className="bg-slate-800 px-2.5 py-1.5 rounded border border-slate-700">10L Bucket: <strong className="text-white">{bucket10L} nos</strong></div>}
                  {bucket4L > 0 && <div className="bg-slate-800 px-2.5 py-1.5 rounded border border-slate-700">4L Can: <strong className="text-white">{bucket4L} nos</strong></div>}
                  {tin1L > 0 && <div className="bg-slate-800 px-2.5 py-1.5 rounded border border-slate-700">1L Tin: <strong className="text-white">{tin1L} nos</strong></div>}
                </div>
              </div>

              <div className="bg-blue-950/60 rounded-xl p-4 border border-blue-800/50">
                <span className="text-xs text-blue-300 block mb-1">Estimated Material Cost (Approx):</span>
                <div className="text-2xl font-black text-white">
                  ₹{estimatedCost.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-slate-400">*Excluding GST & Painter Labor charges</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <a
              href={`https://wa.me/919488475040?text=Hi%20RJ%20Paints,%20I%20calculated%20my%20wall%20area%20as%20${netArea}%20sqft.%20Need%20approx%20${litersNeeded}%20Liters%20of%20${encodeURIComponent(selectedSpec.name)}.%20Please%20send%20discounted%20quote.`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Request Special Price Quote</span>
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
};
