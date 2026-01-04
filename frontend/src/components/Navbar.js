import React from 'react';
import { Navbar, Nav, NavDropdown, Container, Button } from 'react-bootstrap';
import { FiUser, FiSettings, FiLogOut, FiBell, FiMenu } from 'react-icons/fi';

const NavbarComponent = ({ onToggleSidebar }) => {
  return (
    <Navbar expand="lg" className="px-4 py-3 bg-white border-bottom sticky-top">
      <Container fluid>
        <div className="d-flex align-items-center">
          <Button
            variant="link"
            className="p-0 me-3 text-dark d-md-none"
            onClick={onToggleSidebar}
          >
            <FiMenu size={24} />
          </Button>
          <Navbar.Brand href="/" className="fw-bold text-dark">
            Dashboard
          </Navbar.Brand>
        </div>

        <Navbar.Toggle aria-controls="navbar-nav" />

        <Navbar.Collapse id="navbar-nav" className="justify-content-end">
          <Nav className="align-items-center">
            <Nav.Link href="#notifications" className="me-3 text-secondary">
              <FiBell size={20} />
            </Nav.Link>
            <NavDropdown
              title={
                <div className="d-inline-flex align-items-center text-dark">
                  <div className="bg-light rounded-circle p-2 me-2">
                    <FiUser size={18} />
                  </div>
                  <span className="fw-medium">Admin User</span>
                </div>
              }
              id="profile-dropdown"
              align="end"
            >
              <NavDropdown.Item href="#/profile">
                <FiUser className="me-2" /> Profile
              </NavDropdown.Item>
              <NavDropdown.Item href="#/settings">
                <FiSettings className="me-2" /> Settings
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="#/logout" className="text-danger">
                <FiLogOut className="me-2" /> Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;