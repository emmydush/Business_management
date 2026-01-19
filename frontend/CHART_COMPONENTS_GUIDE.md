# Chart Components Usage Guide

## Quick Start

This guide shows you how to use the reusable chart components in your application.

## Components

### 1. ChartCard Component

A reusable wrapper for all chart types with built-in loading and empty states.

#### Import
```javascript
import ChartCard from '../components/ChartCard';
import { colorPalettes, lineChartOptions } from '../config/chartConfig';
```

#### Basic Usage - Line Chart
```javascript
<ChartCard
    title="Sales Trend"
    subtitle="Monthly sales performance"
    type="line"
    data={{
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
            label: 'Sales',
            data: [1200, 1900, 1500, 2200, 2800],
            borderColor: colorPalettes.semantic.primary,
            backgroundColor: colorPalettes.backgrounds.blue,
            fill: true,
        }]
    }}
    options={lineChartOptions}
    height="300px"
    animationType="fade-in"
/>
```

#### Bar Chart Example
```javascript
<ChartCard
    title="Revenue vs Expenses"
    subtitle="Compare monthly revenue and expenses"
    type="bar"
    data={{
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [
            {
                label: 'Revenue',
                data: [5000, 6000, 5500],
                backgroundColor: colorPalettes.comparison.revenue,
            },
            {
                label: 'Expenses',
                data: [3000, 3500, 3200],
                backgroundColor: colorPalettes.comparison.expense,
            }
        ]
    }}
    options={barChartOptions}
    height="350px"
    animationType="scale-in"
/>
```

#### Doughnut Chart Example
```javascript
<ChartCard
    title="Category Distribution"
    subtitle="Sales by product category"
    type="doughnut"
    data={{
        labels: ['Electronics', 'Clothing', 'Food', 'Books'],
        datasets: [{
            data: [30, 25, 20, 25],
            backgroundColor: colorPalettes.vibrant,
        }]
    }}
    options={doughnutChartOptions}
    height="300px"
/>
```

#### With Loading State
```javascript
const [loading, setLoading] = useState(true);
const [chartData, setChartData] = useState(null);

<ChartCard
    title="Sales Overview"
    type="line"
    data={chartData}
    options={lineChartOptions}
    loading={loading}
    emptyMessage="No sales data available"
    emptySubtext="Sales data will appear once transactions are recorded"
/>
```

#### With Header Actions
```javascript
<ChartCard
    title="Monthly Report"
    type="bar"
    data={data}
    options={barChartOptions}
    headerActions={
        <Button variant="outline-primary" size="sm">
            <FiDownload className="me-1" /> Export
        </Button>
    }
/>
```

#### Props Reference
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | required | Chart title |
| `subtitle` | string | null | Optional subtitle |
| `type` | string | 'line' | Chart type: 'line', 'bar', 'doughnut', 'pie' |
| `data` | object | required | Chart.js data object |
| `options` | object | required | Chart.js options object |
| `height` | string | '300px' | Chart container height |
| `loading` | boolean | false | Show loading spinner |
| `emptyMessage` | string | 'No data available' | Empty state message |
| `emptySubtext` | string | 'Data will appear...' | Empty state subtext |
| `className` | string | '' | Additional CSS classes |
| `headerActions` | node | null | React node for header actions |
| `animationType` | string | 'fade-in' | 'fade-in', 'scale-in', or null |

---

### 2. MetricCard Component

Display KPIs and metrics with beautiful gradients and optional trends.

#### Import
```javascript
import MetricCard from '../components/MetricCard';
import { FiDollarSign, FiUsers, FiShoppingCart } from 'react-icons/fi';
```

#### Basic Usage
```javascript
<MetricCard
    title="Total Revenue"
    value="$45,231"
    icon={FiDollarSign}
    color="primary"
/>
```

#### With Trend Indicator
```javascript
<MetricCard
    title="Monthly Sales"
    value="1,234"
    icon={FiShoppingCart}
    color="success"
    trend={{ value: 12.5, direction: 'up' }}
    subtitle="vs last month"
/>
```

#### Clickable Metric
```javascript
<MetricCard
    title="Active Users"
    value="892"
    icon={FiUsers}
    color="info"
    onClick={() => navigate('/users')}
/>
```

#### Without Gradient
```javascript
<MetricCard
    title="Pending Orders"
    value="23"
    icon={FiAlertCircle}
    color="warning"
    gradient={false}
/>
```

#### Grid Layout Example
```javascript
<Row className="g-3 mb-4">
    <Col md={3}>
        <MetricCard
            title="Total Revenue"
            value={formatCurrency(stats.revenue)}
            icon={FiDollarSign}
            color="primary"
            trend={{ value: 8.2, direction: 'up' }}
        />
    </Col>
    <Col md={3}>
        <MetricCard
            title="Total Orders"
            value={stats.orders}
            icon={FiShoppingCart}
            color="success"
            trend={{ value: 3.1, direction: 'down' }}
        />
    </Col>
    <Col md={3}>
        <MetricCard
            title="New Customers"
            value={stats.customers}
            icon={FiUsers}
            color="info"
        />
    </Col>
    <Col md={3}>
        <MetricCard
            title="Conversion Rate"
            value="3.2%"
            icon={FiTrendingUp}
            color="purple"
        />
    </Col>
</Row>
```

