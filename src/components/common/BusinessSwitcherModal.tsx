import React from 'react';
import { Modal } from 'antd';
import { motion } from 'framer-motion';
import { useBusiness } from '../../context/BusinessContext';
import { Paintbrush, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const BusinessSwitcherModal: React.FC<Props> = ({ open, onClose }) => {
  const { currentBusiness, setBusiness } = useBusiness();

  const handleSelect = () => {
    setBusiness('paints');
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
            Business
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            RJ Paints & Hardwares
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Browse our paints, hardware, and related services.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSelect}
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

        </div>
      </div>
    </Modal>
  );
};
