import React, { createContext, useState, useContext, useEffect } from 'react';
import { useI18n } from '../i18n/I18nProvider';

const CurrencyContext = createContext();

// Currency symbols mapping - Only allowed currencies
const currencySymbols = {
    RWF: 'FRW',
    KES: 'KES',
    TZS: 'TZS',
    UGX: 'UGX',
    BIF: 'BIF',
    CDF: 'FC',
    ZAR: 'R',
    NGN: '₦',
    GHS: 'GH₵',
    USD: '$',
    EUR: '€',
    GBP: '£'
};

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState('RWF');
    const [currencySymbol, setCurrencySymbol] = useState('FRW');

    useEffect(() => {
        // Load currency from localStorage
        const savedSettings = localStorage.getItem('companySettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            if (settings.currency) {
                setCurrency(settings.currency);
                setCurrencySymbol(currencySymbols[settings.currency] || settings.currency);
            }
        }

        // Listen for storage changes
        const handleStorageChange = () => {
            const savedSettings = localStorage.getItem('companySettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                if (settings.currency) {
                    setCurrency(settings.currency);
                    setCurrencySymbol(currencySymbols[settings.currency] || settings.currency);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('currencyUpdate', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('currencyUpdate', handleStorageChange);
        };
    }, []);

    const { locale } = useI18n();
    const formatCurrency = (amount) => {
        const numAmount = parseFloat(amount) || 0;
        const localeMap = {
            en: 'en-US',
            rw: 'rw-RW',
            fr: 'fr-FR'
        };
        const currentLocale = localeMap[locale] || 'en-US';
        return `${currencySymbol} ${numAmount.toLocaleString(currentLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const value = {
        currency,
        currencySymbol,
        formatCurrency,
        setCurrency: (newCurrency) => {
            setCurrency(newCurrency);
            setCurrencySymbol(currencySymbols[newCurrency] || newCurrency);
        }
    };

    return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