#### Props Reference
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | required | Metric label |
| `value` | string/number | required | Metric value to display |
| `icon` | component | null | React icon component |
| `color` | string | 'primary' | Color theme: 'primary', 'success', 'danger', 'warning', 'info', 'purple', 'orange' |
| `gradient` | boolean | true | Use gradient background |
| `trend` | object | null | `{ value: number, direction: 'up'/'down' }` |
| `subtitle` | string | null | Additional context text |
| `onClick` | function | null | Click handler (makes card clickable) |
| `className` | string | '' | Additional CSS classes |

---

## Color Palette Reference

### Using Colors from chartConfig

```javascript
import { colorPalettes } from '../config/chartConfig';

// Vibrant colors (for multiple datasets)
backgroundColor: colorPalettes.vibrant // Array of 10 colors

// Individual vibrant colors
backgroundColor: colorPalettes.vibrant[0] // Indigo
backgroundColor: colorPalettes.vibrant[1] // Purple
backgroundColor: colorPalettes.vibrant[2] // Pink

// Semantic colors
borderColor: colorPalettes.semantic.success // Green
borderColor: colorPalettes.semantic.danger // Red
borderColor: colorPalettes.semantic.info // Blue

// Comparison colors (for revenue/expense charts)
backgroundColor: colorPalettes.comparison.revenue // Green
backgroundColor: colorPalettes.comparison.expense // Red
backgroundColor: colorPalettes.comparison.profit // Indigo

// Background colors (with transparency)
backgroundColor: colorPalettes.backgrounds.blue
backgroundColor: colorPalettes.backgrounds.green
```

---

## Complete Page Example

```javascript
import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import ChartCard from '../components/ChartCard';
import MetricCard from '../components/MetricCard';
import { 
    colorPalettes, 
    lineChartOptions, 
    barChartOptions 
} from '../config/chartConfig';
import { FiDollarSign, FiUsers, FiShoppingCart } from 'react-icons/fi';

const MyReportPage = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        // Fetch your data
        fetchData();
    }, []);

    return (
        <Container fluid className="py-4">
            {/* Page Header */}
            <div className="mb-4">
                <h2 className="fw-bold">Sales Dashboard</h2>
                <p className="text-muted">Overview of your sales performance</p>
            </div>

            {/* KPI Cards */}
            <Row className="g-3 mb-4">
                <Col md={4}>
                    <MetricCard
                        title="Total Revenue"
                        value="$45,231"
                        icon={FiDollarSign}
                        color="primary"
                        trend={{ value: 12.5, direction: 'up' }}
                    />
                </Col>
                <Col md={4}>
                    <MetricCard
                        title="Total Orders"
                        value="1,234"
                        icon={FiShoppingCart}
                        color="success"
                    />
                </Col>
                <Col md={4}>
                    <MetricCard
                        title="New Customers"
                        value="89"
                        icon={FiUsers}
                        color="info"
                    />
                </Col>
            </Row>

            {/* Charts */}
            <Row className="g-4">
                <Col lg={8}>
                    <ChartCard
                        title="Sales Trend"
                        subtitle="Monthly sales over time"
                        type="line"
                        data={{
                            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                            datasets: [{
                                label: 'Sales',
                                data: [1200, 1900, 1500, 2200, 2800],
                                borderColor: colorPalettes.semantic.primary,
                                backgroundColor: colorPalettes.backgrounds.blue,
                                fill: true,
                            }]
                        }}
                        options={lineChartOptions}
                        loading={loading}
                        animationType="fade-in"
                    />
                </Col>
                <Col lg={4}>
                    <ChartCard
                        title="Category Split"
                        type="doughnut"
                        data={{
                            labels: ['Electronics', 'Clothing', 'Food'],
                            datasets: [{
                                data: [30, 45, 25],
                                backgroundColor: colorPalettes.vibrant,
                            }]
                        }}
                        options={doughnutChartOptions}
                        animationType="scale-in"
                    />
                </Col>
            </Row>
        </Container>
    );
};

export default MyReportPage;
```

---

## Best Practices

### 1. **Consistent Colors**
- Use `colorPalettes` from chartConfig for all charts
- Use semantic colors for revenue/expense comparisons
- Use vibrant palette for multi-category data

### 2. **Loading States**
- Always show loading spinner while fetching data
- Provide meaningful empty state messages

### 3. **Responsive Design**
- Use Bootstrap grid system (Col lg={8}, md={6}, etc.)
- Test on mobile devices
- Keep chart heights reasonable (300-400px)

### 4. **Tooltips**
- Format currency values in tooltips
- Show percentages for doughnut/pie charts
- Keep tooltip text concise

### 5. **Animations**
- Use 'fade-in' for line/bar charts
- Use 'scale-in' for doughnut/pie charts
- Don't overuse animations

### 6. **Accessibility**
- Provide descriptive titles and subtitles
- Use high-contrast colors
- Include empty state messages

---

## Troubleshooting

### Chart not rendering?
1. Check if data is in correct format
2. Verify Chart.js is registered
3. Check browser console for errors

### Colors not showing?
1. Ensure chartConfig is imported
2. Check color palette names
3. Verify CSS is loaded

### Empty state not showing?
1. Check if data is actually empty
2. Verify isEmpty logic in ChartCard
3. Provide custom empty messages

---

## Need Help?

Refer to:
- `CHART_ENHANCEMENTS.md` for detailed changes
- `src/config/chartConfig.js` for all color palettes
- `src/styles/charts.css` for styling classes
- Chart.js documentation: https://www.chartjs.org/
