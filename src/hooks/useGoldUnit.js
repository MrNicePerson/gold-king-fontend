import { useContext } from 'react';
import { GoldUnitContext } from '../contexts/GoldUnitContext';

export const useGoldUnit = () => {
  const context = useContext(GoldUnitContext);
  if (!context) {
    throw new Error('useGoldUnit must be used within GoldUnitProvider');
  }
  return context;
};
