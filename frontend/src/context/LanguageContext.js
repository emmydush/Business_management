import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => {
    const stored = localStorage.getItem('locale');
    return stored || 'en'; // Default to English
  });

  useEffect(() => {
    localStorage.setItem('locale', locale);
  }, [locale]);

  const changeLocale = (newLocale) => {
    setLocale(newLocale);
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLocale }}>
      {children}
    </LanguageContext.Provider>
  );
};