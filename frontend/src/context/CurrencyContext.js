import React, { createContext, useState, useContext, useEffect } from 'react';

const CurrencyContext = createContext();

// Currency symbols mapping
const currencySymbols = {
    RWF: 'FRW',
    KES: 'KES',
    TZS: 'TZS',
    UGX: 'UGX',
    BIF: 'BIF',
    CDF: 'FC',
    ZAR: 'R',
    NGN: '₦',
    EGP: 'E£',
    GHS: 'GH₵',
    MAD: 'MAD',
    ETB: 'Br',
    XAF: 'FCFA',
    XOF: 'CFA',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    INR: '₹'
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

    const formatCurrency = (amount) => {
        const numAmount = parseFloat(amount) || 0;
        return `${currencySymbol} ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
