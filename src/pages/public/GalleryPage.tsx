import React, { useState } from 'react';
import { PORTFOLIO_PROJECTS } from '../../data/interiorsData';
import { BeforeAfterSlider } from '../../components/interiors/BeforeAfterSlider';
import { ProjectInquiryModal } from '../../components/interiors/ProjectInquiryModal';
import { Sparkles, MapPin, Calendar, Building2 } from 'lucide-react';

export const GalleryPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const categories = ['All', 'Modular Kitchen', 'False Ceiling', 'Wardrobe', 'Office', 'Construction'];

  const filteredProjects = selectedCategory === 'All'
    ? PORTFOLIO_PROJECTS
    : PORTFOLIO_PROJECTS.filter((p) => p.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-12">
      <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl">
        <span className="px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-wider inline-flex items-center mb-3">
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          Styleo Interior Portfolio
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white">Completed Interior & Civil Projects</h1>
        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
          Browse our completed residential villa interiors, modern acrylic kitchens, Gyproc false ceiling lightings & civil building works in Kovilpatti.
        </p>
      </div>

      {/* Embedded Before After Interactive Slider */}
      <BeforeAfterSlider />

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((proj) => (
          <div key={proj.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-md hover:shadow-xl transition-all flex flex-col justify-between">
            <div>
              <div className="h-60 overflow-hidden relative">
                <img src={proj.image} alt={proj.title} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md text-amber-400 text-[10px] font-bold uppercase px-3 py-1 rounded-full">
                  {proj.category}
                </div>
              </div>
              <div className="p-6 space-y-2">
                <h3 className="text-xl font-bold text-slate-900">{proj.title}</h3>
                <div className="flex items-center text-xs text-slate-500 space-x-3">
                  <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-amber-500" />{proj.location}</span>
                  <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1 text-amber-500" />{proj.completionYear}</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">{proj.description}</p>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={() => setInquiryOpen(true)}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs"
              >
                Inquire Similar Project
              </button>
            </div>
          </div>
        ))}
      </div>

      <ProjectInquiryModal open={inquiryOpen} onClose={() => setInquiryOpen(false)} />
    </div>
  );
};
