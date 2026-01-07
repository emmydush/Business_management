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
  FiAlertTriangle
} from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { communicationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useI18n } from '../i18n/I18nProvider';
import moment from 'moment';

const CustomNavbar = ({ isCollapsed }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  // Fallback user data if no user is logged in
  const userData = user || {
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@tradeflow.com'
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await communicationAPI.getNotifications();
      const notifs = response.data.notifications;
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for notifications every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation(); // Prevent dropdown from closing
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
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleLogout = () => {
    toast((toastId) => (
      <span>
        {t('logout_confirm')}
        <div className="mt-2 d-flex gap-2">
          <Button size="sm" variant="danger" onClick={() => {
            toast.dismiss(toastId.id);
            logout();
            navigate('/logout');
          }}>
            {t('logout')}
          </Button>
          <Button size="sm" variant="light" onClick={() => toast.dismiss(toastId.id)}>
            {t('cancel')}
          </Button>
        </div>
      </span>
    ), { duration: 5000 });
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
    <Navbar expand="lg" fixed="top" className="navbar-custom py-2 shadow-sm" style={{
      left: isCollapsed ? '80px' : '260px',
      width: `calc(100% - ${isCollapsed ? '80px' : '260px'})`,
      transition: 'all 0.3s ease'
    }}>
      <Container fluid className="px-4">
        <div className="d-flex align-items-center">
          <h5 className="mb-0 fw-bold text-dark page-title">{getPageTitle()}</h5>
        </div>

        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="ms-auto align-items-center flex-row">
            {/* Search Bar */}
            <div className="d-none d-md-flex align-items-center bg-light rounded-pill px-3 py-1 border me-3 search-wrapper">
              <FiSearch className="text-muted me-2" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-0 small"
                style={{ outline: 'none', width: '120px' }}
              />
            </div>

            {/* Notifications Dropdown */}
            <Dropdown
              align="end"
              show={showNotificationDropdown}
              onMouseEnter={() => setShowNotificationDropdown(true)}
              onMouseLeave={() => setShowNotificationDropdown(false)}
              className="me-3"
            >
              <Dropdown.Toggle variant="link" className="text-dark position-relative p-0 d-flex align-items-center icon-btn no-caret text-decoration-none">
                <FiBell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </Dropdown.Toggle>

              <Dropdown.Menu className="border-0 shadow-lg mt-2 dropdown-menu-custom animate-dropdown notification-dropdown" style={{ width: '320px', padding: 0 }}>
                <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
                  <h6 className="mb-0 fw-bold">Notifications</h6>
                  {unreadCount > 0 && (
                    <Button variant="link" className="p-0 text-decoration-none small" style={{ fontSize: '12px' }} onClick={handleMarkAllAsRead}>
                      Mark all read
                    </Button>
                  )}
                </div>

                <div className="notification-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notif) => (
                      <Dropdown.Item
                        key={notif.id}
                        className={`px-3 py-2 border-bottom notification-item ${!notif.is_read ? 'bg-light' : ''}`}
                        style={{ whiteSpace: 'normal' }}
                      >
                        <div className="d-flex gap-2">
                          <div className="mt-1">
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <span className={`small fw-bold ${!notif.is_read ? 'text-dark' : 'text-muted'}`}>{notif.title}</span>
                              {!notif.is_read && (
                                <span
                                  className="mark-read-btn text-primary"
                                  onClick={(e) => handleMarkAsRead(notif.id, e)}
                                  title="Mark as read"
                                >
                                  <FiCheck size={12} />
                                </span>
                              )}
                            </div>
                            <p className="mb-0 small text-muted text-truncate-2" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                              {notif.message}
                            </p>
                            <small className="text-muted" style={{ fontSize: '10px' }}>
                              {moment(notif.created_at).fromNow()}
                            </small>
                          </div>
                        </div>
                      </Dropdown.Item>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <FiBell size={24} className="mb-2 opacity-50" />
                      <p className="mb-0 small">No notifications</p>
                    </div>
                  )}
                </div>

                <div className="p-2 text-center border-top bg-light rounded-bottom">
                  <Link to="/notifications" className="text-decoration-none small fw-bold">
                    View All Notifications
                  </Link>
                </div>
              </Dropdown.Menu>
            </Dropdown>

            {/* Profile Dropdown with Hover */}
            <Dropdown
              align="end"
              show={showProfileDropdown}
              onMouseEnter={() => setShowProfileDropdown(true)}
              onMouseLeave={() => setShowProfileDropdown(false)}
            >
              <Dropdown.Toggle variant="link" className="text-dark d-flex align-items-center p-0 no-caret text-decoration-none profile-toggle">
                <div className="avatar-wrapper">
                  {userData.profile_picture ? (
                    <img src={userData.profile_picture} alt="avatar" className="rounded-circle" style={{ width: '38px', height: '38px', objectFit: 'cover' }} />
                  ) : (
                    <FiUser size={20} className="text-primary" />
                  )}
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu className="border-0 shadow-lg mt-2 dropdown-menu-custom animate-dropdown">
                <div className="px-3 py-2 border-bottom mb-2">
                  <div className="fw-bold small">{userData.first_name} {userData.last_name}</div>
                  <div className="text-muted small" style={{ fontSize: '11px' }}>{userData.email}</div>
                </div>
                <Dropdown.Item as={Link} to="/user-profile" className="py-2 d-flex align-items-center dropdown-item-hover">
                  <FiUser className="me-2 text-muted" /> {t('my_profile')}
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/settings" className="py-2 d-flex align-items-center dropdown-item-hover">
                  <FiSettings className="me-2 text-muted" /> {t('settings')}
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="py-2 d-flex align-items-center text-danger dropdown-item-hover">
                  <FiLogOut className="me-2" /> {t('logout')}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>

      <style dangerouslySetInnerHTML={{
        __html: `
        .navbar-custom {
          background: rgba(255, 255, 255, 0.8) !important;
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          z-index: 1050;
        }
        
        .page-title {
          letter-spacing: -0.5px;
        }

        .search-wrapper {
          transition: all 0.3s ease;
          border: 1px solid transparent !important;
        }
        
        .search-wrapper:focus-within {
          border-color: #2563eb !important;
          background: white !important;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
          width: 200px;
        }

        .icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .icon-btn:hover {
          background: #f1f5f9;
        }

        .notification-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          min-width: 16px;
          height: 16px;
          background: #ef4444;
          border-radius: 10px;
          border: 2px solid white;
          color: white;
          font-size: 9px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 2px;
        }

        .avatar-wrapper {
          width: 38px;
          height: 38px;
          background: rgba(37, 99, 235, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(37, 99, 235, 0.1);
          transition: all 0.2s ease;
        }
        
        .profile-toggle:hover .avatar-wrapper {
          background: rgba(37, 99, 235, 0.2);
          transform: translateY(-1px);
        }

        .dropdown-menu-custom {
          border-radius: 16px;
          padding: 0.75rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          min-width: 200px;
        }
        
        .dropdown-item {
          border-radius: 10px;
          font-size: 0.875rem;
          margin: 2px 0;
          padding: 0.6rem 0.75rem;
        }
        
        .dropdown-item:hover {
          background-color: #f8fafc;
        }

        /* Dropdown Animations */
        .animate-dropdown {
          animation: dropdownSlideIn 0.2s ease-out;
        }

        @keyframes dropdownSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-item-hover {
          transition: all 0.2s ease;
        }

        .dropdown-item-hover:hover {
          transform: translateX(5px);
        }

        .no-caret::after {
          display: none !important;
        }
        
        .notification-item {
          transition: background-color 0.2s;
        }
        
        .notification-item:hover {
          background-color: #f8fafc !important;
        }
        
        .mark-read-btn {
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .notification-item:hover .mark-read-btn {
          opacity: 1;
        }
        
        .text-truncate-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .notification-list::-webkit-scrollbar {
          width: 4px;
        }
        
        .notification-list::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 2px;
        }
      `}} />
    </Navbar>
  );
};

export default CustomNavbar;