export const TOLA_11664 = 11.664;
export const TOLA_12150 = 12.150;

// baseUnit = the tola weight the price is actually stored against (from DB)
// targetUnit = the tola weight the user wants to view it as
export const calculateTolaPrice = (pricePerTola, baseUnit = TOLA_11664, targetUnit = TOLA_11664) => {
  if (pricePerTola == null) return null;

  const perGram = pricePerTola / baseUnit;
  return Math.round(perGram * targetUnit);
};