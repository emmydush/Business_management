import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className="layout-container">
            <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
            <div
                className="main-content d-flex flex-column min-vh-100"
                style={{
                    marginLeft: isCollapsed ? '80px' : '260px',
                    transition: 'margin-left 0.3s ease'
                }}
            >
                <Navbar isCollapsed={isCollapsed} />
                <Container fluid className="flex-grow-1 p-4">
                    {children}
                </Container>
            </div>
        </div>
    );
};

export default Layout;
