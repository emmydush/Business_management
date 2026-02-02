import React, { createContext, useContext, useState, useEffect } from 'react';
import TRANSLATIONS from './translations';
import moment from 'moment';
import 'moment/locale/fr';

// Define Kinyarwanda locale for moment if not available
// Note: rw is not a standard moment locale, so we provide a basic definition
moment.updateLocale('rw', {
  months: 'Mutarama_Gashyantare_Werurwe_Mata_Gicurasi_Kamena_Nyakanga_Kanama_Nzeri_Ukwakira_Ugushyingo_Ukuboza'.split('_'),
  monthsShort: 'Mut_Gas_Wer_Mat_Gic_Kam_Nya_Kan_Nze_Ukwa_Ugu_Uku'.split('_'),
  weekdays: 'Kuwa mbere_Kuwa kabiri_Kuwa gatatu_Kuwa kane_Kuwa gatanu_Kuwa gatandatu_Ku cyumweru'.split('_'),
  weekdaysShort: 'Mbe_Kab_Gat_Kan_Gat_Tan_Cyu'.split('_'),
  weekdaysMin: 'Mb_Kb_Gt_Kn_Gt_Tn_Cy'.split('_'),
  longDateFormat: {
    LT: 'HH:mm',
    LTS: 'HH:mm:ss',
    L: 'DD/MM/YYYY',
    LL: 'D MMMM YYYY',
    LLL: 'D MMMM YYYY HH:mm',
    LLLL: 'dddd, D MMMM YYYY HH:mm'
  },
  calendar: {
    sameDay: '[Uyu munsi kuri] LT',
    nextDay: '[Ejo kuri] LT',
    nextWeek: 'dddd [kuri] LT',
    lastDay: '[Ejo hashize kuri] LT',
    lastWeek: 'dddd [hashize kuri] LT',
    sameElse: 'L'
  },
  relativeTime: {
    future: 'mu %s',
    past: 'hashize %s',
    s: 'amasegonda make',
    ss: 'amasegonda %d',
    m: 'iminota',
    mm: 'iminota %d',
    h: 'isaha',
    hh: 'amasaha %d',
    d: 'umunsi',
    dd: 'iminsi %d',
    M: 'ukwezi',
    MM: 'amezi %d',
    y: 'umwaka',
    yy: 'imyaka %d'
  }
});

const I18nContext = createContext();

export const useI18n = () => useContext(I18nContext);

export const I18nProvider = ({ children }) => {
  const getInitialLocale = () => {
    const stored = sessionStorage.getItem('locale');
    if (stored && TRANSLATIONS[stored]) return stored;
    // default to English
    return 'en';
  };

  const [locale, setLocale] = useState(getInitialLocale());

  useEffect(() => {
    sessionStorage.setItem('locale', locale);
    moment.locale(locale);
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
