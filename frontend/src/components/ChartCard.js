import React from 'react';
import { Card } from 'react-bootstrap';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { FiTrendingUp, FiBarChart2, FiPieChart } from 'react-icons/fi';

/**
 * Reusable Chart Component
 * Provides consistent styling and behavior for all charts in the application
 */
const ChartCard = ({
    title,
    subtitle,
    type = 'line',
    data,
    options,
    height = '300px',
    loading = false,
    emptyMessage = 'No data available',
    emptySubtext = 'Data will appear here once available',
    className = '',
    headerActions = null,
    animationType = 'fade-in' // 'fade-in', 'scale-in', or null
}) => {
    // Determine which chart component to use
    const ChartComponent = {
        line: Line,
        bar: Bar,
        doughnut: Doughnut,
        pie: Pie,
    }[type] || Line;

    // Determine empty state icon
    const EmptyIcon = {
        line: FiTrendingUp,
        bar: FiBarChart2,
        doughnut: FiPieChart,
        pie: FiPieChart,
    }[type] || FiTrendingUp;

    // Check if data is empty
    const isEmpty = !data ||
        !data.datasets ||
        data.datasets.length === 0 ||
        (data.datasets[0].data && data.datasets[0].data.length === 0) ||
        (data.datasets[0].data && data.datasets[0].data.every(val => val === 0 || val === null));

    const animationClass = animationType ? `chart-${animationType}` : '';

    return (
        <Card className={`border-0 shadow-sm h-100 ${animationClass} ${className}`}>
            <Card.Header className="bg-white border-0 p-4 d-flex justify-content-between align-items-center">
                <div>
                    <h5 className="fw-bold mb-1">{title}</h5>
                    {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
                </div>
                {headerActions && <div>{headerActions}</div>}
            </Card.Header>
            <Card.Body className="p-4 pt-0">
                <div style={{ height }}>
                    {loading ? (
                        <div className="chart-loading">
                            <div className="chart-loading-spinner"></div>
                            <p className="chart-loading-text">Loading chart data...</p>
                        </div>
                    ) : isEmpty ? (
                        <div className="chart-empty">
                            <EmptyIcon className="chart-empty-icon" />
                            <p className="chart-empty-text">{emptyMessage}</p>
                            <p className="chart-empty-subtext">{emptySubtext}</p>
                        </div>
                    ) : (
                        <ChartComponent data={data} options={options} />
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};

export default ChartCard;
