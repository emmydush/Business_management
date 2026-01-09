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
  FiChevronDown
} from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { communicationAPI, getImageUrl } from '../services/api';
import toast from 'react-hot-toast';
import { useI18n } from '../i18n/I18nProvider';
import moment from 'moment';

const CustomNavbar = ({ isCollapsed, toggleSidebar }) => {
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
    if (path === 'leads') return 'Prospects';
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
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
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
      left: isCollapsed ? '80px' : '260px',
      width: `calc(100% - ${isCollapsed ? '80px' : '260px'})`,
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
              placeholder="Search anything..."
              className="bg-transparent border-0 small"
              style={{ outline: 'none', width: '180px' }}
            />
          </div>

          {/* Notifications */}
          <Dropdown
            align="end"
            show={showNotificationDropdown}
            onToggle={setShowNotificationDropdown}
            className="notification-dropdown-wrapper"
          >
            <Dropdown.Toggle variant="link" className="text-dark position-relative p-0 d-flex align-items-center icon-btn no-caret">
              <div className="icon-circle">
                <FiBell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu className="border-0 shadow-xl mt-3 dropdown-menu-custom notification-menu animate-in">
              <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
                <h6 className="mb-0 fw-bold">Notifications</h6>
                {unreadCount > 0 && (
                  <Button variant="link" className="p-0 text-decoration-none small fw-semibold" style={{ fontSize: '12px' }} onClick={handleMarkAllAsRead}>
                    Mark all read
                  </Button>
                )}
              </div>

              <div className="notification-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
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
                          <div className="d-flex justify-content-between align-items-start">
                            <span className="small fw-bold text-dark">{notif.title}</span>
                            {!notif.is_read && (
                              <span
                                className="mark-read-indicator"
                                onClick={(e) => handleMarkAsRead(notif.id, e)}
                              ></span>
                            )}
                          </div>
                          <p className="mb-1 small text-muted text-truncate-2" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                            {notif.message}
                          </p>
                          <small className="text-muted-light" style={{ fontSize: '10px' }}>
                            {moment(notif.created_at).fromNow()}
                          </small>
                        </div>
                      </div>
                    </Dropdown.Item>
                  ))
                ) : (
                  <div className="text-center py-5 text-muted">
                    <div className="empty-notif-icon mb-2">
                      <FiBell size={32} />
                    </div>
                    <p className="mb-0 small">All caught up!</p>
                  </div>
                )}
              </div>

              <div className="p-3 text-center bg-light-subtle rounded-bottom">
                <Link to="/notifications" className="text-primary text-decoration-none small fw-bold hover-underline">
                  View all activity
                </Link>
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
                <span className="text-muted extra-small">{user?.role || 'Administrator'}</span>
              </div>
              <div className="avatar-container">
                {user?.profile_picture ? (
                  <img src={getImageUrl(user.profile_picture)} alt="avatar" className="avatar-img" />
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
                <Dropdown.Item onClick={handleLogout} className="rounded-3 py-2 d-flex align-items-center text-danger">
                  <FiLogOut className="me-3" /> {t('logout')}
                </Dropdown.Item>
              </div>
            </Dropdown.Menu>
        </div>
      </Container>

      <style dangerouslySetInnerHTML={{
        __html: `
        .navbar-custom {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          z-index: 1040;
        }

        @media (max-width: 991.98px) {
          .navbar-custom {
            left: 0 !important;
            width: 100% !important;
          }
        }

        .page-title {
          letter-spacing: -0.5px;
          color: #1e293b;
        }

        .search-wrapper {
          background: #f1f5f9 !important;
          transition: all 0.2s ease;
        }
        
        .search-wrapper:focus-within {
          background: #fff !important;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
          width: 240px;
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
          background: #f8fafc;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.2s ease;
        }

        .icon-btn:hover .icon-circle {
          background: #f1f5f9;
          color: #334155;
        }

        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          background: #ef4444;
          border-radius: 10px;
          border: 2px solid #fff;
          color: white;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          z-index: 10;
        }

        .avatar-container {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          overflow: hidden;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
          background: #f8fafc;
        }

        .dropdown-menu-custom {
          border-radius: 20px;
          padding: 0;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          min-width: 280px;
        }

        .notification-menu {
          width: 360px;
        }

        .notification-item {
          transition: all 0.2s ease;
          background: transparent;
        }

        .notification-item.unread {
          background: rgba(37, 99, 235, 0.03);
        }

        .notification-item:hover {
          background: #f8fafc;
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
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .mark-read-indicator:hover {
          transform: scale(1.3);
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
        .notification-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}} />
    </Navbar>
  );
};

export default CustomNavbar;