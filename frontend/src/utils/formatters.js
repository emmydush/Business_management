/**
 * Formats a number with locale-aware grouping and dynamic decimal places.
 * Shows up to 2 decimals if present, otherwise shows as integer.
 * @param {number|string} amount 
 * @returns {string}
 */
export const formatNumberAmount = (amount) => {
    const num = parseFloat(amount) || 0;
    const locale = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-US';
    
    // Format without decimal places for whole numbers, show decimals only when needed
    if (num % 1 === 0) {
        // Whole number - no decimal places
        return num.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    } else {
        // Has decimal places - show up to 2
        return num.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }
};

/**
 * Formats a number specifically for currency display (no symbol, just the formatted number).
 * Useful when the symbol is displayed separately in the UI.
 * @param {number|string} amount 
 * @returns {string}
 */
export const formatCurrencyValue = (amount) => {
    return formatNumberAmount(amount);
};
