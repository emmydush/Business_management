import React from 'react';
import { Navbar, Nav, Container, Dropdown, Button } from 'react-bootstrap';
import { FiMenu, FiBell, FiUser, FiLogOut, FiSettings, FiSearch } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const CustomNavbar = ({ onToggleSidebar }) => {
  return (
    <Navbar expand="lg" className="navbar-custom sticky-top py-2 shadow-sm">
      <Container fluid>
        {/* Toggle Button for Mobile */}
        <Button
          variant="link"
          className="text-dark p-0 me-3 d-md-none"
          onClick={onToggleSidebar}
        >
          <FiMenu size={24} />
        </Button>

        {/* Right Side Items: Search, Notifications, Profile */}
        <Nav className="ms-auto align-items-center flex-row">
          {/* Search Bar - Moved to the right to avoid confusion with sidebar */}
          <div className="d-none d-md-flex align-items-center bg-light rounded-pill px-3 py-1 border me-4">
            <FiSearch className="text-muted me-2" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-0 small"
              style={{ outline: 'none', width: '180px' }}
            />
          </div>

          {/* Notifications */}
          <Nav.Link className="text-dark position-relative me-4 p-0 d-flex align-items-center">
            <FiBell size={22} />
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px', marginTop: '2px' }}>
              3
            </span>
          </Nav.Link>

          {/* Profile Dropdown */}
          <Dropdown align="end">
            <Dropdown.Toggle variant="link" className="text-dark d-flex align-items-center p-0 no-caret text-decoration-none">
              <div className="me-3 text-end d-none d-sm-block">
                <div className="fw-bold small lh-1">Admin User</div>
                <div className="text-muted small" style={{ fontSize: '11px' }}>Administrator</div>
              </div>
              <div className="bg-primary bg-opacity-10 rounded-circle p-1 border border-primary border-opacity-20 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <FiUser size={24} className="text-primary" />
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu className="border-0 shadow-lg mt-2" style={{ minWidth: '200px' }}>
              <div className="px-3 py-2 border-bottom d-sm-none">
                <div className="fw-bold small">Admin User</div>
                <div className="text-muted small">Administrator</div>
              </div>
              <Dropdown.Item as={Link} to="/company-profile" className="py-2 d-flex align-items-center">
                <FiUser className="me-2 text-muted" /> My Profile
              </Dropdown.Item>
              <Dropdown.Item as={Link} to="/settings" className="py-2 d-flex align-items-center">
                <FiSettings className="me-2 text-muted" /> Settings
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item as={Link} to="/logout" className="py-2 d-flex align-items-center text-danger">
                <FiLogOut className="me-2" /> Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;