import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import Navbar from './Navbar';
import SuperAdminSidebar from './SuperAdminSidebar';

const SuperAdminLayout = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className="superadmin-layout-container">
            <SuperAdminSidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
            <div
                className="main-content d-flex flex-column min-vh-100"
                style={{
                    marginLeft: isCollapsed ? '80px' : '260px',
                    transition: 'margin-left 0.3s ease',
                    paddingTop: '70px',
                    backgroundColor: '#0f172a' // Darker background for superadmin pages
                }}
            >
                <Navbar isCollapsed={isCollapsed} />
                <Container fluid className="flex-grow-1 p-4">
                    {children}
                </Container>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                .superadmin-layout-container {
                    background-color: #020617;
                    min-height: 100vh;
                }
            `}} />
        </div>
    );
};

export default SuperAdminLayout;
