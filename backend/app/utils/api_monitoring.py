"""
API Monitoring and Anomaly Detection System
"""

import time
import json
import statistics
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict, deque
from dataclasses import dataclass, asdict
from threading import Lock
import numpy as np
from scipy import stats
from flask import request, g, current_app
from redis import Redis

@dataclass
class APIMetric:
    """API metric data point"""
    timestamp: float
    endpoint: str
    method: str
    status_code: int
    response_time: float
    request_size: int
    response_size: int
    user_id: Optional[str] = None
    ip_address: str = ""
    user_agent: str = ""
    api_key: Optional[str] = None
    error_message: Optional[str] = None

class AnomalyDetector:
    """Statistical anomaly detection for API metrics"""
    
    def __init__(self, window_size: int = 100, threshold: float = 2.5):
        self.window_size = window_size
        self.threshold = threshold
        self.metrics_history = defaultdict(lambda: deque(maxlen=window_size))
        self.lock = Lock()
    
    def add_metric(self, metric: APIMetric):
        """Add a metric to the history"""
        with self.lock:
            key = f"{metric.endpoint}:{metric.method}"
            self.metrics_history[key].append(metric)
    
    def detect_anomalies(self, metric: APIMetric) -> List[Dict[str, Any]]:
        """Detect anomalies in a metric"""
        anomalies = []
        key = f"{metric.endpoint}:{metric.method}"
        
        with self.lock:
            history = list(self.metrics_history[key])
        
        if len(history) < 10:  # Need enough data for statistical analysis
            return anomalies
        
        # Extract response times
        response_times = [m.response_time for m in history]
        
        # Detect response time anomalies
        if len(response_times) >= 10:
            mean_rt = statistics.mean(response_times)
            std_rt = statistics.stdev(response_times) if len(response_times) > 1 else 0
            
            if std_rt > 0:
                z_score = abs(metric.response_time - mean_rt) / std_rt
                if z_score > self.threshold:
                    anomalies.append({
                        'type': 'response_time_anomaly',
                        'severity': 'high' if z_score > self.threshold * 1.5 else 'medium',
                        'z_score': z_score,
                        'mean_response_time': mean_rt,
                        'std_response_time': std_rt,
                        'current_response_time': metric.response_time,
                        'description': f"Response time is {z_score:.2f} standard deviations from normal"
                    })
        
        # Detect error rate anomalies
        error_metrics = [m for m in history if m.status_code >= 400]
        error_rate = len(error_metrics) / len(history)
        
        if metric.status_code >= 400:
            recent_error_rate = len([m for m in history[-10:] if m.status_code >= 400]) / min(10, len(history))
            
            if recent_error_rate > 0.5:  # More than 50% errors in recent requests
                anomalies.append({
                    'type': 'error_rate_anomaly',
                    'severity': 'high',
                    'error_rate': recent_error_rate,
                    'recent_errors': len([m for m in history[-10:] if m.status_code >= 400]),
                    'description': f"High error rate detected: {recent_error_rate:.1%}"
                })
        
        # Detect request size anomalies
        request_sizes = [m.request_size for m in history if m.request_size > 0]
        if len(request_sizes) >= 10 and metric.request_size > 0:
            mean_size = statistics.mean(request_sizes)
            std_size = statistics.stdev(request_sizes) if len(request_sizes) > 1 else 0
            
            if std_size > 0:
                z_score = abs(metric.request_size - mean_size) / std_size
                if z_score > self.threshold:
                    anomalies.append({
                        'type': 'request_size_anomaly',
                        'severity': 'medium',
                        'z_score': z_score,
                        'mean_request_size': mean_size,
                        'current_request_size': metric.request_size,
                        'description': f"Request size is {z_score:.2f} standard deviations from normal"
                    })
        
        return anomalies
    
    def get_baseline_stats(self, endpoint: str, method: str) -> Dict[str, Any]:
        """Get baseline statistics for an endpoint"""
        key = f"{endpoint}:{method}"
        
        with self.lock:
            history = list(self.metrics_history[key])
        
        if len(history) < 2:
            return {}
        
        response_times = [m.response_time for m in history]
        error_metrics = [m for m in history if m.status_code >= 400]
        
        return {
            'total_requests': len(history),
            'avg_response_time': statistics.mean(response_times),
            'min_response_time': min(response_times),
            'max_response_time': max(response_times),
            'p95_response_time': np.percentile(response_times, 95),
            'p99_response_time': np.percentile(response_times, 99),
            'error_rate': len(error_metrics) / len(history),
            'status_codes': dict(Counter([m.status_code for m in history]))
        }

