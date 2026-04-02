import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  TrendingUp,
  Users,
  Shield,
  Activity,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { eventsAPI } from '../../services/api';

const EventMonitoringDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    severity: '',
    days: 30
  });
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load statistics
      const statsResponse = await eventsAPI.getStatistics(filters.days);
      setStatistics(statsResponse.data);
      
      // Load recent events
      const eventsResponse = await eventsAPI.getEvents({
        page: pagination.page,
        per_page: pagination.per_page,
        ...filters
      });
      setEvents(eventsResponse.data.events);
      setPagination(eventsResponse.data.pagination);
      
      // Load alerts
      const alertsResponse = await eventsAPI.getAlerts();
      setAlerts(alertsResponse.data.alerts);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'business':
        return <TrendingUp className="h-4 w-4" />;
      case 'system':
        return <Activity className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const exportEvents = async (format) => {
    try {
      const response = await eventsAPI.exportEvents({
        format,
        start_date: new Date(Date.now() - filters.days * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString()
      });
      
      // TODO: Handle file download
      console.log('Export initiated:', response.data);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading && !statistics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Monitoring</h1>
          <p className="text-gray-600">Comprehensive audit logging and security monitoring</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => exportEvents('csv')}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => exportEvents('excel')}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Excel</span>
          </Button>
          <Button onClick={loadDashboardData} className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_events?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                Last {filters.days} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statistics.severity_counts?.critical || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Events</CardTitle>
              <Shield className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {statistics.category_counts?.security || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Security-related activities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statistics.top_users?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Users with activity
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="">All Categories</option>
                <option value="security">Security</option>
                <option value="business">Business</option>
                <option value="system">System</option>
                <option value="user">User</option>
                <option value="data">Data</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Period
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.days}
                onChange={(e) => setFilters({ ...filters, days: parseInt(e.target.value) })}
              >
                <option value={1}>Last 24 hours</option>
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ category: '', severity: '', days: 30 })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Events Alert */}
      {statistics?.recent_critical_events?.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Critical Events Requiring Attention</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.recent_critical_events.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-white rounded border border-red-200">
                  <div className="flex items-center space-x-3">
                    {getSeverityIcon(event.severity)}
                    <div>
                      <p className="font-medium text-gray-900">{event.description}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(event.timestamp).toLocaleString()} - {event.ip_address}
                      </p>
                    </div>
                  </div>
                  <Badge className={getSeverityColor(event.severity)}>
                    {event.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No events found matching the current filters
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(event.category)}
                    <div>
                      <p className="font-medium text-gray-900">{event.description}</p>
                      <p className="text-sm text-gray-600">
                        {event.event_type} • {new Date(event.timestamp).toLocaleString()} • {event.ip_address}
                      </p>
                      {event.details && Object.keys(event.details).length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Details: {JSON.stringify(event.details).substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="flex items-center space-x-1">
                      {getCategoryIcon(event.category)}
                      <span>{event.category}</span>
                    </Badge>
                    <Badge className={getSeverityColor(event.severity)}>
                      {event.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => {
                  setPagination({ ...pagination, page: pagination.page - 1 });
                  loadDashboardData();
                }}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.pages}
                onClick={() => {
                  setPagination({ ...pagination, page: pagination.page + 1 });
                  loadDashboardData();
                }}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{alert.name}</p>
                    <p className="text-sm text-gray-600">{alert.description}</p>
                    <p className="text-xs text-gray-500">
                      Category: {alert.event_category} • Created: {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={alert.is_active ? 'default' : 'secondary'}>
                      {alert.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {alert.severity && (
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EventMonitoringDashboard;
