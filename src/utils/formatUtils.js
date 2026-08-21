/**
 * Language-aware number formatting utility.
 * English format: 452,349 (en-PK)
 * Urdu format: ۴۵۲٬۳۴۹ (ur-PK)
 */
export const formatNumberByLanguage = (value, language = "en") => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return value;
  }
  const locale = language === "ur" ? "ur-PK" : "en-PK";
  try {
    return new Intl.NumberFormat(locale).format(Number(value));
  } catch (error) {
    return value;
  }
};

/**
 * Language-aware date formatting utility.
 * Uses en-PK for English and ur-PK for Urdu.
 */
export const formatDateByLanguage = (date, language = "en", options = {}) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  
  const locale = language === "ur" ? "ur-PK" : "en-PK";
  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  } catch (error) {
    return d.toLocaleDateString();
  }
};

/**
 * Language-aware time formatting utility.
 */
export const formatTimeByLanguage = (date, language = "en", options = {}) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;

  const locale = language === "ur" ? "ur-PK" : "en-PK";
  const defaultOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  } catch (error) {
    return d.toLocaleTimeString();
  }
};
