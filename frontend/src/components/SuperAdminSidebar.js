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
    FiMail
} from 'react-icons/fi';
import { useAuth } from './auth/AuthContext';

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
            title: 'System Health',
            icon: <FiActivity size={20} />,
            active: false, // Placeholder for now
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
                        <span className="logo-text fw-bold text-danger" style={{ fontSize: '1.2rem', letterSpacing: '1px' }}>CORE CONTROL</span>
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
          color: rgba(255, 255, 255, 0.6) !important;
          transition: all 0.2s ease;
          text-decoration: none !important;
          cursor: pointer;
        }
        
        .nav-link-custom:hover {
          color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.05) !important;
        }
        
        .nav-link-custom.active {
          color: white !important;
          background: rgba(239, 68, 68, 0.15) !important;
          border-left: 3px solid #ef4444;
        }
        
        .nav-link-custom-submenu {
          color: rgba(255, 255, 255, 0.4) !important;
          font-size: 0.85rem;
          transition: all 0.2s ease;
          text-decoration: none !important;
        }
        
        .nav-link-custom-submenu:hover {
          color: #ef4444 !important;
        }
        
        .nav-link-custom-submenu.active {
          color: #ef4444 !important;
          font-weight: 600;
        }

        .text-info {
            color: #0ea5e9 !important;
        }
      `}} />
        </motion.div>
    );
};

export default SuperAdminSidebar;
