import React from 'react';
import { Modal } from 'antd';
import { motion } from 'framer-motion';
import { useBusiness } from '../../context/BusinessContext';
import { Paintbrush, Building2, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const BusinessSwitcherModal: React.FC<Props> = ({ open, onClose }) => {
  const { currentBusiness, setBusiness } = useBusiness();

  const handleSelect = (type: 'paints' | 'interiors') => {
    setBusiness(type);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      className="business-switcher-modal"
    >
      <div className="p-4 sm:p-8">
        <div className="text-center mb-8">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full uppercase tracking-wider">
            Dual Business Switcher
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Select Your Desired Service
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Choose between our Authorized Paint & Hardware Store or Turnkey Interior Design & Construction Works
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business 1: Paints & Hardware */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect('paints')}
            className={`cursor-pointer rounded-2xl p-6 transition-all duration-300 relative overflow-hidden border-2 ${
              currentBusiness === 'paints'
                ? 'border-blue-600 bg-blue-50/50 shadow-xl'
                : 'border-slate-200 hover:border-blue-400 bg-white shadow-md hover:shadow-lg'
            }`}
          >
            {currentBusiness === 'paints' && (
              <div className="absolute top-4 right-4 text-blue-600">
                <CheckCircle2 className="w-6 h-6 fill-blue-100" />
              </div>
            )}
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
              <Paintbrush className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Asian Paints Dealer
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              RJ Paints & Hardwares
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
              Explore Asian Paints interior & exterior emulsions, Berger, Nippon, Birla White putty, waterproofing chemicals & high quality hardware fittings.
            </p>
            <div className="mt-6 flex items-center text-blue-600 font-bold text-sm">
              <span>Enter Paints Store</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </motion.div>

          {/* Business 2: Interior Design & Construction */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect('interiors')}
            className={`cursor-pointer rounded-2xl p-6 transition-all duration-300 relative overflow-hidden border-2 ${
              currentBusiness === 'interiors'
                ? 'border-slate-900 bg-slate-900 text-white shadow-xl'
                : 'border-slate-200 hover:border-slate-800 bg-white text-slate-900 shadow-md hover:shadow-lg'
            }`}
          >
            {currentBusiness === 'interiors' && (
              <div className="absolute top-4 right-4 text-blue-400">
                <CheckCircle2 className="w-6 h-6 fill-slate-800" />
              </div>
            )}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30">
              <Building2 className="w-7 h-7" />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${currentBusiness === 'interiors' ? 'text-amber-400' : 'text-amber-600'}`}>
              Turnkey Interiors & Civil
            </span>
            <h3 className={`text-xl font-bold mt-1 ${currentBusiness === 'interiors' ? 'text-white' : 'text-slate-900'}`}>
              Styleo Interiors & Construction
            </h3>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${currentBusiness === 'interiors' ? 'text-slate-300' : 'text-slate-600'}`}>
              Modular kitchens, Gyproc false ceilings, custom wardrobes, 3D interior design, 3D elevation renderings & full residential construction works.
            </p>
            <div className={`mt-6 flex items-center font-bold text-sm ${currentBusiness === 'interiors' ? 'text-amber-400' : 'text-amber-600'}`}>
              <span>Explore Interior Works</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </motion.div>
        </div>
      </div>
    </Modal>
  );
};
