import React, { useState, useEffect, useRef } from 'react';
import { Navbar, Container, Dropdown, Button, Offcanvas } from 'react-bootstrap';
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
import { useTheme } from '../context/ThemeContext';
import { communicationAPI } from '../services/api';
import { FiSun, FiMoon } from 'react-icons/fi';
import toast from 'react-hot-toast';
import moment from 'moment';
import Logo from './Logo';


const CustomNavbar = ({ isCollapsed, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [expandedNotif, setExpandedNotif] = useState(null);
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
    const icon = {
      success: <FiCheckCircle />,
      warning: <FiAlertTriangle />,
      danger: <FiAlertCircle />,
      info: <FiInfo />,
    }[type] || <FiInfo />;
    
    return <div className={`notif-icon-v2 type-${type || 'info'}`}>{icon}</div>;
  };
  return (
    <>
    <Navbar className={`navbar-custom py-2 ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Container fluid className="px-4 d-flex align-items-center justify-content-between w-100 navbar-inner">
        {/* Mobile hamburger to open sidebar */}
        <button
          type="button"
          className="sidebar-toggle-btn border-0 bg-transparent me-1 d-lg-none"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <FiMenu size={22} className="text-dark" />
        </button>

        {/* Brand/Logo for mobile */}
        <div className="d-flex align-items-center me-2 d-lg-none brand-mobile">
          <Logo size="small" variant="full" />
        </div>

        {/* Search Bar Section */}
        <div className="navbar-search-section">
          <div className="search-pill">
            <FiSearch 
              size={16} 
              className="search-pill-icon" 
              onClick={handleSearchClick}
              style={{ cursor: 'pointer' }}
            />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="search-pill-input"
            />
          </div>
        </div>

        {/* Right: notifications + profile */}
        <div className="d-flex align-items-center navbar-profile-section gap-2">
          {/* Notification Bell (Unified for all screens) */}
          <button 
            className="p-1 border-0 bg-transparent position-relative icon-btn d-none d-md-block"
            onClick={() => setShowNotificationDrawer(true)}
          >
            <div className="icon-circle">
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </div>
          </button>
          
          <Offcanvas 
            show={showNotificationDrawer} 
            onHide={() => {
              setShowNotificationDrawer(false);
              setExpandedNotif(null);
            }} 
            placement="end"
            className="notification-offcanvas"
          >
            <Offcanvas.Header closeButton className="border-bottom px-4">
              <Offcanvas.Title className="fw-bold fs-5">Notification Center</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="p-0 d-flex flex-column h-100">
              <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center bg-white sticky-top">
                <span className="fw-semibold text-muted small">{unreadCount} Unread Notifications</span>
                {unreadCount > 0 && (
                  <Button
                    variant="link"
                    className="p-0 text-primary small text-decoration-none fw-bold"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all read
                  </Button>
                )}
              </div>
              
              <div className="flex-grow-1 overflow-auto bg-light-subtle">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`notif-card-modern ${!notif.is_read ? 'unread' : ''} ${expandedNotif === notif.id ? 'expanded' : ''}`}
                      onClick={() => {
                        setExpandedNotif(expandedNotif === notif.id ? null : notif.id);
                        if (!notif.is_read) handleMarkAsRead(notif.id);
                      }}
                    >
                      <div className="d-flex align-items-start gap-3">
                        {getNotificationIcon(notif.type)}
                        <div className="flex-grow-1 min-width-0">
                          <div className="d-flex justify-content-between align-items-start">
                            <h6 className="notif-card-title mb-1">{notif.title}</h6>
                            <span className="notif-card-time">{moment(notif.created_at).fromNow()}</span>
                          </div>
                          <p className="notif-card-msg mb-0">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                      {!notif.is_read && <div className="unread-dot-indicator" />}
                    </div>
                  ))
                ) : (
                  <div className="vh-100 d-flex flex-column align-items-center justify-content-center px-4 text-center opacity-50">
                    <FiBell size={60} className="mb-3" />
                    <h5 className="fw-bold mb-1">Stay Up to Date</h5>
                    <p className="small">Your latest activity and system alerts will appear here.</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-top bg-white">
                <Button
                  as={Link}
                  to="/notifications"
                  variant="dark"
                  className="btn-black w-100 py-3 rounded-4 fw-bold shadow-sm"
                  onClick={() => setShowNotificationDrawer(false)}
                >
                  View Activity History
                </Button>
              </div>
            </Offcanvas.Body>
          </Offcanvas>
          <Dropdown
            align="end"
            show={showProfileDropdown}
            onToggle={setShowProfileDropdown}
          >
            <Dropdown.Toggle variant="link" className="text-dark p-0 no-caret profile-btn position-relative">
              <div className="avatar-container">
                {user?.profile_picture ? (
                  <>
                    <img 
                      src={`${window.location.origin}${user.profile_picture}`} 
                      alt="avatar" 
                      className="avatar-img" 
                      onLoad={(e) => {
                        e.target.style.display = 'block';
                        const placeholder = e.target.parentNode.querySelector('.avatar-placeholder');
                        if (placeholder) placeholder.style.display = 'none';
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        const placeholder = e.target.parentNode.querySelector('.avatar-placeholder');
                        if (placeholder) placeholder.style.display = 'flex';
                      }} 
                    />
                    <div className="avatar-placeholder" style={{ display: 'none' }}>
                      {(user?.username?.[0] || user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                    </div>
                  </>
                ) : (
                  <div className="avatar-placeholder">
                    {(user?.username?.[0] || user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                {unreadCount > 0 && <span className="mobile-notif-dot d-md-none"></span>}
              </div>
              {/* Fallback: Always show profile indicator */}
              {!user && (
                <div className="avatar-placeholder" style={{ position: 'absolute', top: 0, left: 0 }}>
                  U
                </div>
              )}
            </Dropdown.Toggle>

            <Dropdown.Menu className="border-0 shadow-xl mt-3 dropdown-menu-custom profile-menu animate-in">
              <div className="px-4 py-3 border-bottom bg-light-subtle">
                <div className="fw-bold text-dark">{user?.first_name || 'User'} {user?.last_name || ''}</div>
                <div className="text-muted small truncate-email">{user?.email || 'user@example.com'}</div>
              </div>
              <div className="p-2">
                <Dropdown.Item as={Link} to="/user-profile" className="rounded-3 py-2 d-flex align-items-center">
                  <FiUser className="me-3 text-primary" /> {"My Profile"}
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/settings" className="rounded-3 py-2 d-flex align-items-center">
                  <FiSettings className="me-3 text-success" /> {"Settings"}
                </Dropdown.Item>
                <Dropdown.Item onClick={toggleTheme} className="rounded-3 py-2 d-flex align-items-center">
                  {theme === 'light' ? (
                    <>
                      <FiMoon className="me-3 text-dark" /> {"Dark Mode"}
                    </>
                  ) : (
                    <>
                      <FiSun className="me-3 text-warning" /> {"Light Mode"}
                    </>
                  )}
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
                    <FiMail size={12} /> info@afribuz.com
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
          background: #ffffff !important;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 1040;
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          padding: 0.5rem 1rem;
          height: 64px;
          display: flex;
          align-items: center;
        }

        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 0.75rem;
        }

        /* Smartphone layout specifically matching the reference */
        @media (max-width: 767.98px) {
          .navbar-custom {
            padding: 0 0.75rem !important;
            height: 60px !important;
          }
          
          .brand-mobile {
            display: flex !important;
            align-items: center;
            gap: 4px;
          }
          
          .brand-text-mobile {
            font-family: 'Outfit', sans-serif;
            color: #0f172a;
            font-size: 0.95rem !important;
            letter-spacing: -0.2px;
          }

          .navbar-search-section {
            flex: 1;
            display: flex;
            justify-content: center;
            min-width: 0;
          }

          .search-pill {
            background: #f8fafc;
            border: 1px solid #f1f5f9;
            border-radius: 100px;
            padding: 6px 12px;
            display: flex;
            align-items: center;
            width: 100%;
            max-width: 200px;
            box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
            transition: all 0.2s ease;
          }

          .search-pill:focus-within {
            background: #ffffff;
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          }

          .search-pill-icon {
            color: #94a3b8;
            margin-right: 8px;
            flex-shrink: 0;
          }

          .search-pill-input {
            border: none;
            background: transparent;
            outline: none;
            font-size: 0.85rem;
            color: #1e293b;
            width: 100%;
          }

          .search-pill-input::placeholder {
            color: #94a3b8;
          }

          .navbar-profile-section {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-shrink: 0;
          }

          .avatar-container {
            width: 32px !important;
            height: 32px !important;
            border-radius: 50% !important;
            border: 1.5px solid #f1f5f9;
            position: relative;
          }

          .mobile-notif-dot {
            position: absolute;
            top: -1px;
            right: -1px;
            width: 9px;
            height: 9px;
            background: #3b82f6; /* Blue status dot as in image */
            border: 1.5px solid #ffffff;
            border-radius: 50%;
            z-index: 2;
          }
        }

        .page-title {
          letter-spacing: -0.5px;
          color: var(--text-main);
          text-shadow: none;
        }

        /* Apply dark text to top-level navbar elements */
        .navbar-custom > .container-fluid .text-dark,
        .navbar-custom > .container-fluid .btn-link,
        .navbar-custom > .container-fluid .nav-link {
          color: var(--text-main) !important;
        }

        .navbar-custom .text-muted {
          color: var(--text-muted) !important;
        }

        .search-wrapper {
          flex: 1;
          max-width: 800px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--input-bg);
          border: 1px solid var(--border-color);
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
          color: var(--input-text) !important;
        }

        .search-wrapper input::placeholder {
          color: var(--text-muted) !important;
        }

        .brand-title {
          font-weight: 800;
          font-size: 1.05rem;
          letter-spacing: 0.3px;
          color: var(--text-main);
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
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: none;
          border: none;
        }
        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          color: var(--input-text);
        }
        .search-input::placeholder {
          color: var(--text-muted);
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
          background: transparent;
          border: none;
          border-radius: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-main);
          transition: all 0.2s ease;
        }

        .icon-btn:hover .icon-circle {
          background: transparent;
          border: none;
          transform: translateY(-2px);
          box-shadow: none;
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
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: none;
          border: none;
        }
        .mobile-notif-dot {
          position: absolute;
          right: -2px;
          top: -2px;
          width: 10px;
          height: 10px;
          background: #12b8ff;
          border-radius: 50%;
          border: 2px solid #ffffff;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          font-weight: 700;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-transform: uppercase;
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
          color: var(--text-main) !important;
        }

        .user-info-wrapper .text-muted {
          color: var(--text-muted) !important;
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
          width: 400px;
          border-radius: 24px !important;
          padding: 0;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
        }

        .notification-item-v2 {
          transition: all 0.2s ease;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04) !important;
          padding: 1rem !important;
        }

        .notification-item-v2:last-child {
          border-bottom: none !important;
        }

        .notification-item-v2:hover {
          background: rgba(99, 102, 241, 0.04) !important;
          transform: none;
        }

        .notification-item-v2.unread {
          background: rgba(99, 102, 241, 0.02);
        }

        .notif-icon-v2 {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .notif-icon-v2.type-success { background: #ecfdf5; color: #10b981; }
        .notif-icon-v2.type-warning { background: #fffbeb; color: #f59e0b; }
        .notif-icon-v2.type-danger { background: #fef2f2; color: #ef4444; }
        .notif-icon-v2.type-info { background: #eff6ff; color: #3b82f6; }

        .notif-title {
          font-weight: 700;
          font-size: 14px;
          display: block;
        }

        .notif-time {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }

        .notif-message {
          font-size: 13px;
          color: #64748b;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .unread-dot-v2 {
          width: 10px;
          height: 10px;
          background: #3b82f6;
          border-radius: 50%;
          flex-shrink: 0;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .unread-dot-v2:hover {
          transform: scale(1.3);
          background: #2563eb;
        }

        .notification-offcanvas {
          background: var(--card-bg) !important;
          color: var(--text-main) !important;
          border-left: 1px solid var(--border-color) !important;
        }

        .notification-offcanvas .offcanvas-header {
          background: var(--card-bg) !important;
          color: var(--text-main) !important;
        }

        .notification-offcanvas .offcanvas-body {
          background: var(--card-bg) !important;
        }
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
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.18);
        }

        .dropdown-menu-custom .border-top {
          background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(226, 232, 240, 0.8) 100%);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255, 255, 255, 0.18);
        }

        /* Add subtle animation to navbar */
        @keyframes navbarGlow {
          0%, 100% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15); }
          50% { box-shadow: 0 4px 25px rgba(118, 75, 162, 0.2); }
        }

        .navbar-custom {
          background: #ffffff !important;
          z-index: 1040;
          position: fixed !important;
          top: 0 !important;
          left: 0;
          right: 0;
          width: 100%;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          padding: 0.5rem 1rem;
          height: 64px;
          display: flex;
          align-items: center;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 0.75rem;
        }

        .navbar-search-section {
          flex: 1;
          display: flex;
          justify-content: flex-end;
          min-width: 0;
          margin: 0 1.5rem;
        }

        .search-pill {
          background: #f8fafc;
          border: 1px solid #eef2f7;
          border-radius: 100px;
          padding: 8px 20px;
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 900px;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .search-pill:focus-within {
          background: #ffffff;
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
          max-width: 950px;
        }

        .search-pill-icon {
          color: #94a3b8;
          margin-right: 10px;
          flex-shrink: 0;
          cursor: pointer;
        }

        .search-pill-input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.95rem;
          color: #1e293b;
          width: 100%;
          font-weight: 500;
        }

        .search-pill-input::placeholder {
          color: #94a3b8;
        }

        .navbar-profile-section {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-shrink: 0;
        }

        .avatar-container {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1.5px solid #f1f5f9;
          position: relative;
          background: #f8fafc;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .avatar-container:active {
          transform: scale(0.92);
        }

        .mobile-notif-dot {
          position: absolute;
          top: -1px;
          right: -1px;
          width: 10px;
          height: 10px;
          background: #3b82f6;
          border: 2px solid #ffffff;
          border-radius: 50%;
          z-index: 5;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
        }

        @media (max-width: 991.98px) {
          .navbar-custom {
            padding: 0 1rem !important;
            height: 60px !important;
          }
          
          .navbar-search-section {
            margin: 0 0.75rem;
            justify-content: center;
          }

          .search-pill {
            max-width: 300px;
            padding: 6px 14px;
          }

          .avatar-container {
            width: 34px;
            height: 34px;
          }

          .brand-mobile {
            display: flex !important;
            align-items: center;
          }
        }

        @media (max-width: 575.98px) {
          .search-pill {
            max-width: 180px;
          }
        }

        /* Profile Dropdown Styles */
        .dropdown-menu-custom {
          border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          padding: 0.5rem;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .sidebar-toggle-btn:active {
          opacity: 0.7;
        }
      `}} />
    </Navbar>


    </>
  );
};

export default CustomNavbar;
