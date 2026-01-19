/* 
 * Example: Before and After Chart Styling
 * This file demonstrates the improvements made to chart visualizations
 */

// ============================================
// BEFORE: Basic Chart Configuration
// ============================================

// Old way - hardcoded colors, basic styling
const oldLineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{
        label: 'Revenue',
        data: [1200, 1900, 1500, 2200, 2800],
        borderColor: '#2563eb',  // Hardcoded blue
        backgroundColor: 'rgba(37, 99, 235, 0.1)',  // Hardcoded transparent blue
        tension: 0.4,
        pointRadius: 4,
        pointBorderWidth: 2,
    }]
};

const oldChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#1e293b',
            padding: 12,
        }
    },
    scales: {
        x: { grid: { display: false } },
        y: { grid: { color: '#f1f5f9' } }
    }
};

// Old usage
<Card>
    <Card.Header>
        <h5>Revenue Overview</h5>
    </Card.Header>
    <Card.Body>
        <div style={{ height: '300px' }}>
            <Line data={oldLineData} options={oldChartOptions} />
        </div>
    </Card.Body>
</Card>


// ============================================
// AFTER: Enhanced Chart Configuration
// ============================================

import {
    colorPalettes,
    lineChartOptions,
    createAreaGradient
} from '../config/chartConfig';
import ChartCard from '../components/ChartCard';

// New way - using centralized config and reusable components
const newLineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{
        label: 'Revenue',
        data: [1200, 1900, 1500, 2200, 2800],
        borderColor: colorPalettes.gradients.indigo[0],  // From color palette
        borderWidth: 3,  // Thicker line
        backgroundColor: (context) => {  // Dynamic gradient
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return colorPalettes.backgrounds.indigo;
            return createAreaGradient(ctx, chartArea, colorPalettes.gradients.indigo[0], 0.2);
        },
        tension: 0.4,
        pointRadius: 5,  // Larger points
        pointHoverRadius: 7,  // Hover effect
        pointBackgroundColor: '#fff',
        pointBorderColor: colorPalettes.gradients.indigo[0],
        pointBorderWidth: 3,
        pointHoverBorderWidth: 4,
    }]
};

const enhancedOptions = {
    ...lineChartOptions,  // Inherit from centralized config
    plugins: {
        ...lineChartOptions.plugins,
        legend: { display: false },
        tooltip: {
            ...lineChartOptions.plugins.tooltip,
            callbacks: {
                label: function (context) {
                    return `Revenue: ${formatCurrency(context.parsed.y)}`;  // Formatted currency
                }
            }
        }
    },
    animation: {
        duration: 1500,  // Smooth animation
        easing: 'easeInOutQuart',
    }
};

// New usage - much cleaner!
<ChartCard
    title="Revenue Overview"
    subtitle="Track your revenue performance over time"
    type="line"
    data={newLineData}
    options={enhancedOptions}
    height="300px"
    animationType="fade-in"
    loading={loading}
    emptyMessage="No revenue data available"
/>


// ============================================
// COMPARISON: Key Improvements
// ============================================

/*
1. COLOR MANAGEMENT
   Before: Hardcoded hex colors scattered everywhere
   After: Centralized color palettes with semantic names

2. GRADIENTS
   Before: Simple solid colors or basic rgba
   After: Dynamic gradients that adapt to chart area

3. STYLING
   Before: Inline styles and scattered options
   After: Reusable configuration with consistent styling

4. COMPONENTS
   Before: Repeated Card/Header/Body structure
   After: Single ChartCard component with all features

5. LOADING STATES
   Before: Manual loading logic in each component
   After: Built-in loading spinner in ChartCard

6. EMPTY STATES
   Before: No empty state handling
   After: Beautiful empty states with icons and messages

7. ANIMATIONS
   Before: Default Chart.js animations
   After: Custom animations with fade-in/scale-in effects

8. TOOLTIPS
   Before: Basic tooltips with raw numbers
   After: Formatted tooltips with currency, percentages, etc.

9. RESPONSIVENESS
   Before: Basic responsive flag
   After: Full responsive design with mobile optimization

10. MAINTAINABILITY
    Before: Copy-paste code for each chart
    After: Reusable components and centralized config
*/


// ============================================
// EXAMPLE: Multi-Color Bar Chart
// ============================================

// BEFORE
const oldBarData = {
    labels: ['Product A', 'Product B', 'Product C'],
    datasets: [{
        data: [30, 45, 25],
        backgroundColor: '#2563eb',  // All bars same color
        borderRadius: 4,
    }]
};

// AFTER
const newBarData = {
    labels: ['Product A', 'Product B', 'Product C'],
    datasets: [{
        data: [30, 45, 25],
        backgroundColor: (context) => {  // Each bar different color
            const index = context.dataIndex;
            return colorPalettes.vibrant[index % colorPalettes.vibrant.length];
        },
        borderRadius: 8,  // More rounded
        borderSkipped: false,  // Round all corners
        hoverBackgroundColor: (context) => {  // Hover effect
            const index = context.dataIndex;
            return colorPalettes.vibrant[(index + 1) % colorPalettes.vibrant.length];
        },
    }]
};


// ============================================
// EXAMPLE: KPI Metrics
// ============================================

// BEFORE - Manual card creation
<Card className="border-0 shadow-sm">
    <Card.Body>
        <div className="d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                <FiDollarSign className="text-primary" size={24} />
            </div>
            <div>
                <h6 className="mb-0">Total Revenue</h6>
                <h3 className="fw-bold mb-0">$45,231</h3>
            </div>
        </div>
    </Card.Body>
</Card>

// AFTER - Using MetricCard component
<MetricCard
    title="Total Revenue"
    value="$45,231"
    icon={FiDollarSign}
    color="primary"
    trend={{ value: 12.5, direction: 'up' }}
    subtitle="vs last month"
/>


// ============================================
// RESULT: Code Reduction
// ============================================

/*
Lines of code per chart:
Before: ~50-60 lines (including Card, styling, options)
After: ~15-20 lines (using ChartCard component)

Reduction: ~70% less code per chart!

Consistency: 100% consistent across all charts
Maintainability: Single source of truth for colors and options
Scalability: Easy to add new charts with same quality
*/
