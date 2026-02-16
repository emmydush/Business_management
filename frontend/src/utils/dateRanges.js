import moment from 'moment';

/**
 * Date Range Utility Functions
 * Provides standardized date ranges for dashboard filtering
 */

export const DATE_RANGES = {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    LAST_7_DAYS: 'last_7_days',
    LAST_30_DAYS: 'last_30_days',
    THIS_MONTH: 'this_month',
    LAST_MONTH: 'last_month',
    THIS_MONTH_LAST_YEAR: 'this_month_last_year',
    THIS_YEAR: 'this_year',
    LAST_YEAR: 'last_year',
    CURRENT_FINANCIAL_YEAR: 'current_financial_year',
    LAST_FINANCIAL_YEAR: 'last_financial_year',
    CUSTOM_RANGE: 'custom_range'
};

export const getDateRangeLabel = (rangeKey, t) => {
    const labels = {
        [DATE_RANGES.TODAY]: t('today') || 'Today',
        [DATE_RANGES.YESTERDAY]: t('yesterday') || 'Yesterday',
        [DATE_RANGES.LAST_7_DAYS]: t('last_7_days') || 'Last 7 Days',
        [DATE_RANGES.LAST_30_DAYS]: t('last_30_days') || 'Last 30 Days',
        [DATE_RANGES.THIS_MONTH]: t('this_month') || 'This Month',
        [DATE_RANGES.LAST_MONTH]: t('last_month') || 'Last Month',
        [DATE_RANGES.THIS_MONTH_LAST_YEAR]: t('this_month_last_year') || 'This Month Last Year',
        [DATE_RANGES.THIS_YEAR]: t('this_year') || 'This Year',
        [DATE_RANGES.LAST_YEAR]: t('last_year') || 'Last Year',
        [DATE_RANGES.CURRENT_FINANCIAL_YEAR]: t('current_financial_year') || 'Current Financial Year',
        [DATE_RANGES.LAST_FINANCIAL_YEAR]: t('last_financial_year') || 'Last Financial Year',
        [DATE_RANGES.CUSTOM_RANGE]: t('custom_range') || 'Custom Range'
    };
    return labels[rangeKey] || rangeKey;
};

export const calculateDateRange = (rangeKey, customStartDate = null, customEndDate = null) => {
    const now = moment();
    const today = now.clone().startOf('day');
    const tomorrow = now.clone().endOf('day');

    switch (rangeKey) {
        case DATE_RANGES.TODAY:
            return {
                startDate: today.toDate(),
                endDate: tomorrow.toDate()
            };
        
        case DATE_RANGES.YESTERDAY:
            const yesterday = today.clone().subtract(1, 'day');
            return {
                startDate: yesterday.toDate(),
                endDate: today.toDate()
            };
        
        case DATE_RANGES.LAST_7_DAYS:
            return {
                startDate: today.clone().subtract(6, 'days').toDate(),
                endDate: tomorrow.toDate()
            };
        
        case DATE_RANGES.LAST_30_DAYS:
            return {
                startDate: today.clone().subtract(29, 'days').toDate(),
                endDate: tomorrow.toDate()
            };
        
        case DATE_RANGES.THIS_MONTH:
            return {
                startDate: today.clone().startOf('month').toDate(),
                endDate: tomorrow.toDate()
            };
        
        case DATE_RANGES.LAST_MONTH:
            const lastMonth = today.clone().subtract(1, 'month');
            return {
                startDate: lastMonth.clone().startOf('month').toDate(),
                endDate: lastMonth.clone().endOf('month').toDate()
            };
        
        case DATE_RANGES.THIS_MONTH_LAST_YEAR:
            const sameMonthLastYear = today.clone().subtract(1, 'year');
            return {
                startDate: sameMonthLastYear.clone().startOf('month').toDate(),
                endDate: sameMonthLastYear.clone().endOf('month').toDate()
            };
        
        case DATE_RANGES.THIS_YEAR:
            return {
                startDate: today.clone().startOf('year').toDate(),
                endDate: tomorrow.toDate()
            };
        
        case DATE_RANGES.LAST_YEAR:
            const lastYear = today.clone().subtract(1, 'year');
            return {
                startDate: lastYear.clone().startOf('year').toDate(),
                endDate: lastYear.clone().endOf('year').toDate()
            };
        
        case DATE_RANGES.CURRENT_FINANCIAL_YEAR:
            // Assuming financial year starts April 1st
            const currentFinancialStart = now.month() >= 3 ? 
                moment().month(3).startOf('month') : 
                moment().subtract(1, 'year').month(3).startOf('month');
            return {
                startDate: currentFinancialStart.toDate(),
                endDate: tomorrow.toDate()
            };
        
        case DATE_RANGES.LAST_FINANCIAL_YEAR:
            // Last financial year (April 1 to March 31)
            const lastFinancialEnd = now.month() >= 3 ? 
                moment().month(2).endOf('month') : 
                moment().subtract(1, 'year').month(2).endOf('month');
            const lastFinancialStart = lastFinancialEnd.clone().subtract(1, 'year').add(1, 'day');
            return {
                startDate: lastFinancialStart.toDate(),
                endDate: lastFinancialEnd.toDate()
            };
        
        case DATE_RANGES.CUSTOM_RANGE:
            return {
                startDate: customStartDate ? new Date(customStartDate) : today.toDate(),
                endDate: customEndDate ? new Date(customEndDate) : tomorrow.toDate()
            };
        
        default:
            // Default to today
            return {
                startDate: today.toDate(),
                endDate: tomorrow.toDate()
            };
    }
};

export const formatDateForDisplay = (date) => {
    return moment(date).format('MMM DD, YYYY');
};

export const formatDateForAPI = (date) => {
    return moment(date).format('YYYY-MM-DD');
};

export const getDefaultDateRange = () => DATE_RANGES.TODAY;