import React, { useState, useEffect, useRef } from 'react';
import { Navbar, Container, Dropdown, Button } from 'react-bootstrap';
import {
  FiUser,
  FiLogOut,
  FiSettings,
  FiPhone,
  FiMail,
  FiHelpCircle,
  FiSearch,
  FiMenu,
  FiBell,
  FiAlertTriangle,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { communicationAPI } from '../services/api';
import toast from 'react-hot-toast';
import moment from 'moment';


const CustomNavbar = ({ isCollapsed, toggleSidebar }) => {
  const { user, logout } = useAuth();
  
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // (subscription-related state removed; navbar is now simplified)

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      const q = searchQuery.trim();
      if (q.length > 0) {
        navigate(`/search?q=${encodeURIComponent(q)}`);
      }
    }
  };

  const handleSearchClick = () => {
    const q = searchQuery.trim();
    if (q.length > 0) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };
  // Auto route trigger for common module keywords (debounced)
  const lastAutoRef = useRef({ q: '', path: '' });
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 3) return;
    const mapping = [
      { path: '/dashboard', keys: ['dashboard', 'home'] },
      { path: '/sales-orders', keys: ['sales', 'sale', 'orders', 'sales orders'] },
      { path: '/pos', keys: ['pos', 'point of sale'] },
      { path: '/stock', keys: ['inventory', 'stock'] },
      { path: '/products', keys: ['products', 'product'] },
      { path: '/categories', keys: ['categories', 'category'] },
      { path: '/warehouses', keys: ['warehouses', 'warehouse'] },
      { path: '/customers', keys: ['customers', 'customer', 'crm'] },
      { path: '/suppliers', keys: ['suppliers', 'supplier'] },
      { path: '/invoices', keys: ['invoices', 'invoice'] },
      { path: '/payments', keys: ['payments', 'payment'] },
      { path: '/returns', keys: ['returns', 'return'] },
      { path: '/reports', keys: ['reports', 'report'] },
      { path: '/sales-reports', keys: ['sales reports', 'sales report'] },
      { path: '/finance-reports', keys: ['finance', 'finance reports'] },
      { path: '/inventory-reports', keys: ['inventory reports'] },
      { path: '/employees', keys: ['hr', 'human resources', 'employees'] },
      { path: '/purchases', keys: ['purchases', 'purchase'] },
      { path: '/leads', keys: ['leads', 'lead'] },
      { path: '/tasks', keys: ['tasks', 'task'] },
      { path: '/projects', keys: ['projects', 'project'] },
    ];
    const hit = mapping.find(m => m.keys.some(k => q === k || q.startsWith(k)));
    if (!hit) return;
    const last = lastAutoRef.current;
    if (last.q === q && last.path === hit.path) return;
    const t = setTimeout(() => {
      navigate(hit.path);
      lastAutoRef.current = { q, path: hit.path };
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, navigate]);

  const fetchNotifications = async () => {
    try {
      const response = await communicationAPI.getNotifications({ page: 1, limit: 10, unread: true });
      const notifs = response.data.notifications || [];
      const count = response.data.pagination?.total_unread || 0;
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const i = setInterval(fetchNotifications, 30000);
      return () => clearInterval(i);
    }
  }, [user]);

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation?.();
    try {
      await communicationAPI.markNotificationRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e?.stopPropagation?.();
    try {
      await communicationAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <FiCheckCircle className="text-success" />;
      case 'warning': return <FiAlertTriangle className="text-warning" />;
      case 'danger': return <FiAlertCircle className="text-danger" />;
      default: return <FiInfo className="text-primary" />;
    }
  };
  return (
    <>
    <Navbar className={`navbar-custom py-2 ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Container fluid className="px-4 d-flex align-items-center justify-content-between w-100 navbar-inner">
        {/* Mobile hamburger to open sidebar */}
        <button
          type="button"
          className="sidebar-toggle-btn border-0 bg-transparent me-2 d-lg-none"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <FiMenu size={24} />
        </button>

        {/* Brand */}
        <div className="d-none d-md-flex align-items-center me-3">
          <Link to="/dashboard" className="brand-title text-decoration-none">BusinessOS</Link>
        </div>

        {/* Left: Search Bar */}
        <div className="d-flex align-items-center flex-grow-1 justify-content-center navbar-search-section">
          <div className="search-wrapper" style={{ background: '#ffffff' }}>
            <button
              type="button"
              className="border-0 bg-transparent p-0 me-1"
              aria-label="Search"
              onClick={handleSearchClick}
            >
              <FiSearch size={18} className="text-muted" />
            </button>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="search-input"
            />
          </div>
        </div>

        {/* Right: notifications + profile */}
        <div className="d-flex align-items-center navbar-profile-section gap-2">
          {/* Quick links */}
          <div className="d-none d-md-flex align-items-center gap-2 me-2 quick-links">
            <Link to="/pos" className="btn btn-light btn-sm quick-link-btn">POS</Link>
            <Link to="/trade" className="btn btn-primary btn-sm quick-link-btn">Trade</Link>
          </div>
          <Dropdown
            align="end"
            show={showNotificationDropdown}
            onToggle={setShowNotificationDropdown}
          >
            <Dropdown.Toggle variant="link" className="p-1 no-caret icon-btn position-relative">
              <div className="icon-circle">
                <FiBell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </div>
            </Dropdown.Toggle>
            <Dropdown.Menu className="border-0 shadow-xl mt-3 dropdown-menu-custom notification-menu animate-in">
              <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center bg-light-subtle">
                <h6 className="fw-bold mb-0 text-dark">Notifications</h6>
                {unreadCount > 0 && (
                  <Button
                    variant="link"
                    className="p-0 text-primary small text-decoration-none fw-semibold"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              <div className="notification-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <Dropdown.Item
                      key={notif.id}
                      className={`px-4 py-3 border-bottom notification-item ${!notif.is_read ? 'unread' : ''}`}
                    >
                      <div className="d-flex gap-3">
                        <div className="notif-icon-wrapper">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <span className="fw-bold small text-dark">{notif.title}</span>
                            <span className="text-muted extra-small">{moment(notif.created_at).fromNow()}</span>
                          </div>
                          <p className="text-muted small mb-2 line-height-1">{notif.message}</p>
                          {!notif.is_read && (
                            <div className="d-flex justify-content-end">
                              <div
                                className="mark-read-indicator"
                                title="Mark as read"
                                onClick={(e) => handleMarkAsRead(notif.id, e)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </Dropdown.Item>
                  ))
                ) : (
                  <div className="px-4 py-5 text-center">
                    <FiBell size={40} className="text-muted mb-3 opacity-20" />
                    <p className="text-muted small mb-0">No notifications</p>
                  </div>
                )}
              </div>
              <div className="p-2 border-top text-center">
                <Button
                  as={Link}
                  to="/notifications"
                  variant="link"
                  className="text-primary small text-decoration-none fw-bold w-100"
                  onClick={() => setShowNotificationDropdown(false)}
                >
                  View all notifications
                </Button>
              </div>
            </Dropdown.Menu>
          </Dropdown>
          <Dropdown
            align="end"
            show={showProfileDropdown}
            onToggle={setShowProfileDropdown}
          >
            <Dropdown.Toggle variant="link" className="text-dark p-0 no-caret profile-btn">
              <div className="avatar-container">
                {user?.profile_picture ? (
                  <img src={`${window.location.origin}${user.profile_picture}`} alt="avatar" className="avatar-img" onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    const placeholder = e.target.parentNode.querySelector('.avatar-placeholder');
                    if (placeholder) placeholder.style.display = 'flex';
                  }} />
                ) : (
                  <div className="avatar-placeholder">
                    {(user?.first_name?.[0] || 'U').toUpperCase()}
                  </div>
                )}
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu className="border-0 shadow-xl mt-3 dropdown-menu-custom profile-menu animate-in">
              <div className="px-4 py-3 border-bottom bg-light-subtle">
                <div className="fw-bold text-dark">{user?.first_name} {user?.last_name}</div>
                <div className="text-muted small truncate-email">{user?.email}</div>
              </div>
              <div className="p-2">
                <Dropdown.Item as={Link} to="/user-profile" className="rounded-3 py-2 d-flex align-items-center">
                  <FiUser className="me-3 text-primary" /> {"My Profile"}
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/settings" className="rounded-3 py-2 d-flex align-items-center">
                  <FiSettings className="me-3 text-success" /> {"Settings"}
                </Dropdown.Item>
                <Dropdown.Divider />

                <Dropdown.Item as={Link} to="/messages" className="rounded-3 py-2 d-flex align-items-center">
                  <FiHelpCircle className="me-3 text-info" /> Support
                </Dropdown.Item>
                <div className="px-3 py-2 text-muted small">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <FiPhone size={12} /> 0795555112
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <FiMail size={12} /> Business.OS@gmail.com
                  </div>
                </div>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="rounded-3 py-2 d-flex align-items-center text-danger">
                  <FiLogOut className="me-3" /> {"Logout"}
                </Dropdown.Item>
              </div>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </Container>

      <style dangerouslySetInnerHTML={{
        __html: `
        .navbar-custom {
          background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
          z-index: 1040;
          pointer-events: auto !important;
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          border-radius: 18px;
          margin: 0 1.5rem 0.75rem 1.5rem;
          border: 1px solid rgba(99, 102, 241, 0.08);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        /* Ensure inner navbar content lays out nicely and wraps on smaller screens */
        .navbar-custom .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          row-gap: 0.5rem;
        }
        
        .navbar-custom .navbar-inner > div {
          min-width: 0;
        }

        /* make search section span full width */
        .navbar-search-section {
          flex: 1 !important;
          width: 100% !important;
          display: flex;
          justify-content: center;
        }
        .search-wrapper {
          width: 100% !important;
          max-width: none !important;
        }
        
        .navbar-custom * {
          pointer-events: auto !important;
        }
        
        .navbar-custom .btn,
        .navbar-custom button {
          pointer-events: auto !important;
          cursor: pointer !important;
          z-index: 1041 !important;
        }
        
        .navbar-custom .dropdown {
          pointer-events: auto !important;
        }
        
        .navbar-custom .dropdown-menu {
          pointer-events: auto !important;
          z-index: 1050 !important;
        }

        /* Alternative gradient options - uncomment to use */
        /* Option 1: Blue to Purple */
        /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
        
        /* Option 2: Indigo to Pink */
        /* background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); */
        
        /* Option 3: Teal to Blue */
        /* background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); */
        
        /* Option 4: Green to Emerald */
        /* background: linear-gradient(135deg, #10b981 0%, #059669 100%); */

        @media (max-width: 991.98px) {
          .navbar-custom {
            margin: 0 1rem 0.75rem 1rem;
          }

          .navbar-custom .navbar-inner {
            justify-content: space-between;
          }
        }

        /* Smartphone layout: keep navbar items on a single row
           with proper shrinking / truncation instead of stacking awkwardly */
        @media (max-width: 767.98px) {
          .navbar-custom .navbar-inner {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            flex-wrap: nowrap;
            column-gap: 0.5rem;
          }

          .navbar-custom .navbar-inner > div:first-child {
            order: 1;
            flex: 1 1 auto;
            min-width: 0;
          }

          .navbar-custom .navbar-inner > div:last-child {
            order: 2;
            flex: 0 0 auto;
            justify-content: flex-end;
          }
        }

        .page-title {
          letter-spacing: -0.5px;
          color: #333333;
          text-shadow: none;
        }

        /* Apply dark text to top-level navbar elements */
        .navbar-custom > .container-fluid .text-dark,
        .navbar-custom > .container-fluid .btn-link,
        .navbar-custom > .container-fluid .nav-link {
          color: #333333 !important;
        }

        .navbar-custom .text-muted {
          color: rgba(51, 51, 51, 0.7) !important;
        }

        .search-wrapper {
          flex: 1;
          max-width: 800px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #ffffff;
          border: 1px solid #888888;
          border-radius: 9999px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          transition: all 0.2s ease;
          margin: 0 auto;
        }
        
        .search-wrapper input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          color: #333333 !important;
        }

        .search-wrapper input::placeholder {
          color: rgba(51, 51, 51, 0.5) !important;
        }

        .brand-title {
          font-weight: 800;
          font-size: 1.05rem;
          letter-spacing: 0.3px;
          color: #0f172a;
        }

        .quick-link-btn {
          border-radius: 9999px;
          padding: 0.25rem 0.75rem;
          font-weight: 600;
        }

        .search-wrapper svg {
          color: rgba(156, 163, 175, 1) !important;
        }
        
        .search-wrapper:focus-within {
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
          border-color: rgba(102, 126, 234, 0.3);
        }

        .navbar-profile-section {
          flex-shrink: 0;
          position: relative;
        }
        .notification-dot {
          width: 10px;
          height: 10px;
          background: #3182ce;
          border-radius: 50%;
        }
        .avatar-container {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 2px solid #3182ce;
        }
        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          color: #333333;
        }
        .search-input::placeholder {
          color: #888888;
        }

        .install-btn {
          transition: all 0.3s ease;
        }

        .install-btn:hover {
          background: rgba(102, 126, 234, 0.2) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .install-btn:active {
          transform: scale(0.95);
        }

        .icon-btn {
          transition: transform 0.2s ease;
        }

        .icon-btn:active {
          transform: scale(0.9);
        }

        .icon-circle {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333333;
          transition: all 0.2s ease;
        }

        .icon-btn:hover .icon-circle {
          background: rgba(255, 255, 255, 1);
          border-color: rgba(102, 126, 234, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-radius: 10px;
          border: 2px solid rgba(255, 255, 255, 0.9);
          color: white;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
        }

        .avatar-container {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          color: #fff;
          font-weight: 700;
          font-size: 16px;
        }

        .profile-btn {
          text-decoration: none !important;
          padding: 4px 8px !important;
          border-radius: 14px;
          transition: all 0.2s ease;
        }

        .profile-btn:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .user-info-wrapper span {
          color: #333333 !important;
        }

        .user-info-wrapper .text-muted {
          color: rgba(51, 51, 51, 0.7) !important;
        }

        .dropdown-menu-custom {
          border-radius: 20px;
          padding: 0;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          min-width: 280px;
          border: 1px solid rgba(102, 126, 234, 0.1);
        }

        .notification-menu {
          width: 360px;
        }

        .notification-item {
          transition: all 0.2s ease;
          background: transparent;
        }

        .notification-item.unread {
          background: rgba(102, 126, 234, 0.05);
          border-left: 3px solid #667eea;
        }

        .notification-item:hover {
          background: #f8fafc;
          transform: translateX(2px);
        }

        .notif-icon-wrapper {
          width: 36px;
          height: 36px;
          background: #fff;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          flex-shrink: 0;
        }

        .mark-read-indicator {
          width: 8px;
          height: 8px;
          background: #667eea;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .mark-read-indicator:hover {
          transform: scale(1.3);
          background: #764ba2;
        }

        .line-height-1 { line-height: 1.2; }
        .extra-small { font-size: 10px; }
        .text-muted-light { color: #94a3b8; }
        .truncate-email { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

        .animate-in {
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .rotate-180 { transform: rotate(180deg); }
        .transition-all { transition: all 0.3s ease; }
        .no-caret::after { display: none !important; }

        .notification-list::-webkit-scrollbar { width: 5px; }
        .notification-list::-webkit-scrollbar-thumb { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          border-radius: 10px; 
        }
        .notification-list::-webkit-scrollbar-track { 
          background: #f1f5f9; 
        }

        /* Enhance dropdown menu headers */
        .dropdown-menu-custom .border-bottom {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
        }

        /* Add subtle animation to navbar */
        @keyframes navbarGlow {
          0%, 100% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15); }
          50% { box-shadow: 0 4px 25px rgba(118, 75, 162, 0.2); }
        }

        .navbar-custom {
          animation: navbarGlow 3s ease-in-out infinite;
        }

        /* Remove conflicting text color overrides */

        .navbar-custom .btn-link:hover {
          color: rgba(102, 126, 234, 0.8) !important;
        }

        /* Style the FiMenu icon for mobile */
        .navbar-custom svg {
          color: #333333;
        }

        /* sidebar hamburger button styles */
        .sidebar-toggle-btn {
          color: #333333;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sidebar-toggle-btn:hover {
          color: #4f46e5;
        }

        @media (min-width: 992px) {
          .sidebar-toggle-btn {
            display: none !important;
          }
        }
        
        /* Reset colors inside dropdowns to be dark and readable */
        .navbar-custom .dropdown-menu {
          color: #1e293b !important;
          text-align: left;
          background-color: #ffffff !important;
        }

        .navbar-custom .dropdown-menu .text-dark,
        .navbar-custom .dropdown-menu .fw-bold,
        .navbar-custom .dropdown-menu .fw-semibold,
        .navbar-custom .dropdown-menu h6 {
          color: #1e293b !important;
          text-shadow: none !important;
        }

        .navbar-custom .dropdown-menu .text-muted,
        .navbar-custom .dropdown-menu .small,
        .navbar-custom .dropdown-menu .extra-small {
          color: #64748b !important;
        }

        .navbar-custom .dropdown-item {
          color: #1e293b !important;
        }

        .navbar-custom .dropdown-item:hover {
          color: #1e293b !important;
          background-color: #f8fafc !important;
        }

        /* Reset icon colors inside dropdowns */
        .navbar-custom .dropdown-menu svg {
          color: #64748b !important;
        }
        
        .navbar-custom .dropdown-menu .text-primary svg { color: #2563eb !important; }
        .navbar-custom .dropdown-menu .text-success svg { color: #10b981 !important; }
        .navbar-custom .dropdown-menu .text-warning svg { color: #f59e0b !important; }
        .navbar-custom .dropdown-menu .text-danger svg { color: #ef4444 !important; }

        /* Enhance the profile dropdown chevron */
        .profile-btn svg {
          color: rgba(51, 51, 51, 0.6) !important;
        }
      `}} />
    </Navbar>


    </>
  );
};

export default CustomNavbar;
