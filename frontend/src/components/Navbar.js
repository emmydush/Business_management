import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, Nav, Container, Dropdown, Button, Badge } from 'react-bootstrap';
import {
  FiBell,
  FiUser,
  FiLogOut,
  FiSettings,
  FiSearch,
  FiCheck,
  FiInfo,
  FiAlertCircle,
  FiCheckCircle,
  FiAlertTriangle,
  FiMenu,
  FiChevronDown,
  FiDownload
} from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { communicationAPI, getImageUrl } from '../services/api';
import toast from 'react-hot-toast';
import { useI18n } from '../i18n/I18nProvider';
import moment from 'moment';
import BranchSwitcher from './BranchSwitcher';
import rwandaGlobe from '../assets/images/rwanda_globe_icon.png';
import ukGlobe from '../assets/images/uk_globe_icon.png';
import franceGlobe from '../assets/images/france_globe_icon.png';

const CustomNavbar = ({ isCollapsed, toggleSidebar }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    if (!path) return t('sidebar_dashboard');

    // Map path to translation key
    const titleMap = {
      'dashboard': 'sidebar_dashboard',
      'users': 'sidebar_user_management',
      'customers': 'sidebar_customers',
      'suppliers': 'sidebar_suppliers',
      'leads': 'sidebar_leads',
      'inventory': 'sidebar_inventory',
      'products': 'sidebar_products',
      'sales': 'sidebar_sales',
      'pos': 'sidebar_pos',
      'reports': 'sidebar_reports',
      'settings': 'sidebar_settings',
      'hr': 'sidebar_hr',
      'employees': 'sidebar_employees',
      'payroll': 'sidebar_payroll',
      'expenses': 'sidebar_expenses',
      'purchases': 'sidebar_purchases',
      'projects': 'sidebar_projects',
      'tasks': 'sidebar_tasks',
      'documents': 'sidebar_documents',
      'assets': 'sidebar_assets',
      'superadmin': 'sidebar_superadmin'
    };

    const key = titleMap[path];
    if (key) return t(key);

    return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await communicationAPI.getNotifications({
        page: 1,
        limit: 10,
        unread: true
      });
      const notifs = response.data.notifications || [];
      setNotifications(notifs);
      setUnreadCount(response.data.pagination?.total_unread || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to notify the user they can add to home screen
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      // Log install to analytics
      console.log('INSTALL: Success');
      setShowInstallButton(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // Optionally, send analytics event with outcome of user choice
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await communicationAPI.markNotificationRead(id);
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await communicationAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success(t('all_notifications_read'));
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error(t('failed_mark_read'));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
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
    <Navbar fixed="top" className="navbar-custom py-2" style={{
      left: `calc(${isCollapsed ? '80px' : '260px'} + 20px)`,
      width: `calc(100% - ${isCollapsed ? '80px' : '260px'} - 40px)`,
      top: '15px',
      borderRadius: '20px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <Container fluid className="px-4">
        <div className="d-flex align-items-center">
          <Button
            variant="link"
            className="text-dark p-0 me-3 d-lg-none"
            onClick={toggleSidebar}
          >
            <FiMenu size={24} />
          </Button>
          <div className="d-flex flex-column">
            <h5 className="mb-0 fw-bold text-dark page-title">{getPageTitle()}</h5>
            <small className="text-muted d-none d-md-block" style={{ fontSize: '11px' }}>
              {moment().format('dddd, MMMM Do YYYY')}
            </small>
          </div>
        </div>

        <div className="ms-auto d-flex align-items-center gap-3">
          {/* Search Bar */}
          <div className="d-none d-xl-flex align-items-center bg-light rounded-pill px-3 py-2 border-0 search-wrapper">
            <FiSearch className="text-muted me-2" />
            <input
              type="text"
              placeholder={t('search_anything')}
              className="bg-transparent border-0 small"
              style={{ outline: 'none', width: '180px' }}
            />
          </div>

          {/* Branch Switcher */}
          <BranchSwitcher />

          {/* PWA Install Button */}
          {showInstallButton && (
            <Button
              variant="success"
              className="d-flex align-items-center gap-2 rounded-pill px-3 py-2 border-0 install-btn"
              onClick={handleInstallClick}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              <FiDownload size={18} />
              <span className="d-none d-sm-inline">{t('install') || 'Install'}</span>
            </Button>
          )}

          {/* Notifications */}
          <Dropdown
            align="end"
            show={showNotificationDropdown}
            onToggle={setShowNotificationDropdown}
          >
            <Dropdown.Toggle variant="link" className="text-dark p-1 no-caret icon-btn position-relative">
              <div className="icon-circle">
                <FiBell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu className="border-0 shadow-xl mt-3 dropdown-menu-custom notification-menu animate-in">
              <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center bg-light-subtle">
                <h6 className="fw-bold mb-0 text-dark">{t('notifications')}</h6>
                {unreadCount > 0 && (
                  <Button
                    variant="link"
                    className="p-0 text-primary small text-decoration-none fw-semibold"
                    onClick={handleMarkAllAsRead}
                  >
                    {t('mark_all_read')}
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
                                title={t('mark_as_read')}
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
                    <p className="text-muted small mb-0">{t('no_notifications')}</p>
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
                  {t('view_all_notifications')}
                </Button>
              </div>
            </Dropdown.Menu>
          </Dropdown>
          {/* Profile */}
          <Dropdown
            align="end"
            show={showProfileDropdown}
            onToggle={setShowProfileDropdown}
          >
            <Dropdown.Toggle variant="link" className="text-dark d-flex align-items-center p-1 no-caret profile-btn">
              <div className="user-info-wrapper d-none d-md-flex flex-column align-items-end me-2">
                <span className="fw-bold small text-dark line-height-1">{user?.first_name} {user?.last_name}</span>
                <span className="text-muted extra-small">{user?.role ? t(`role_${user.role}`) : t('role_administrator')}</span>
              </div>
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
              <FiChevronDown size={14} className={`ms-1 text-muted transition-all ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </Dropdown.Toggle>

            <Dropdown.Menu className="border-0 shadow-xl mt-3 dropdown-menu-custom profile-menu animate-in">
              <div className="px-4 py-3 border-bottom bg-light-subtle">
                <div className="fw-bold text-dark">{user?.first_name} {user?.last_name}</div>
                <div className="text-muted small truncate-email">{user?.email}</div>
              </div>
              <div className="p-2">
                <Dropdown.Item as={Link} to="/user-profile" className="rounded-3 py-2 d-flex align-items-center">
                  <FiUser className="me-3 text-primary" /> {t('my_profile')}
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/settings" className="rounded-3 py-2 d-flex align-items-center">
                  <FiSettings className="me-3 text-success" /> {t('settings')}
                </Dropdown.Item>
                <Dropdown.Divider />
                <div className="px-3 py-2 text-muted small fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>{t('language') || 'Language'}</div>
                <Dropdown.Item onClick={() => setLocale('en')} className={`rounded-3 py-2 d-flex align-items-center ${locale === 'en' ? 'bg-primary bg-opacity-10 text-primary' : ''}`}>
                  <img src={ukGlobe} alt="EN" className="me-3" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} /> English
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setLocale('rw')} className={`rounded-3 py-2 d-flex align-items-center ${locale === 'rw' ? 'bg-primary bg-opacity-10 text-primary' : ''}`}>
                  <img src={rwandaGlobe} alt="RW" className="me-3" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} /> Kinyarwanda
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setLocale('fr')} className={`rounded-3 py-2 d-flex align-items-center ${locale === 'fr' ? 'bg-primary bg-opacity-10 text-primary' : ''}`}>
                  <img src={franceGlobe} alt="FR" className="me-3" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} /> Français
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="rounded-3 py-2 d-flex align-items-center text-danger">
                  <FiLogOut className="me-3" /> {t('logout')}
                </Dropdown.Item>
              </div>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </Container>

      <style dangerouslySetInnerHTML={{
        __html: `
        .navbar-custom {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 50%, rgba(240, 147, 251, 0.95) 100%);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);
          z-index: 1040;
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
            left: 0 !important;
            width: 100% !important;
          }
        }

        .page-title {
          letter-spacing: -0.5px;
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Only apply white text to top-level navbar elements, not dropdowns */
        .navbar-custom > .container-fluid .text-dark,
        .navbar-custom > .container-fluid .btn-link,
        .navbar-custom > .container-fluid .nav-link {
          color: #ffffff !important;
        }

        .navbar-custom .text-muted {
          color: rgba(255, 255, 255, 0.8) !important;
        }

        .search-wrapper {
          background: rgba(255, 255, 255, 0.2) !important;
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.2s ease;
        }
        
        .search-wrapper input {
          color: #ffffff !important;
        }

        .search-wrapper input::placeholder {
          color: rgba(255, 255, 255, 0.7) !important;
        }

        .search-wrapper svg {
          color: rgba(255, 255, 255, 0.8) !important;
        }
        
        .search-wrapper:focus-within {
          background: rgba(255, 255, 255, 0.3) !important;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .install-btn {
          transition: all 0.3s ease;
        }

        .install-btn:hover {
          background: rgba(255, 255, 255, 0.35) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          transition: all 0.2s ease;
        }

        .icon-btn:hover .icon-circle {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
          background: rgba(255, 255, 255, 0.15);
        }

        .user-info-wrapper span {
          color: #ffffff !important;
        }

        .user-info-wrapper .text-muted {
          color: rgba(255, 255, 255, 0.8) !important;
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

        /* Keep navbar top-level text white */
        .navbar-custom > .container-fluid .text-dark,
        .navbar-custom > .container-fluid .btn-link,
        .navbar-custom > .container-fluid .nav-link,
        .navbar-custom > .container-fluid .navbar-brand,
        .navbar-custom .nav-link,
        .navbar-custom .navbar-brand {
          color: #ffffff !important;
        }

        .navbar-custom .btn-link:hover {
          color: rgba(255, 255, 255, 0.9) !important;
        }

        /* Style the FiMenu icon for mobile */
        .navbar-custom svg {
          color: #ffffff;
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
          color: rgba(255, 255, 255, 0.8) !important;
        }
      `}} />
    </Navbar>
  );
};

export default CustomNavbar;
