import React from 'react';
import { Card } from 'react-bootstrap';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

/**
 * Reusable Metric/KPI Card Component
 * Displays key metrics with optional trend indicators
 */
const MetricCard = ({
    title,
    value,
    icon: Icon,
    color = 'primary', // primary, success, danger, warning, info
    gradient = true,
    trend = null, // { value: 12.5, direction: 'up' | 'down' }
    subtitle = null,
    onClick = null,
    className = ''
}) => {
    // Gradient class mapping
    const gradientClasses = {
        primary: 'grad-primary',
        success: 'grad-success',
        danger: 'grad-danger',
        warning: 'grad-warning',
        info: 'grad-info',
        purple: 'grad-purple',
        orange: 'grad-orange',
    };

    const gradientClass = gradient ? gradientClasses[color] || 'grad-primary' : '';
    const cursorStyle = onClick ? 'pointer' : 'default';

    return (
        <Card
            className={`border-0 shadow-sm h-100 kpi-card-v2 ${gradientClass} text-white overflow-hidden ${className}`}
            onClick={onClick}
            style={{ cursor: cursorStyle }}
        >
            <Card.Body className="p-3 position-relative d-flex flex-column justify-content-center" style={{ minHeight: '90px' }}>
                <div className="d-flex justify-content-between align-items-center">
                    <div className="kpi-content">
                        <h4 className="fw-bold mb-0 text-white">{value}</h4>
                        <p className="text-white-50 small mb-0 fw-medium mt-1">{title}</p>
                        {subtitle && (
                            <p className="text-white-50 small mb-0 mt-1" style={{ fontSize: '0.7rem' }}>
                                {subtitle}
                            </p>
                        )}
                        {trend && (
                            <div className={`d-flex align-items-center gap-1 mt-1 ${trend.direction === 'up' ? 'text-white' : 'text-white-50'}`}>
                                {trend.direction === 'up' ? (
                                    <FiTrendingUp size={14} />
                                ) : (
                                    <FiTrendingDown size={14} />
                                )}
                                <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                                    {Math.abs(trend.value)}%
                                </span>
                            </div>
                        )}
                    </div>
                    {Icon && (
                        <div className="kpi-icon-v2">
                            <Icon />
                        </div>
                    )}
                </div>

                {/* Decorative circles */}
                <div className="decoration-circle circle-1"></div>
                <div className="decoration-circle circle-2"></div>
            </Card.Body>

            <style dangerouslySetInnerHTML={{
                __html: `
                .kpi-card-v2 {
                    transition: all 0.3s ease;
                    border-radius: 12px;
                }
                .kpi-card-v2:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.12) !important;
                }
                .grad-primary { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); }
                .grad-purple { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
                .grad-info { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); }
                .grad-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
                .grad-danger { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
                .grad-warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
                .grad-orange { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }

                .kpi-icon-v2 {
                    width: 28px;
                    height: 28px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    backdrop-filter: blur(4px);
                }
                
                .kpi-content {
                    flex: 1;
                }
                
                .kpi-content h4 {
                    font-size: 1rem;
                    margin-bottom: 0.1rem;
                }
                
                .kpi-content p {
                    font-size: 0.75rem;
                    margin-bottom: 0;
                }

                .decoration-circle {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    z-index: 0;
                }
                .circle-1 {
                    width: 100px;
                    height: 100px;
                    top: -20px;
                    right: -20px;
                }
                .circle-2 {
                    width: 60px;
                    height: 60px;
                    bottom: -10px;
                    right: 20px;
                }
                .kpi-card-v2 * {
                    position: relative;
                    z-index: 1;
                }
            `}} />
        </Card>
    );
};

export default MetricCard;
