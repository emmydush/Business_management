#!/usr/bin/env python3
"""
Dependency Update Manager for Business Management System
Automated dependency checking, security auditing, and update recommendations
"""

import subprocess
import json
import sys
import os
from datetime import datetime
from pathlib import Path
import requests
from typing import Dict, List, Any, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DependencyManager:
    """Manage backend and frontend dependencies"""
    
    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root) if project_root else Path(__file__).parent.parent
        self.backend_dir = self.project_root / 'backend'
        self.frontend_dir = self.project_root / 'frontend'
        self.check_results = {}
        
    def check_python_outdated(self) -> Dict[str, Any]:
        """Check for outdated Python packages"""
        logger.info("Checking Python dependencies...")
        
        try:
            # Install pip-review if not present
            result = subprocess.run(
                [sys.executable, '-m', 'pip', 'list', '--outdated', '--format=json'],
                cwd=self.backend_dir,
                capture_output=True,
                text=True,
                check=True
            )
            
            outdated = json.loads(result.stdout)
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'outdated_packages': outdated,
                'count': len(outdated),
                'status': 'success'
            }
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to check Python dependencies: {e}")
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'error': str(e),
                'status': 'error'
            }
    
    def check_npm_outdated(self) -> Dict[str, Any]:
        """Check for outdated NPM packages"""
        logger.info("Checking NPM dependencies...")
        
        try:
            result = subprocess.run(
                ['npm', 'outdated', '--json'],
                cwd=self.frontend_dir,
                capture_output=True,
                text=True
            )
            
            # npm outdated returns exit code 1 when packages are outdated
            outdated = json.loads(result.stdout) if result.stdout else {}
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'outdated_packages': outdated,
                'count': len(outdated),
                'status': 'success'
            }
        except Exception as e:
            logger.error(f"Failed to check NPM dependencies: {e}")
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'error': str(e),
                'status': 'error'
            }
    
    def check_python_vulnerabilities(self) -> Dict[str, Any]:
        """Check Python packages for known vulnerabilities"""
        logger.info("Checking Python vulnerabilities...")
        
        try:
            # Use safety check if available
            result = subprocess.run(
                [sys.executable, '-m', 'safety', 'check', '--json'],
                cwd=self.backend_dir,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                vulnerabilities = json.loads(result.stdout) if result.stdout else []
            else:
                # Fallback to pip-audit
                result = subprocess.run(
                    [sys.executable, '-m', 'pip_audit', '--format=json'],
                    cwd=self.backend_dir,
                    capture_output=True,
                    text=True
                )
                vulnerabilities = json.loads(result.stdout) if result.stdout else []
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'vulnerabilities': vulnerabilities,
                'count': len(vulnerabilities),
                'status': 'success'
            }
        except Exception as e:
            logger.error(f"Failed to check Python vulnerabilities: {e}")
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'error': str(e),
                'status': 'error'
            }
    
    def check_npm_vulnerabilities(self) -> Dict[str, Any]:
        """Check NPM packages for known vulnerabilities"""
        logger.info("Checking NPM vulnerabilities...")
        
        try:
            result = subprocess.run(
                ['npm', 'audit', '--json'],
                cwd=self.frontend_dir,
                capture_output=True,
                text=True
            )
            
            audit_data = json.loads(result.stdout) if result.stdout else {}
            
            vulnerabilities = audit_data.get('vulnerabilities', {})
            metadata = audit_data.get('metadata', {})
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'vulnerabilities': vulnerabilities,
                'metadata': metadata,
                'total_vulnerabilities': metadata.get('vulnerabilities', {}).get('total', 0),
                'status': 'success'
            }
        except Exception as e:
            logger.error(f"Failed to check NPM vulnerabilities: {e}")
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'error': str(e),
                'status': 'error'
            }
    
    def update_requirements_file(self) -> bool:
        """Update requirements.txt with latest versions"""
        logger.info("Updating requirements.txt...")
        
        try:
            # Use pip-review to update requirements
            subprocess.run(
                [sys.executable, '-m', 'pip_review', '--auto'],
                cwd=self.backend_dir,
                check=True
            )
            return True
        except Exception as e:
            logger.error(f"Failed to update requirements.txt: {e}")
            return False
    
    def update_package_json(self) -> bool:
        """Update package.json with latest versions"""
        logger.info("Updating package.json...")
        
        try:
            # Update dependencies
            subprocess.run(
                ['npm', 'update'],
                cwd=self.frontend_dir,
                check=True
            )
            return True
        except Exception as e:
            logger.error(f"Failed to update package.json: {e}")
            return False
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive dependency report"""
        logger.info("Generating dependency report...")
        
        report = {
            'generated_at': datetime.utcnow().isoformat(),
            'python': {
                'outdated': self.check_python_outdated(),
                'vulnerabilities': self.check_python_vulnerabilities()
            },
            'npm': {
                'outdated': self.check_npm_outdated(),
                'vulnerabilities': self.check_npm_vulnerabilities()
            }
        }
        
        # Calculate summary
        python_outdated = report['python']['outdated'].get('count', 0)
        python_vulns = report['python']['vulnerabilities'].get('count', 0)
        npm_outdated = report['npm']['outdated'].get('count', 0)
        npm_vulns = report['npm']['vulnerabilities'].get('total_vulnerabilities', 0)
        
        report['summary'] = {
            'total_outdated': python_outdated + npm_outdated,
            'total_vulnerabilities': python_vulns + npm_vulns,
            'python_outdated': python_outdated,
            'python_vulnerabilities': python_vulns,
            'npm_outdated': npm_outdated,
            'npm_vulnerabilities': npm_vulns,
            'needs_attention': (python_outdated > 0 or python_vulns > 0 or 
                              npm_outdated > 0 or npm_vulns > 0)
        }
        
        return report
    
    def save_report(self, report: Dict[str, Any], output_file: str = None):
        """Save report to file"""
        if not output_file:
            output_file = self.project_root / 'dependency_report.json'
        
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Report saved to {output_file}")

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Dependency Update Manager')
    parser.add_argument('--check', action='store_true', help='Check for outdated packages')
    parser.add_argument('--audit', action='store_true', help='Run security audit')
    parser.add_argument('--update', action='store_true', help='Update dependencies')
    parser.add_argument('--report', action='store_true', help='Generate full report')
    parser.add_argument('--output', type=str, help='Output file for report')
    
    args = parser.parse_args()
    
    manager = DependencyManager()
    
    if args.check:
        python_outdated = manager.check_python_outdated()
        npm_outdated = manager.check_npm_outdated()
        
        print("Python Outdated Packages:")
        print(json.dumps(python_outdated, indent=2))
        
        print("\nNPM Outdated Packages:")
        print(json.dumps(npm_outdated, indent=2))
    
    if args.audit:
        python_vulns = manager.check_python_vulnerabilities()
        npm_vulns = manager.check_npm_vulnerabilities()
        
        print("Python Vulnerabilities:")
        print(json.dumps(python_vulns, indent=2))
        
        print("\nNPM Vulnerabilities:")
        print(json.dumps(npm_vulns, indent=2))
    
    if args.update:
        print("Updating Python packages...")
        manager.update_requirements_file()
        
        print("Updating NPM packages...")
        manager.update_package_json()
    
    if args.report or not any([args.check, args.audit, args.update]):
        report = manager.generate_report()
        manager.save_report(report, args.output)
        
        print("\nDependency Report Summary:")
        print(f"Total Outdated: {report['summary']['total_outdated']}")
        print(f"Total Vulnerabilities: {report['summary']['total_vulnerabilities']}")
        print(f"Needs Attention: {report['summary']['needs_attention']}")

if __name__ == '__main__':
    main()
