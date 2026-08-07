import React, { useState, useRef } from 'react';
import { BEFORE_AFTER_DATA } from '../../data/interiorsData';
import { Sparkles, MapPin, Sliders } from 'lucide-react';

export const BeforeAfterSlider: React.FC = () => {
  const [activeItem, setActiveItem] = useState(BEFORE_AFTER_DATA[0]);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const isDragging = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full uppercase tracking-widest inline-flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Interactive Renovation Slider
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            Before & After Transformations
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm">
            Drag the center divider handle left & right to witness Styleo Interiors craftsman quality
          </p>
        </div>

        {/* Project Selector Tabs */}
        <div className="flex items-center space-x-2">
          {BEFORE_AFTER_DATA.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveItem(item);
                setSliderPosition(50);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeItem.id === item.id
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {item.title.split(' ')[0]} {item.title.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Slider Canvas */}
      <div className="mt-8">
        <div
          ref={containerRef}
          onMouseDown={() => (isDragging.current = true)}
          onMouseUp={() => (isDragging.current = false)}
          onMouseLeave={() => (isDragging.current = false)}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="relative w-full h-[360px] sm:h-[480px] rounded-2xl overflow-hidden cursor-ew-resize select-none border border-slate-700 shadow-2xl"
        >
          {/* AFTER Image (Full background) */}
          <img
            src={activeItem.afterImage}
            alt="After Transformation"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-emerald-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg shadow">
            AFTER (Styleo Finish)
          </div>

          {/* BEFORE Image (Clipped overlay) */}
          <div
            className="absolute top-0 left-0 bottom-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={activeItem.beforeImage}
              alt="Before Renovation"
              className="absolute top-0 left-0 h-full max-w-none object-cover"
              style={{ width: containerRef.current ? containerRef.current.clientWidth : '100%' }}
            />
            <div className="absolute top-4 left-4 bg-slate-900/90 text-slate-300 font-extrabold text-xs px-3 py-1.5 rounded-lg shadow">
              BEFORE (Old Structure)
            </div>
          </div>

          {/* Slider Drag Handle Divider */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_15px_rgba(255,184,0,0.8)] cursor-ew-resize"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl border-2 border-white">
              <Sliders className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Caption */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm text-slate-400 gap-2">
          <div className="flex items-center text-white font-semibold">
            <MapPin className="w-4 h-4 text-amber-400 mr-1.5" />
            <span>{activeItem.title} ({activeItem.location})</span>
          </div>
          <p className="text-slate-400 max-w-lg">{activeItem.description}</p>
        </div>
      </div>
    </div>
  );
};
