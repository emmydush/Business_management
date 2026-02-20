import React, { createContext, useContext, useState, useEffect } from 'react';
import TRANSLATIONS from './translations';

const I18nContext = createContext();

export const useI18n = () => useContext(I18nContext);

export const I18nProvider = ({ children }) => {
  const getInitialLocale = () => {
    const stored = localStorage.getItem('locale');
    if (stored && TRANSLATIONS[stored]) return stored;
    // default to English
    return 'en';
  };

  const [locale, setLocale] = useState(getInitialLocale());

  useEffect(() => {
    localStorage.setItem('locale', locale);
  }, [locale]);

  const t = (key) => {
    const dict = TRANSLATIONS[locale] || TRANSLATIONS['en'];
    return dict && dict[key] ? dict[key] : '';
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export default I18nProvider;