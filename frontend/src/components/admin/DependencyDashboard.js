import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Shield,
  Terminal,
  Clock,
  AlertCircle,
  Download,
  GitCommit
} from 'lucide-react';

const DependencyDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [pythonDeps, setPythonDeps] = useState({
    total: 0,
    outdated: 0,
    vulnerable: 0,
    packages: []
  });
  const [npmDeps, setNpmDeps] = useState({
    total: 0,
    outdated: 0,
    vulnerable: 0,
    packages: []
  });

  useEffect(() => {
    loadDependencyData();
  }, []);

  const loadDependencyData = async () => {
    // In a real implementation, this would fetch from your API
    // For now, we'll simulate the data structure
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setPythonDeps({
        total: 42,
        outdated: 3,
        vulnerable: 1,
        packages: [
          { name: 'Flask', current: '2.3.3', latest: '3.0.3', status: 'outdated', severity: 'medium' },
          { name: 'requests', current: '2.31.0', latest: '2.32.3', status: 'outdated', severity: 'low' },
          { name: 'cryptography', current: '42.0.0', latest: '44.0.0', status: 'vulnerable', severity: 'high' }
        ]
      });
      
      setNpmDeps({
        total: 28,
        outdated: 5,
        vulnerable: 2,
        packages: [
          { name: 'react', current: '18.2.0', latest: '19.0.0', status: 'outdated', severity: 'medium' },
          { name: '@mui/material', current: '5.11.12', latest: '6.4.5', status: 'outdated', severity: 'low' },
          { name: 'axios', current: '1.3.4', latest: '1.7.9', status: 'vulnerable', severity: 'high' }
        ]
      });
      
      setLastUpdate(new Date().toISOString());
      setLoading(false);
    }, 1000);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'vulnerable':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'outdated':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const runSecurityAudit = async () => {
    // This would trigger the security audit workflow
    console.log('Running security audit...');
  };

  const updateDependencies = async (type) => {
    // This would trigger the dependency update workflow
    console.log(`Updating ${type} dependencies...`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading dependency data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dependency Management</h1>
          <p className="text-gray-600">
            Last updated: {lastUpdate ? new Date(lastUpdate).toLocaleString() : 'Never'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={runSecurityAudit}
            className="flex items-center space-x-2"
          >
            <Shield className="h-4 w-4" />
            <span>Security Audit</span>
          </Button>
          <Button
            onClick={loadDependencyData}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Python Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pythonDeps.total}</div>
            <p className="text-xs text-muted-foreground">
              {pythonDeps.outdated} outdated, {pythonDeps.vulnerable} vulnerable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NPM Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{npmDeps.total}</div>
            <p className="text-xs text-muted-foreground">
              {npmDeps.outdated} outdated, {npmDeps.vulnerable} vulnerable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {pythonDeps.vulnerable + npmDeps.vulnerable}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Updates Available</CardTitle>
            <Download className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {pythonDeps.outdated + npmDeps.outdated}
            </div>
            <p className="text-xs text-muted-foreground">
              Can be safely updated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Vulnerabilities Alert */}
      {(pythonDeps.vulnerable > 0 || npmDeps.vulnerable > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>Critical Security Vulnerabilities Detected</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">
              {pythonDeps.vulnerable + npmDeps.vulnerable} package(s) with known security vulnerabilities require immediate attention.
            </p>
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                onClick={() => updateDependencies('all')}
              >
                Update All Vulnerable Packages
              </Button>
              <Button
                variant="outline"
                onClick={runSecurityAudit}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Python Dependencies */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Terminal className="h-5 w-5" />
            <span>Python Dependencies</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateDependencies('python')}
          >
            Update Python Packages
          </Button>
        </CardHeader>
        <CardContent>
          {pythonDeps.packages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>All Python packages are up to date!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pythonDeps.packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(pkg.status)}
                    <div>
                      <p className="font-medium text-gray-900">{pkg.name}</p>
                      <p className="text-sm text-gray-600">
                        {pkg.current} → {pkg.latest}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityColor(pkg.severity)}>
                      {pkg.severity}
                    </Badge>
                    <Badge variant={pkg.status === 'vulnerable' ? 'destructive' : 'secondary'}>
                      {pkg.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* NPM Dependencies */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <GitCommit className="h-5 w-5" />
            <span>NPM Dependencies</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateDependencies('npm')}
          >
            Update NPM Packages
          </Button>
        </CardHeader>
        <CardContent>
          {npmDeps.packages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>All NPM packages are up to date!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {npmDeps.packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(pkg.status)}
                    <div>
                      <p className="font-medium text-gray-900">{pkg.name}</p>
                      <p className="text-sm text-gray-600">
                        {pkg.current} → {pkg.latest}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityColor(pkg.severity)}>
                      {pkg.severity}
                    </Badge>
                    <Badge variant={pkg.status === 'vulnerable' ? 'destructive' : 'secondary'}>
                      {pkg.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Updates</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">Security Patch: cryptography</p>
                <p className="text-sm text-gray-600">Updated to version 44.0.0</p>
              </div>
              <span className="text-sm text-gray-500">2 days ago</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">Feature Update: React</p>
                <p className="text-sm text-gray-600">Updated to version 19.0.0</p>
              </div>
              <span className="text-sm text-gray-500">1 week ago</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">Dependency Update: Flask</p>
                <p className="text-sm text-gray-600">Updated to version 3.0.3</p>
              </div>
              <span className="text-sm text-gray-500">2 weeks ago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automated Updates */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Update Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Security Patches</h3>
              <p className="text-sm text-gray-600 mb-3">
                Automatically apply security patches for critical vulnerabilities
              </p>
              <Badge className="bg-green-100 text-green-800">Enabled</Badge>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Minor Updates</h3>
              <p className="text-sm text-gray-600 mb-3">
                Weekly automated updates for minor version bumps
              </p>
              <Badge className="bg-green-100 text-green-800">Enabled</Badge>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Major Updates</h3>
              <p className="text-sm text-gray-600 mb-3">
                Manual review required for major version updates
              </p>
              <Badge className="bg-yellow-100 text-yellow-800">Manual</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DependencyDashboard;
