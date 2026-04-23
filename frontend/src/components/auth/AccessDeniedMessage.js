import React from 'react';
import { Alert, Container } from 'react-bootstrap';

/**
 * AccessDeniedMessage Component
 * Provides consistent, user-friendly access denied messages
 */
export const AccessDeniedMessage = ({ 
  featureName, 
  requiredRole, 
  requiredPermission,
  icon = 'bi-shield-exclamation-triangle',
  customMessage = null,
  contactAdmin = true
}) => {
  return (
    <Container fluid className="text-center py-5">
      <Alert variant="warning" className="mx-auto" style={{ maxWidth: '600px' }}>
        <div className="text-center mb-4">
          <i className={`bi ${icon}`} style={{ fontSize: '3rem', color: '#6c757d' }}></i>
        </div>
        <h4 className="text-center mb-3">
          <i className="bi bi-shield-exclamation-triangle me-2"></i>
          {featureName} Access Required
        </h4>
        <p className="text-center mb-3">
          {customMessage || `You don&apos;t have permission to access ${featureName}.`}
        </p>
        <div className="text-center">
          {requiredRole && (
            <p className="mb-2">
              <strong>Required Role:</strong> {requiredRole}
            </p>
          )}
          {requiredPermission && (
            <p className="mb-2">
              <strong>Required Permission:</strong> {requiredPermission}
            </p>
          )}
          {contactAdmin && (
            <p className="text-muted mb-0">
              <small>
                Please contact your administrator if you believe this is an error, or if you need additional permissions.
              </small>
            </p>
          )}
        </div>
      </Alert>
    </Container>
  );
};

export default AccessDeniedMessage;
