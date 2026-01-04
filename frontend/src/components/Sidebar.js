import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight, FiGrid, FiX, FiActivity } from 'react-icons/fi';
import { SidebarData } from './SidebarData';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const [activeMenu, setActiveMenu] = useState('');
  const location = useLocation();

  const toggleSubMenu = (menuId) => {
    setActiveMenu(activeMenu === menuId ? '' : menuId);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`sidebar-container ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <Link to="/dashboard" className="sidebar-logo">
          <FiActivity className="me-2 text-primary" size={24} />
          <span>Trade Flow</span>
        </Link>
        <button
          className="d-md-none border-0 bg-transparent text-white"
          onClick={onClose}
        >
          <FiX size={24} />
        </button>
      </div>

      <div className="sidebar-menu">
        <Link
          to="/dashboard"
          className={`menu-item ${isActive('/dashboard') ? 'active' : ''}`}
        >
          <div className="menu-icon">
            <FiGrid />
          </div>
          <span className="menu-label">Dashboard</span>
        </Link>

        {SidebarData.map((item, index) => {
          const isExpanded = activeMenu === item.id;
          const hasActiveChild = item.items.some(subItem => isActive(subItem.to));

          return (
            <div key={index} className="menu-section">
              <div
                className={`menu-item ${isExpanded || hasActiveChild ? 'active' : ''}`}
                onClick={() => toggleSubMenu(item.id)}
              >
                <div className="menu-icon">{item.icon}</div>
                <span className="menu-label">{item.title}</span>
                <div className={`menu-arrow ${isExpanded ? 'expanded' : ''}`}>
                  <FiChevronRight />
                </div>
              </div>

              <div className={`submenu ${isExpanded ? 'open' : ''}`}>
                {item.items.map((subItem, subIndex) => (
                  <Link
                    key={subIndex}
                    to={subItem.to}
                    className={`submenu-item ${isActive(subItem.to) ? 'active' : ''}`}
                  >
                    {subItem.label}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;