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

            {/* Mobile Sidebar Overlay */}
            {!isCollapsed && (
                <div
                    className="sidebar-overlay d-lg-none"
                    onClick={toggleSidebar}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 1150,
                        backdropFilter: 'blur(2px)'
                    }}
                />
            )}

            <div
                className="main-content d-flex flex-column min-vh-100"
                style={{
                    marginLeft: isCollapsed ? '80px' : '260px',
                    transition: 'margin-left 0.3s ease',
                    paddingTop: '70px'
                }}
            >
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media (max-width: 991.98px) {
                        .main-content {
                            margin-left: 0 !important;
                        }
                    }
                `}} />
                <Navbar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
                <Container fluid className="flex-grow-1 p-4">
                    {children}
                </Container>
            </div>
        </div>
    );
};

export default Layout;
