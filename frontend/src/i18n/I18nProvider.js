import React, { createContext, useContext, useMemo, useState } from 'react';

const I18nContext = createContext({
  t: (key) => (typeof key === 'string' ? key : String(key)),
  locale: 'en',
  setLocale: () => {},
});

export const useI18n = () => useContext(I18nContext);

function humanize(key) {
  if (typeof key !== 'string') return String(key);
  const spaced = key.replace(/[_-]+/g, ' ').trim();
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function I18nProvider({ children }) {
  const [locale, setLocale] = useState('en');

  const value = useMemo(
    () => ({
      t: (key) => humanize(key),
      locale,
      setLocale,
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
