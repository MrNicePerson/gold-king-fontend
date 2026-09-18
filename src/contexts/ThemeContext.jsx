import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES } from '../config/themes';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('navbarTheme');
    return saved && THEMES[saved] ? saved : 'gold';
  });

  useEffect(() => {
    localStorage.setItem('navbarTheme', currentTheme);
  }, [currentTheme]);

  const theme = THEMES[currentTheme];
  const isLightTheme = theme.type === 'light';

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, setCurrentTheme, isLightTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};