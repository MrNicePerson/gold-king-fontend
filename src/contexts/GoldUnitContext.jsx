import { createContext, useMemo, useState } from 'react';
import { TOLA_11664 } from '../utils/goldUnitUtils';

export const GoldUnitContext = createContext();

export const GoldUnitProvider = ({ children }) => {
  const [selectedUnit, setSelectedUnit] = useState(TOLA_11664);

  const value = useMemo(
    () => ({ selectedUnit, setSelectedUnit }),
    [selectedUnit]
  );

  return <GoldUnitContext.Provider value={value}>{children}</GoldUnitContext.Provider>;
};
 