class APIMonitor:
    """Comprehensive API monitoring system"""
    
    def __init__(self, redis_client=None):
        self.redis = redis_client or Redis(decode_responses=True)
        self.anomaly_detector = AnomalyDetector()
        self.metrics_buffer = []
        self.buffer_size = 100
        self.lock = Lock()
        
        # Monitoring windows
        self.realtime_window = 300  # 5 minutes
        self.hourly_window = 3600   # 1 hour
        self.daily_window = 86400   # 24 hours
    
    def record_request(self, 
                      endpoint: str, 
                      method: str, 
                      status_code: int,
                      response_time: float,
                      request_size: int = 0,
                      response_size: int = 0,
                      error_message: str = None):
        """Record API request metrics"""
        metric = APIMetric(
            timestamp=time.time(),
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            response_time=response_time,
            request_size=request_size,
            response_size=response_size,
            user_id=getattr(g, 'user_id', None),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', ''),
            api_key=getattr(g, 'api_key', None),
            error_message=error_message
        )
        
        # Add to anomaly detector
        self.anomaly_detector.add_metric(metric)
        
        # Detect anomalies
        anomalies = self.anomaly_detector.detect_anomalies(metric)
        
        # Log anomalies
        for anomaly in anomalies:
            self._log_anomaly(metric, anomaly)
        
        # Buffer metric for batch processing
        with self.lock:
            self.metrics_buffer.append(metric)
            
            if len(self.metrics_buffer) >= self.buffer_size:
                self._flush_metrics_buffer()
    
    def _flush_metrics_buffer(self):
        """Flush metrics buffer to storage"""
        if not self.metrics_buffer:
            return
        
        try:
            # Store metrics in Redis for real-time monitoring
            pipe = self.redis.pipeline()
            
            for metric in self.metrics_buffer:
                # Store in time-series data structure
                timestamp = int(metric.timestamp)
                key = f"api_metrics:{metric.endpoint}:{metric.method}:{timestamp}"
                
                metric_data = {
                    'timestamp': metric.timestamp,
                    'status_code': metric.status_code,
                    'response_time': metric.response_time,
                    'request_size': metric.request_size,
                    'response_size': metric.response_size,
                    'user_id': metric.user_id,
                    'ip_address': metric.ip_address,
                    'error_message': metric.error_message
                }
                
                pipe.hset(key, mapping=metric_data)
                pipe.expire(key, self.daily_window)
                
                # Update aggregates
                self._update_aggregates(pipe, metric)
            
            pipe.execute()
            self.metrics_buffer.clear()
            
        except Exception as e:
            print(f"Failed to flush metrics buffer: {str(e)}")
    
    def _update_aggregates(self, pipe, metric: APIMetric):
        """Update aggregate metrics"""
        timestamp = int(metric.timestamp)
        
        # Response time aggregates
        rt_key = f"aggregates:response_time:{metric.endpoint}:{metric.method}"
        pipe.lpush(rt_key, metric.response_time)
        pipe.ltrim(rt_key, 0, 999)  # Keep last 1000 values
        pipe.expire(rt_key, self.hourly_window)
        
        # Status code counts
        status_key = f"aggregates:status_codes:{metric.endpoint}:{metric.method}"
        pipe.hincrby(status_key, str(metric.status_code), 1)
        pipe.expire(status_key, self.hourly_window)
        
        # Error tracking
        if metric.status_code >= 400:
            error_key = f"aggregates:errors:{metric.endpoint}:{metric.method}"
            pipe.lpush(error_key, json.dumps({
                'timestamp': metric.timestamp,
                'status_code': metric.status_code,
                'error_message': metric.error_message,
                'ip_address': metric.ip_address,
                'user_id': metric.user_id
            }))
            pipe.ltrim(error_key, 0, 99)  # Keep last 100 errors
            pipe.expire(error_key, self.hourly_window)
    
    def get_realtime_metrics(self, endpoint: str = None, method: str = None) -> Dict[str, Any]:
        """Get real-time metrics"""
        try:
            now = int(time.time())
            window_start = now - self.realtime_window
            
            if endpoint and method:
                # Get metrics for specific endpoint
                pattern = f"api_metrics:{endpoint}:{method}:*"
                keys = self.redis.keys(pattern)
                
                metrics = []
                for key in keys:
                    data = self.redis.hgetall(key)
                    if data and int(float(data['timestamp'])) >= window_start:
                        metrics.append(data)
                
                return self._calculate_metrics_summary(metrics)
            else:
                # Get overall metrics
                return self._get_overall_metrics(window_start)
                
        except Exception as e:
            print(f"Failed to get realtime metrics: {str(e)}")
            return {}
    
    def _calculate_metrics_summary(self, metrics: List[Dict]) -> Dict[str, Any]:
        """Calculate summary statistics from metrics"""
        if not metrics:
            return {}
        
        response_times = [float(m['response_time']) for m in metrics]
        status_codes = [int(m['status_code']) for m in metrics]
        error_count = len([s for s in status_codes if s >= 400])
        
        return {
            'total_requests': len(metrics),
            'requests_per_second': len(metrics) / self.realtime_window,
            'avg_response_time': statistics.mean(response_times),
            'min_response_time': min(response_times),
            'max_response_time': max(response_times),
            'p95_response_time': np.percentile(response_times, 95),
            'p99_response_time': np.percentile(response_times, 99),
            'error_rate': error_count / len(metrics),
            'error_count': error_count,
            'status_code_distribution': dict(Counter(status_codes)),
            'unique_ips': len(set(m['ip_address'] for m in metrics)),
            'unique_users': len(set(m['user_id'] for m in metrics if m['user_id']))
        }
    
    def _get_overall_metrics(self, window_start: int) -> Dict[str, Any]:
        """Get overall metrics across all endpoints"""
        pattern = f"api_metrics:*"
        keys = self.redis.keys(pattern)
        
        all_metrics = []
        for key in keys:
            data = self.redis.hgetall(key)
            if data and int(float(data['timestamp'])) >= window_start:
                all_metrics.append(data)
        
        return self._calculate_metrics_summary(all_metrics)
    
    def get_top_endpoints(self, limit: int = 10, metric: str = 'requests') -> List[Dict[str, Any]]:
        """Get top endpoints by various metrics"""
        try:
            # Get all aggregate keys
            pattern = "aggregates:response_time:*"
            keys = self.redis.keys(pattern)
            
            endpoint_metrics = []
            
            for key in keys:
                parts = key.split(':')
                if len(parts) >= 4:
                    endpoint, method = parts[2], parts[3]
                    
                    # Get response times
                    response_times = [float(rt) for rt in self.redis.lrange(key, 0, -1)]
                    
                    # Get status codes
                    status_key = f"aggregates:status_codes:{endpoint}:{method}"
                    status_codes = self.redis.hgetall(status_key)
                    
                    total_requests = sum(int(count) for count in status_codes.values())
                    error_count = sum(int(count) for code, count in status_codes.items() if int(code) >= 400)
                    
                    if response_times:
                        endpoint_metrics.append({
                            'endpoint': endpoint,
                            'method': method,
                            'total_requests': total_requests,
                            'avg_response_time': statistics.mean(response_times),
                            'error_rate': error_count / total_requests if total_requests > 0 else 0,
                            'p95_response_time': np.percentile(response_times, 95)
                        })
            
            # Sort by requested metric
            if metric == 'requests':
                endpoint_metrics.sort(key=lambda x: x['total_requests'], reverse=True)
            elif metric == 'response_time':
                endpoint_metrics.sort(key=lambda x: x['avg_response_time'], reverse=True)
            elif metric == 'error_rate':
                endpoint_metrics.sort(key=lambda x: x['error_rate'], reverse=True)
            
            return endpoint_metrics[:limit]
            
        except Exception as e:
            print(f"Failed to get top endpoints: {str(e)}")
            return []
    
    def get_error_analysis(self, hours: int = 1) -> Dict[str, Any]:
        """Get detailed error analysis"""
        try:
            window_start = int(time.time()) - (hours * 3600)
            pattern = "aggregates:errors:*"
            keys = self.redis.keys(pattern)
            
            all_errors = []
            for key in keys:
                errors = self.redis.lrange(key, 0, -1)
                for error_str in errors:
                    error = json.loads(error_str)
                    if int(float(error['timestamp'])) >= window_start:
                        all_errors.append(error)
            
            if not all_errors:
                return {}
            
            # Group errors by status code
            error_by_status = defaultdict(list)
            for error in all_errors:
                error_by_status[error['status_code']].append(error)
            
            # Group errors by endpoint
            error_by_endpoint = defaultdict(list)
            for error in all_errors:
                error_by_endpoint[f"{error.get('endpoint', 'unknown')}"].append(error)
            
            # Group errors by IP
            error_by_ip = defaultdict(list)
            for error in all_errors:
                error_by_ip[error['ip_address']].append(error)
            
            return {
                'total_errors': len(all_errors),
                'error_rate': len(all_errors) / (hours * 3600),  # errors per second
                'errors_by_status': {
                    status: len(errors) for status, errors in error_by_status.items()
                },
                'top_error_endpoints': sorted(
                    [(endpoint, len(errors)) for endpoint, errors in error_by_endpoint.items()],
                    key=lambda x: x[1], reverse=True
                )[:10],
                'top_error_ips': sorted(
                    [(ip, len(errors)) for ip, errors in error_by_ip.items()],
                    key=lambda x: x[1], reverse=True
                )[:10],
                'recent_errors': sorted(all_errors, key=lambda x: x['timestamp'], reverse=True)[:20]
            }
            
        except Exception as e:
            print(f"Failed to get error analysis: {str(e)}")
            return {}
    
    def _log_anomaly(self, metric: APIMetric, anomaly: Dict[str, Any]):
        """Log detected anomaly"""
        try:
            from app.utils.event_monitor import event_monitor, EventCategory, EventType, EventSeverity
            
            event_monitor.log_event(
                category=EventCategory.PERFORMANCE,
                event_type=EventType.SYSTEM_ERROR,
                severity=EventSeverity.HIGH if anomaly['severity'] == 'high' else EventSeverity.MEDIUM,
                description=f"API Anomaly Detected: {anomaly['type']}",
                details={
                    'anomaly_type': anomaly['type'],
                    'severity': anomaly['severity'],
                    'endpoint': metric.endpoint,
                    'method': metric.method,
                    'user_id': metric.user_id,
                    'ip_address': metric.ip_address,
                    'anomaly_details': anomaly
                },
                entity_type='api_endpoint',
                entity_id=f"{metric.endpoint}:{metric.method}",
                user_id=metric.user_id,
                tags=['api_monitoring', 'anomaly', anomaly['type']]
            )
        except Exception:
            # Don't let logging errors break the application
            pass

