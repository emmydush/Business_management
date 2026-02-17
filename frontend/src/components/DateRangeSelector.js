import React, { useState } from 'react';
import { Dropdown, Form } from 'react-bootstrap';
import { FiFilter, FiChevronDown } from 'react-icons/fi';
import { DATE_RANGES, getDateRangeLabel, calculateDateRange, formatDateForDisplay } from '../utils/dateRanges';
import { useI18n } from '../i18n/I18nProvider';

const DateRangeSelector = ({ 
    value, 
    onChange, 
    showCustomRange = false,
    className = '',
    size = 'md'
}) => {
    const { t } = useI18n();
    const [showCustom, setShowCustom] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const dateRangeOptions = [
        { key: DATE_RANGES.TODAY, label: getDateRangeLabel(DATE_RANGES.TODAY, t) },
        { key: DATE_RANGES.YESTERDAY, label: getDateRangeLabel(DATE_RANGES.YESTERDAY, t) },
        { key: DATE_RANGES.LAST_7_DAYS, label: getDateRangeLabel(DATE_RANGES.LAST_7_DAYS, t) },
        { key: DATE_RANGES.LAST_30_DAYS, label: getDateRangeLabel(DATE_RANGES.LAST_30_DAYS, t) },
        { key: DATE_RANGES.THIS_MONTH, label: getDateRangeLabel(DATE_RANGES.THIS_MONTH, t) },
        { key: DATE_RANGES.LAST_MONTH, label: getDateRangeLabel(DATE_RANGES.LAST_MONTH, t) },
        { key: DATE_RANGES.THIS_MONTH_LAST_YEAR, label: getDateRangeLabel(DATE_RANGES.THIS_MONTH_LAST_YEAR, t) },
        { key: DATE_RANGES.THIS_YEAR, label: getDateRangeLabel(DATE_RANGES.THIS_YEAR, t) },
        { key: DATE_RANGES.LAST_YEAR, label: getDateRangeLabel(DATE_RANGES.LAST_YEAR, t) },
        { key: DATE_RANGES.CURRENT_FINANCIAL_YEAR, label: getDateRangeLabel(DATE_RANGES.CURRENT_FINANCIAL_YEAR, t) },
        { key: DATE_RANGES.LAST_FINANCIAL_YEAR, label: getDateRangeLabel(DATE_RANGES.LAST_FINANCIAL_YEAR, t) }
    ];

    if (showCustomRange) {
        dateRangeOptions.push({ 
            key: DATE_RANGES.CUSTOM_RANGE, 
            label: getDateRangeLabel(DATE_RANGES.CUSTOM_RANGE, t) 
        });
    }

    const handleSelect = (rangeKey) => {
        if (rangeKey === DATE_RANGES.CUSTOM_RANGE) {
            setShowCustom(true);
        } else {
            onChange(rangeKey);
            setShowCustom(false);
        }
    };

    const handleCustomApply = () => {
        if (customStartDate && customEndDate) {
            onChange(DATE_RANGES.CUSTOM_RANGE, customStartDate, customEndDate);
            setShowCustom(false);
        }
    };

    const getCurrentRangeLabel = () => {
        if (value === DATE_RANGES.CUSTOM_RANGE && customStartDate && customEndDate) {
            return `${formatDateForDisplay(new Date(customStartDate))} - ${formatDateForDisplay(new Date(customEndDate))}`;
        }
        return getDateRangeLabel(value, t);
    };

    return (
        <div className={`date-range-selector ${className}`}>
            <Dropdown>
                <Dropdown.Toggle 
                    variant="outline-primary" 
                    className={`d-flex align-items-center gap-2 ${size === 'sm' ? 'btn-sm' : ''}`}
                >
                    <FiFilter size={16} />
                    <span>{getCurrentRangeLabel()}</span>
                    <FiChevronDown size={14} />
                </Dropdown.Toggle>

                <Dropdown.Menu className="shadow-lg border-0 mt-1">
                    {dateRangeOptions.map((option) => (
                        <Dropdown.Item
                            key={option.key}
                            onClick={() => handleSelect(option.key)}
                            active={value === option.key}
                            className="py-2"
                        >
                            {option.label}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>

            {showCustom && (
                <div className="custom-date-range-popup mt-2 p-3 bg-white border rounded shadow">
                    <h6 className="mb-3">{t('select_custom_date_range') || 'Select Custom Date Range'}</h6>
                    <div className="d-flex gap-3 mb-3">
                        <Form.Group>
                            <Form.Label className="small text-muted">{t('start_date') || 'Start Date'}</Form.Label>
                            <Form.Control
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                size="sm"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className="small text-muted">{t('end_date') || 'End Date'}</Form.Label>
                            <Form.Control
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                size="sm"
                            />
                        </Form.Group>
                    </div>
                    <div className="d-flex gap-2">
                        <button 
                            className="btn btn-primary btn-sm"
                            onClick={handleCustomApply}
                            disabled={!customStartDate || !customEndDate}
                        >
                            {t('apply') || 'Apply'}
                        </button>
                        <button 
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => setShowCustom(false)}
                        >
                            {t('cancel') || 'Cancel'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangeSelector;