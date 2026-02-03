import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiHome,
    FiUsers,
    FiActivity,
    FiShield,
    FiDatabase,
    FiCpu,
    FiHardDrive,
    FiSettings,
    FiLogOut,
    FiChevronDown,
    FiMenu,
    FiX,
    FiArrowLeft,
    FiFileText,
    FiRefreshCw,
    FiLock,
    FiMail,
    FiDollarSign
} from 'react-icons/fi';
import { useAuth } from './auth/AuthContext';
import toast from 'react-hot-toast';
import { Button } from 'react-bootstrap';

const SuperAdminSidebar = ({ isCollapsed, toggleSidebar }) => {
    const location = useLocation();
    const { user } = useAuth();
    const [openSubmenu, setOpenSubmenu] = useState(null);
    const [hoveredItem, setHoveredItem] = useState(null);

    const isActive = (path) => location.pathname === path;

    const navItems = [
        {
            title: 'System Overview',
            path: '/superadmin',
            icon: <FiCpu size={20} />,
            active: isActive('/superadmin')
        },
        {
            title: 'User Management',
            path: '/superadmin/users',
            icon: <FiUsers size={20} />,
            active: isActive('/superadmin/users')
        },
        {
            title: 'Business Management',
            path: '/superadmin/businesses',
            icon: <FiShield size={20} />,
            active: isActive('/superadmin/businesses')
        },
        {
            title: 'Subscription Management',
            path: '/superadmin/subscriptions',
            icon: <FiDollarSign size={20} />,
            active: isActive('/superadmin/subscriptions')
        },
        {
            title: 'System Health',
            icon: <FiActivity size={20} />,
            active: false,
            submenu: [
                { title: 'Server Metrics', path: '/superadmin/metrics', active: false },
                { title: 'Service Status', path: '/superadmin/services', active: false },
                { title: 'Error Logs', path: '/superadmin/logs', active: false }
            ]
        },
        {
            title: 'Database Control',
            icon: <FiDatabase size={20} />,
            active: false,
            submenu: [
                { title: 'Tables & Schema', path: '/superadmin/db/schema', active: false },
                { title: 'Backups', path: '/backup', active: isActive('/backup') },
                { title: 'Query Console', path: '/superadmin/db/query', active: false }
            ]
        },
        {
            title: 'Security & Access',
            icon: <FiLock size={20} />,
            active: isActive('/audit-logs') || isActive('/permissions'),
            submenu: [
                { title: 'Audit Logs', path: '/audit-logs', active: isActive('/audit-logs') },
                { title: 'Permissions', path: '/permissions', active: isActive('/permissions') },
                { title: 'API Keys', path: '/superadmin/security/keys', active: false }
            ]
        },
        {
            title: 'Global Settings',
            icon: <FiSettings size={20} />,
            active: isActive('/system-settings') || isActive('/superadmin/email-config'),
            submenu: [
                { title: 'System Settings', path: '/system-settings', active: isActive('/system-settings') },
                { title: 'Email Configuration', path: '/superadmin/email-config', active: isActive('/superadmin/email-config') }
            ]
        },

    ];

    const handleLogout = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        toast((t) => (
            <div className="d-flex flex-column gap-3 p-1">
                <div className="d-flex align-items-center gap-2">
                    <FiLogOut className="text-danger" size={20} />
                    <span className="fw-bold" style={{ fontSize: '1.1rem' }}>Exit Super Control?</span>
                </div>
                <p className="mb-0 text-white-50 small">Are you sure you want to log out of the system administration?</p>
                <div className="d-flex gap-2 justify-content-end mt-1">
                    <Button
                        size="sm"
                        variant="outline-light"
                        className="border-0"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        variant="danger"
                        className="px-3 shadow-sm"
                        onClick={() => {
                            toast.dismiss(t.id);
                            window.location.href = '/logout';
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </div>
        ), {
            duration: 8000,
            style: {
                minWidth: '350px',
                background: '#020617',
                border: '1px solid rgba(239,68,68,0.2)'
            }
        });
    };

    const handleSubmenuToggle = (title) => {
        if (isCollapsed) {
            toggleSidebar();
            setOpenSubmenu(title);
        } else {
            setOpenSubmenu(openSubmenu === title ? null : title);
        }
    };

    const handleMouseEnter = (item) => {
        if (item.submenu) {
            setHoveredItem(item.title);
            setOpenSubmenu(item.title);
        }
    };

    const handleMouseLeave = (item) => {
        if (item.submenu && !item.active) {
            setHoveredItem(null);
            setTimeout(() => {
                if (hoveredItem === item.title) {
                    setOpenSubmenu(null);
                }
            }, 200);
        }
    };

    return (
        <motion.div
            className="superadmin-sidebar-wrapper"
            initial={false}
            animate={{ width: isCollapsed ? 80 : 260 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
        >
            <div className={`sidebar-header d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'justify-content-between'} p-3`}>
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="logo-container d-flex align-items-center flex-grow-1"
                    >
                        <span className="logo-text fw-bold text-danger" style={{ fontSize: '1.25rem', letterSpacing: '1.2px', textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>CORE CONTROL</span>
                    </motion.div>
                )}
                {!isCollapsed && (
                    <button className="toggle-btn border-0 bg-transparent text-white" onClick={toggleSidebar}>
                        <FiX size={20} />
                    </button>
                )}
                {isCollapsed && (
                    <button className="toggle-btn border-0 bg-transparent text-white mt-2" onClick={toggleSidebar}>
                        <FiMenu size={20} />
                    </button>
                )}
            </div>

            <div className="sidebar-nav-container px-2 py-3">
                <div className="px-3 mb-2 small text-uppercase text-muted fw-bold">
                    {!isCollapsed ? 'System Administration' : 'SYS'}
                </div>
                {navItems.map((item, index) => (
                    <div
                        key={index}
                        className={`nav-item-wrapper mb-1 ${item.className || ''}`}
                        onMouseEnter={() => handleMouseEnter(item)}
                        onMouseLeave={() => handleMouseLeave(item)}
                    >
                        {item.submenu ? (
                            <>
                                <motion.div
                                    className={`nav-link-custom d-flex align-items-center py-2 px-3 rounded ${item.active ? 'active' : ''}`}
                                    onClick={() => handleSubmenuToggle(item.title)}
                                    whileHover={{ x: 4 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <span className="icon-wrapper">{item.icon}</span>
                                    {!isCollapsed && (
                                        <motion.div
                                            className="d-flex align-items-center flex-grow-1 ms-3"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <span className="flex-grow-1 text-nowrap">{item.title}</span>
                                            <motion.span
                                                animate={{ rotate: (openSubmenu === item.title || item.active) ? 180 : 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="d-flex"
                                            >
                                                <FiChevronDown size={16} />
                                            </motion.span>
                                        </motion.div>
                                    )}
                                </motion.div>

                                <AnimatePresence>
                                    {(openSubmenu === item.title || (item.active && openSubmenu === null)) && !isCollapsed && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="submenu-container overflow-hidden"
                                        >
                                            {item.submenu.map((subItem, subIndex) => (
                                                <motion.div
                                                    key={subIndex}
                                                    initial={{ x: -10, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: subIndex * 0.05 }}
                                                >
                                                    <Link
                                                        to={subItem.path}
                                                        className={`nav-link-custom-submenu d-flex align-items-center py-2 px-4 ms-4 rounded ${subItem.active ? 'active' : ''}`}
                                                    >
                                                        <span className="text-nowrap">{subItem.title}</span>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        ) : (
                            <Link
                                to={item.path}
                                className={`nav-link-custom d-flex align-items-center py-2 px-3 rounded ${item.active ? 'active' : ''}`}
                            >
                                <span className="icon-wrapper">{item.icon}</span>
                                {!isCollapsed && (
                                    <motion.span
                                        className="ms-3 text-nowrap"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        {item.title}
                                    </motion.span>
                                )}
                            </Link>
                        )}
                    </div>
                ))}
            </div>

            <div className="sidebar-footer p-3 mt-auto">
                <div className={`user-profile d-flex align-items-center ${isCollapsed ? 'justify-content-center' : ''}`}>
                    <div className="avatar-wrapper bg-danger bg-opacity-25 text-danger">
                        <FiShield size={20} />
                    </div>
                    {!isCollapsed && (
                        <motion.div
                            className="ms-3 flex-grow-1 overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="fw-bold small text-nowrap text-danger">SUPERADMIN</div>
                            <div className="text-white-50 small text-nowrap" style={{ fontSize: '10px' }}>{user?.username || 'Root'}</div>
                        </motion.div>
                    )}
                    {!isCollapsed && (
                        <button
                            className="logout-btn border-0 bg-transparent text-white-50 p-0 ms-2"
                            onClick={handleLogout}
                            title="Logout"
                        >
                            <FiLogOut size={18} />
                        </button>
                    )}
                    {isCollapsed && (
                        <button
                            className="logout-btn border-0 bg-transparent text-white-50 p-0 mt-2"
                            onClick={handleLogout}
                            title="Logout"
                        >
                            <FiLogOut size={18} />
                        </button>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .superadmin-sidebar-wrapper {
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1100;
          background: #020617; /* Deeper dark for control panel */
          color: white;
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          border-right: 1px solid rgba(239, 68, 68, 0.1);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .sidebar-header {
          height: 72px;
          min-height: 72px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .logo-icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          flex-shrink: 0;
        }
        
        .logo-text {
          font-size: 1.1rem;
          letter-spacing: 1px;
          white-space: nowrap;
        }
        
        .sidebar-nav-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        .nav-link-custom {
          color: rgba(255, 255, 255, 0.85) !important;
          transition: all 0.2s ease;
          text-decoration: none !important;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.95rem;
          letter-spacing: 0.3px;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }
        
        .nav-link-custom:hover {
          color: #ffffff !important;
          background: rgba(239, 68, 68, 0.15) !important;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
        }
        
        .nav-link-custom.active {
          color: white !important;
          background: rgba(239, 68, 68, 0.25) !important;
          border-left: 3px solid #ef4444;
          font-weight: 600;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
        }
        
        .nav-link-custom-submenu {
          color: rgba(255, 255, 255, 0.7) !important;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          text-decoration: none !important;
          font-weight: 400;
          letter-spacing: 0.2px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
        }
        
        .nav-link-custom-submenu:hover {
          color: #ffffff !important;
          background: rgba(239, 68, 68, 0.1) !important;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
        }
        
        .nav-link-custom-submenu.active {
          color: #f87171 !important;
          font-weight: 600;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
        }

        .text-info {
            color: #0ea5e9 !important;
        }

        .logout-btn {
          opacity: 0.5;
          transition: all 0.2s;
          cursor: pointer;
        }
        
        .logout-btn:hover {
          opacity: 1;
          color: #ef4444 !important;
        }

        .avatar-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
      `}} />
        </motion.div>
    );
};

export default SuperAdminSidebar;