class APIMonitoringMiddleware:
    """Middleware for automatic API monitoring"""
    
    def __init__(self, app=None, redis_client=None):
        self.api_monitor = APIMonitor(redis_client)
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize with Flask app"""
        app.before_request(self._before_request)
        app.after_request(self._after_request)
        
        # Store monitor in app
        app.extensions['api_monitor'] = self.api_monitor
        
        # Register monitoring endpoints
        @app.route('/api/monitoring/metrics')
        def get_metrics():
            endpoint = request.args.get('endpoint')
            method = request.args.get('method')
            return jsonify(self.api_monitor.get_realtime_metrics(endpoint, method))
        
        @app.route('/api/monitoring/top-endpoints')
        def get_top_endpoints():
            limit = int(request.args.get('limit', 10))
            metric = request.args.get('metric', 'requests')
            return jsonify(self.api_monitor.get_top_endpoints(limit, metric))
        
        @app.route('/api/monitoring/errors')
        def get_error_analysis():
            hours = int(request.args.get('hours', 1))
            return jsonify(self.api_monitor.get_error_analysis(hours))
    
    def _before_request(self):
        """Record request start time"""
        g.start_time = time.time()
        g.request_size = len(request.get_data()) if request.get_data() else 0
    
    def _after_request(self, response):
        """Record request metrics"""
        if hasattr(g, 'start_time'):
            response_time = time.time() - g.start_time
            
            # Determine endpoint name
            endpoint = request.endpoint or request.path
            
            # Record the metric
            self.api_monitor.record_request(
                endpoint=endpoint,
                method=request.method,
                status_code=response.status_code,
                response_time=response_time,
                request_size=getattr(g, 'request_size', 0),
                response_size=len(response.get_data()) if response.get_data() else 0,
                error_message=None if response.status_code < 400 else response.get_data(as_text=True)
            )
        
        return response

# Helper function
from collections import Counter

# Global instance
api_monitor = APIMonitor()
api_monitoring_middleware = APIMonitoringMiddleware()

# Decorator for custom monitoring
def monitor_endpoint(custom_name: str = None):
    """Decorator to add custom monitoring to endpoints"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                
                # Record successful execution
                if hasattr(g, 'start_time'):
                    response_time = time.time() - g.start_time
                    endpoint_name = custom_name or f"{func.__module__}.{func.__name__}"
                    
                    api_monitor.record_request(
                        endpoint=endpoint_name,
                        method=request.method,
                        status_code=200,
                        response_time=response_time
                    )
                
                return result
                
            except Exception as e:
                # Record error
                if hasattr(g, 'start_time'):
                    response_time = time.time() - g.start_time
                    endpoint_name = custom_name or f"{func.__module__}.{func.__name__}"
                    
                    api_monitor.record_request(
                        endpoint=endpoint_name,
                        method=request.method,
                        status_code=500,
                        response_time=response_time,
                        error_message=str(e)
                    )
                
                raise
        
        return wrapper
    return decorator
