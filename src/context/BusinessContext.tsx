import React, { createContext, useContext, useState, useEffect } from 'react';
import { BusinessType } from '../types';

interface BusinessContextType {
  currentBusiness: BusinessType;
  setBusiness: (business: BusinessType) => void;
  toggleBusiness: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  hasSelectedInitial: boolean;
  setHasSelectedInitial: (selected: boolean) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentBusiness, setCurrentBusinessState] = useState<BusinessType>(() => {
    const saved = localStorage.getItem('rj_selected_business');
    return (saved as BusinessType) || 'paints';
  });

  const [hasSelectedInitial, setHasSelectedInitial] = useState<boolean>(() => {
    return !!localStorage.getItem('rj_selected_business');
  });

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const setBusiness = (business: BusinessType) => {
    setCurrentBusinessState(business);
    localStorage.setItem('rj_selected_business', business);
    setHasSelectedInitial(true);
  };

  const toggleBusiness = () => {
    const next = currentBusiness === 'paints' ? 'interiors' : 'paints';
    setBusiness(next);
  };

  useEffect(() => {
    // Dynamically update document title accent based on selected business
    if (currentBusiness === 'paints') {
      document.title = "RJ Paints & Hardwares | Asian Paints Dealer Kovilpatti";
    } else {
      document.title = "Styleo Interiors & Construction Works | Kovilpatti";
    }
  }, [currentBusiness]);

  return (
    <BusinessContext.Provider
      value={{
        currentBusiness,
        setBusiness,
        toggleBusiness,
        isModalOpen,
        setIsModalOpen,
        hasSelectedInitial,
        setHasSelectedInitial,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
