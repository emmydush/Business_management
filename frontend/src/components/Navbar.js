import React from 'react';
import { Navbar, Nav, Container, Dropdown, Button } from 'react-bootstrap';
import {
  FiBell,
  FiUser,
  FiLogOut,
  FiSettings,
  FiSearch
} from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const CustomNavbar = ({ isCollapsed }) => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const user = JSON.parse(localStorage.getItem('user')) || {
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@tradeflow.com'
  };

  const handleLogout = () => {
    toast((t) => (
      <span>
        Are you sure you want to logout?
        <div className="mt-2 d-flex gap-2">
          <Button size="sm" variant="danger" onClick={() => {
            toast.dismiss(t.id);
            window.location.href = '/logout';
          }}>
            Logout
          </Button>
          <Button size="sm" variant="light" onClick={() => toast.dismiss(t.id)}>
            Cancel
          </Button>
        </div>
      </span>
    ), { duration: 5000 });
  };

  return (
    <Navbar expand="lg" fixed="top" className="navbar-custom py-2 shadow-sm" style={{
      left: isCollapsed ? '80px' : '260px',
      width: `calc(100% - ${isCollapsed ? '80px' : '260px'})`,
      transition: 'all 0.3s ease'
    }}>
      <Container fluid className="px-4">
        <div className="d-flex align-items-center">
          <h5 className="mb-0 fw-bold text-dark page-title">{getPageTitle()}</h5>
        </div>

        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="ms-auto align-items-center flex-row">
            {/* Search Bar */}
            <div className="d-none d-md-flex align-items-center bg-light rounded-pill px-3 py-1 border me-3 search-wrapper">
              <FiSearch className="text-muted me-2" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-0 small"
                style={{ outline: 'none', width: '120px' }}
              />
            </div>

            {/* Notifications */}
            <Nav.Link className="text-dark position-relative me-3 p-0 d-flex align-items-center icon-btn">
              <FiBell size={20} />
              <span className="notification-badge">3</span>
            </Nav.Link>

            {/* Profile Dropdown */}
            <Dropdown align="end">
              <Dropdown.Toggle variant="link" className="text-dark d-flex align-items-center p-0 no-caret text-decoration-none profile-toggle">
                <div className="avatar-wrapper">
                  <FiUser size={20} className="text-primary" />
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu className="border-0 shadow-lg mt-2 dropdown-menu-custom">
                <div className="px-3 py-2 border-bottom mb-2">
                  <div className="fw-bold small">{user.first_name} {user.last_name}</div>
                  <div className="text-muted small" style={{ fontSize: '11px' }}>{user.email}</div>
                </div>
                <Dropdown.Item as={Link} to="/company-profile" className="py-2 d-flex align-items-center">
                  <FiUser className="me-2 text-muted" /> My Profile
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/settings" className="py-2 d-flex align-items-center">
                  <FiSettings className="me-2 text-muted" /> Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="py-2 d-flex align-items-center text-danger">
                  <FiLogOut className="me-2" /> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>

      <style dangerouslySetInnerHTML={{
        __html: `
        .navbar-custom {
          background: rgba(255, 255, 255, 0.8) !important;
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          z-index: 1050;
        }
        
        .page-title {
          letter-spacing: -0.5px;
        }

        .search-wrapper {
          transition: all 0.3s ease;
          border: 1px solid transparent !important;
        }
        
        .search-wrapper:focus-within {
          border-color: #2563eb !important;
          background: white !important;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
          width: 200px;
        }

        .icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .icon-btn:hover {
          background: #f1f5f9;
        }

        .notification-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid white;
        }

        .avatar-wrapper {
          width: 38px;
          height: 38px;
          background: rgba(37, 99, 235, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(37, 99, 235, 0.1);
          transition: all 0.2s ease;
        }
        
        .profile-toggle:hover .avatar-wrapper {
          background: rgba(37, 99, 235, 0.2);
          transform: translateY(-1px);
        }

        .dropdown-menu-custom {
          border-radius: 16px;
          padding: 0.75rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          min-width: 200px;
        }
        
        .dropdown-item {
          border-radius: 10px;
          font-size: 0.875rem;
          margin: 2px 0;
          padding: 0.6rem 0.75rem;
        }
        
        .dropdown-item:hover {
          background-color: #f8fafc;
        }
      `}} />
    </Navbar>
  );
};

export default CustomNavbar;