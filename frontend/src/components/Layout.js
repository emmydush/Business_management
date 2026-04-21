import React, { useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 992);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    // Auto-collapse sidebar on window resize
    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 992 && !isCollapsed) {
                setIsCollapsed(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isCollapsed]);

    // Disable all subscription checks - all users have unlimited access
    const showLoadingSpinner = false;

    if (showLoadingSpinner) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-dark">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

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
                    paddingTop: '56px'
                }}
            >
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media (max-width: 991.98px) {
                        .main-content {
                            margin-left: 0 !important;
                            padding-top: 56px !important;
                        }
                        
                        .main-content .container-fluid {
                            padding: 0.75rem !important;
                        }
                    }
                    
                    @media (max-width: 576px) {
                        .main-content {
                            padding-top: 56px !important;
                        }
                        
                        .main-content .container-fluid {
                            padding: 0.5rem !important;
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
