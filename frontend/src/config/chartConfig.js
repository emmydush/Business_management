/**
 * Chart.js Configuration & Color Palettes
 * Centralized configuration for all charts in the application
 * Ensures consistent, beautiful, and data-friendly visualizations
 */

// Modern Color Palettes
export const colorPalettes = {
    // Primary vibrant palette
    vibrant: [
        '#6366f1', // Indigo
        '#8b5cf6', // Purple
        '#ec4899', // Pink
        '#f59e0b', // Amber
        '#10b981', // Emerald
        '#3b82f6', // Blue
        '#ef4444', // Red
        '#06b6d4', // Cyan
        '#84cc16', // Lime
        '#f97316', // Orange
    ],

    // Gradient-ready colors
    gradients: {
        blue: ['#3b82f6', '#1d4ed8'],
        purple: ['#8b5cf6', '#6d28d9'],
        pink: ['#ec4899', '#be185d'],
        green: ['#10b981', '#047857'],
        orange: ['#f97316', '#c2410c'],
        red: ['#ef4444', '#b91c1c'],
        cyan: ['#06b6d4', '#0e7490'],
        indigo: ['#6366f1', '#4338ca'],
        emerald: ['#10b981', '#059669'],
        amber: ['#f59e0b', '#d97706'],
    },

    // Semantic colors
    semantic: {
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
        primary: '#6366f1',
    },

    // Background colors with transparency
    backgrounds: {
        blue: 'rgba(59, 130, 246, 0.1)',
        purple: 'rgba(139, 92, 246, 0.1)',
        pink: 'rgba(236, 72, 153, 0.1)',
        green: 'rgba(16, 185, 129, 0.1)',
        orange: 'rgba(249, 115, 22, 0.1)',
        red: 'rgba(239, 68, 68, 0.1)',
        cyan: 'rgba(6, 182, 212, 0.1)',
        indigo: 'rgba(99, 102, 241, 0.1)',
    },

    // Multi-series colors (for comparing datasets)
    comparison: {
        revenue: '#10b981',
        expense: '#ef4444',
        profit: '#6366f1',
        sales: '#3b82f6',
        orders: '#f59e0b',
    }
};

// Chart.js default options
export const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index',
        intersect: false,
    },
    plugins: {
        legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 15,
                font: {
                    size: 13,
                    weight: '600',
                    family: "'Inter', sans-serif",
                },
                color: '#475569',
            },
        },
        tooltip: {
            enabled: true,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#fff',
            bodyColor: '#e2e8f0',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 16,
            titleFont: {
                size: 14,
                weight: 'bold',
                family: "'Inter', sans-serif",
            },
            bodyFont: {
                size: 13,
                family: "'Inter', sans-serif",
            },
            cornerRadius: 12,
            displayColors: true,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
                // Format large numbers with commas
                label: function (context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += new Intl.NumberFormat('en-US', {
                            style: 'decimal',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                        }).format(context.parsed.y);
                    }
                    return label;
                }
            }
        },
    },
    scales: {
        x: {
            grid: {
                display: false,
                drawBorder: false,
            },
            ticks: {
                color: '#475569',
                font: {
                    size: 12,
                    weight: '500',
                    family: "'Inter', sans-serif",
                },
                padding: 8,
            },
        },
        y: {
            grid: {
                color: 'rgba(148, 163, 184, 0.1)',
                drawBorder: false,
            },
            ticks: {
                color: '#475569',
                font: {
                    size: 12,
                    weight: '500',
                    family: "'Inter', sans-serif",
                },
                padding: 8,
                callback: function (value) {
                    // Format large numbers
                    if (value >= 1000000) {
                        return (value / 1000000).toFixed(1) + 'M';
                    } else if (value >= 1000) {
                        return (value / 1000).toFixed(1) + 'K';
                    }
                    return value;
                }
            },
        },
    },
};

// Line Chart specific options
export const lineChartOptions = {
    ...defaultChartOptions,
    elements: {
        line: {
            tension: 0.4,
            borderWidth: 3,
        },
        point: {
            radius: 4,
            hoverRadius: 6,
            borderWidth: 2,
            backgroundColor: '#fff',
        },
    },
};

// Bar Chart specific options
export const barChartOptions = {
    ...defaultChartOptions,
    elements: {
        bar: {
            borderRadius: 8,
            borderSkipped: false,
        },
    },
    scales: {
        ...defaultChartOptions.scales,
        x: {
            ...defaultChartOptions.scales.x,
            stacked: false,
        },
        y: {
            ...defaultChartOptions.scales.y,
            stacked: false,
            beginAtZero: true,
        },
    },
};

// Doughnut/Pie Chart specific options
export const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
        legend: {
            display: true,
            position: 'bottom',
            labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 20,
                font: {
                    size: 13,
                    weight: '600',
                    family: "'Inter', sans-serif",
                },
                color: '#475569',
                generateLabels: function (chart) {
                    const data = chart.data;
                    if (data.labels.length && data.datasets.length) {
                        return data.labels.map((label, i) => {
                            const value = data.datasets[0].data[i];
                            const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return {
                                text: `${label} (${percentage}%)`,
                                fillStyle: data.datasets[0].backgroundColor[i],
                                hidden: false,
                                index: i,
                            };
                        });
                    }
                    return [];
                }
            },
        },
        tooltip: {
            enabled: true,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#fff',
            bodyColor: '#e2e8f0',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 16,
            cornerRadius: 12,
            displayColors: true,
            callbacks: {
                label: function (context) {
                    const label = context.label || '';
                    const value = context.parsed;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${label}: ${new Intl.NumberFormat('en-US').format(value)} (${percentage}%)`;
                }
            }
        },
    },
};

// Helper function to create gradient
export const createGradient = (ctx, chartArea, colorStart, colorEnd) => {
    if (!chartArea) return colorStart;

    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, colorEnd);
    gradient.addColorStop(1, colorStart);
    return gradient;
};

// Helper function to create area gradient (for filled line charts)
export const createAreaGradient = (ctx, chartArea, color, opacity = 0.1) => {
    if (!chartArea) return `rgba(99, 102, 241, ${opacity})`;

    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, `rgba(${hexToRgb(color)}, 0)`);
    gradient.addColorStop(1, `rgba(${hexToRgb(color)}, ${opacity})`);
    return gradient;
};

// Helper to convert hex to RGB
export const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '99, 102, 241';
};

// Animation configuration
export const animationConfig = {
    duration: 1000,
    easing: 'easeInOutQuart',
    delay: (context) => {
        let delay = 0;
        if (context.type === 'data' && context.mode === 'default') {
            delay = context.dataIndex * 50 + context.datasetIndex * 100;
        }
        return delay;
    },
};

// Export default configuration
export default {
    colorPalettes,
    defaultChartOptions,
    lineChartOptions,
    barChartOptions,
    doughnutChartOptions,
    createGradient,
    createAreaGradient,
    hexToRgb,
    animationConfig,
};
