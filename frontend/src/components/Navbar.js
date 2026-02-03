import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useSubscription } from '../context/SubscriptionContext';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const lastToastedIdRef = useRef(null);
  const isInitialFetchRef = useRef(true);

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

  const { refreshSubscriptionStatus } = useSubscription();

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await communicationAPI.getNotifications({
        page: 1,
        limit: 10,
        unread: true
      });
      const notifs = response.data.notifications || [];
      const newUnreadCount = response.data.pagination?.total_unread || 0;

      if (notifs.length > 0) {
        const newestNotif = notifs[0];

        // Only toast if:
        // 1. We haven't toasted this ID yet in this session
        // 2. AND it's not the very first fetch after a refresh (unless it's extremely recent)
        const isVeryRecent = moment().diff(moment(newestNotif.created_at), 'seconds') < 30;
        const shouldToast = newestNotif.id !== lastToastedIdRef.current && (!isInitialFetchRef.current || isVeryRecent);

        if (shouldToast) {
          toast.success(`${newestNotif.title}: ${newestNotif.message}`, {
            duration: 5000,
            icon: '🔔'
          });
          lastToastedIdRef.current = newestNotif.id;

          // If it's a subscription update, refresh the subscription status
          if (newestNotif.title.toLowerCase().includes('subscription')) {
            refreshSubscriptionStatus();
          }
        } else if (isInitialFetchRef.current) {
          // On initial fetch, just record the ID so we don't toast it again
          lastToastedIdRef.current = newestNotif.id;
        }
      }

      isInitialFetchRef.current = false;
      setNotifications(notifs);
      setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [refreshSubscriptionStatus]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
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

  const searchablePages = [
    { title: t('sidebar_dashboard'), path: '/dashboard' },
    { title: t('sidebar_user_management'), path: '/users' },
    { title: t('sidebar_customers'), path: '/customers' },
    { title: t('sidebar_suppliers'), path: '/suppliers' },
    { title: t('sidebar_leads'), path: '/leads' },
    { title: t('sidebar_inventory'), path: '/inventory' },
    { title: t('sidebar_products'), path: '/products' },
    { title: t('sidebar_sales'), path: '/sales' },
    { title: t('sidebar_pos'), path: '/pos' },
    { title: t('sidebar_reports'), path: '/reports' },
    { title: t('sidebar_settings'), path: '/settings' },
    { title: t('sidebar_hr'), path: '/hr' },
    { title: t('sidebar_employees'), path: '/employees' },
    { title: t('sidebar_payroll'), path: '/payroll' },
    { title: t('sidebar_expenses'), path: '/expenses' },
    { title: t('sidebar_purchases'), path: '/purchases' },
    { title: t('sidebar_projects'), path: '/projects' },
    { title: t('sidebar_tasks'), path: '/tasks' },
    { title: t('sidebar_documents'), path: '/documents' },
    { title: t('sidebar_assets'), path: '/assets' }
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      const filtered = searchablePages.filter(page =>
        page.title.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchSelect = (path) => {
    navigate(path);
    setSearchQuery('');
    setSearchResults([]);
    setShowMobileSearch(false);
  };

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
    if (!showMobileSearch) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  // Close mobile search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMobileSearch && !event.target.closest('.mobile-search-overlay')) {
        setShowMobileSearch(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    if (showMobileSearch) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileSearch]);

  // Ensure smartphone search button visibility on smartphones only
  useEffect(() => {
    const checkSmartphoneVisibility = () => {
      // Smartphone detection: width <= 768px AND touch capability
      const isSmartphone = (window.innerWidth <= 768) && 
                          (('ontouchstart' in window) || 
                          (navigator.maxTouchPoints > 0) ||
                          (navigator.msMaxTouchPoints > 0));
      
      const searchButton = document.querySelector('.smartphone-search-btn');
      if (searchButton) {
        if (isSmartphone) {
          // Show on smartphones
          searchButton.style.display = 'flex';
          searchButton.style.visibility = 'visible';
          searchButton.style.opacity = '1';
          searchButton.style.position = 'relative';
          searchButton.style.zIndex = '1060';
          
          // Add high visibility class if not present
          if (!searchButton.classList.contains('high-visibility-search')) {
            searchButton.classList.add('high-visibility-search');
          }
        } else {
          // Hide on tablets/desktops
          searchButton.style.display = 'none';
          searchButton.style.visibility = 'hidden';
          searchButton.style.opacity = '0';
        }
      }
    };

    // Check on mount and resize
    checkSmartphoneVisibility();
    window.addEventListener('resize', checkSmartphoneVisibility);
    window.addEventListener('orientationchange', checkSmartphoneVisibility);
    
    // Continuous visibility check
    const visibilityInterval = setInterval(checkSmartphoneVisibility, 300);

    // Also check after delays to ensure DOM is ready
    const timer = setTimeout(checkSmartphoneVisibility, 100);
    const timer2 = setTimeout(checkSmartphoneVisibility, 500);
    const timer3 = setTimeout(checkSmartphoneVisibility, 1000);

    return () => {
      window.removeEventListener('resize', checkSmartphoneVisibility);
      window.removeEventListener('orientationchange', checkSmartphoneVisibility);
      clearInterval(visibilityInterval);
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

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
            <h5 className="mb-0 fw-bold page-title">{getPageTitle()}</h5>
            <small className="text-muted d-none d-md-block" style={{ fontSize: '11px' }}>
              {moment().format('dddd, MMMM Do YYYY')}
            </small>
          </div>
        </div>

        <div className="ms-auto d-flex align-items-center gap-3">
          {/* Desktop Search Bar */}
          <div className="d-none d-xl-flex align-items-center bg-light rounded-pill px-3 py-2 border-0 search-wrapper position-relative">
            <FiSearch className="text-muted me-2" />
            <input
              type="text"
              placeholder={t('search_anything')}
              className="bg-transparent border-0 small"
              style={{ outline: 'none', width: '180px', color: '#333333' }}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="search-results-dropdown shadow-lg animate-in">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="search-result-item d-flex align-items-center gap-2"
                    onClick={() => handleSearchSelect(result.path)}
                  >
                    <FiSearch size={14} className="text-muted" />
                    <span>{result.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Smartphone Only Search Toggle Button - HIGH VISIBILITY */}
          <button 
            className="smartphone-search-btn btn search-toggle-btn high-visibility-search"
            onClick={toggleMobileSearch}
            style={{
              width: '52px',
              height: '52px',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
              backdropFilter: 'blur(15px)',
              border: '2px solid #3b82f6',
              borderRadius: '50%',
              boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 1060,
              position: 'relative'
            }}
          >
            <FiSearch 
              size={26} 
              className="text-blue-600 search-icon" 
              style={{ 
                filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))',
                fontWeight: 'bold'
              }} 
            />
            {/* Attention dot */}
            <span 
              className="attention-dot"
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '10px',
                height: '10px',
                background: '#ef4444',
                borderRadius: '50%',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
              }}
            />
          </button>


          {/* PWA Install Button */}
          {showInstallButton && (
            <Button
              variant="success"
              className="d-flex align-items-center gap-2 rounded-pill px-3 py-2 border-0 install-btn"
              onClick={handleInstallClick}
              style={{
                background: 'rgba(102, 126, 234, 0.1)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                color: '#667eea',
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
                <span className="fw-bold small line-height-1">{user?.first_name} {user?.last_name}</span>
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
          background: #f8f9fa;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
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
          background: rgba(255, 255, 255, 0.8) !important;
          border: 1px solid rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .search-wrapper input {
          color: #333333 !important;
        }

        .search-wrapper input::placeholder {
          color: rgba(51, 51, 51, 0.5) !important;
        }

        .search-wrapper svg {
          color: rgba(51, 51, 51, 0.6) !important;
        }
        
        .search-wrapper:focus-within {
          background: rgba(255, 255, 255, 1) !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
          border-color: rgba(102, 126, 234, 0.3);
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
        .search-results-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border-radius: 12px;
          margin-top: 8px;
          padding: 8px;
          z-index: 1100;
          border: 1px solid rgba(102, 126, 234, 0.1);
        }

        .search-result-item {
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #1e293b;
          font-size: 13px;
          font-weight: 500;
        }

        .search-result-item:hover {
          background: rgba(102, 126, 234, 0.05);
          color: #667eea;
          transform: translateX(4px);
        }

        /* Mobile Search Overlay */
        .mobile-search-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(10px);
          z-index: 1300;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 100px;
        }

        @media (max-width: 576px) {
          .mobile-search-overlay {
            padding-top: 80px;
          }
          
          .mobile-search-container {
            width: 95%;
            padding: 15px;
          }
          
          .mobile-search-input {
            padding: 12px 15px;
            font-size: 16px;
          }
        }

        @media (max-height: 600px) {
          .mobile-search-overlay {
            padding-top: 60px;
          }
          
          .mobile-search-container {
            max-height: 80vh;
            overflow-y: auto;
          }
          
          .mobile-search-results {
            max-height: 200px;
          }
        }

        .mobile-search-container {
          width: 90%;
          max-width: 500px;
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mobile-search-input {
          width: 100%;
          padding: 15px 20px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          outline: none;
          transition: all 0.2s ease;
        }

        .mobile-search-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .mobile-search-results {
          margin-top: 15px;
          max-height: 300px;
          overflow-y: auto;
        }

        .mobile-search-result {
          padding: 12px 15px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid #f1f5f9;
        }

        .mobile-search-result:last-child {
          border-bottom: none;
        }

        .mobile-search-result:hover {
          background: #f8fafc;
          transform: translateX(5px);
        }

        .mobile-search-close {
          position: absolute;
          top: 15px;
          right: 15px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mobile-search-close:hover {
          background: #dc2626;
          transform: scale(1.1);
        }

        .search-toggle-btn:hover {
          transform: scale(1.1);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.45) 100%) !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2) !important;
        }

        .search-toggle-btn:active {
          transform: scale(0.95);
        }

        /* Ensure mobile search button is always visible on small screens */
        @media (max-width: 991.98px) {
          .search-toggle-btn {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        }

        @media (max-width: 767.98px) {
          .search-toggle-btn {
            width: 48px !important;
            height: 48px !important;
          }
          
          .search-toggle-btn svg {
            width: 24px !important;
            height: 24px !important;
          }
        }

        /* Smartphone search button - visible only on smartphones (max 768px) */
        @media (max-width: 768px) {
          .smartphone-search-btn {
            display: flex !important;
          }
        }

        /* Hide on tablets and desktops */
        @media (min-width: 769px) {
          .smartphone-search-btn {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }
        }

        /* Extra visibility for touch devices under 768px */
        @media screen and (max-width: 768px) and (hover: none) and (pointer: coarse) {
          .smartphone-search-btn {
            display: flex !important;
            position: relative !important;
          }
        }

        /* Enhanced visibility for small smartphones */
        @media (max-width: 575.98px) {
          .smartphone-search-btn {
            display: flex !important;
            width: 50px !important;
            height: 50px !important;
            position: fixed !important;
            top: 15px;
            right: 70px;
            z-index: 1100 !important;
          }
          
          .smartphone-search-btn svg {
            width: 26px !important;
            height: 26px !important;
          }
        }

        /* Smartphone-specific breakpoints */
        @media (max-width: 480px) {
          .smartphone-search-btn {
            width: 55px !important;
            height: 55px !important;
            right: 65px !important;
          }
          
          .smartphone-search-btn svg {
            width: 28px !important;
            height: 28px !important;
          }
        }

        /* Landscape smartphone mode */
        @media (max-width: 768px) and (orientation: landscape) {
          .smartphone-search-btn {
            top: 10px !important;
            right: 60px !important;
          }
        }

        /* Prevent display on tablets (768px+) */
        @media (min-width: 769px) and (max-width: 1024px) {
          .smartphone-search-btn {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        }

        /* High contrast mode for better visibility */
        @media (prefers-contrast: high) {
          .smartphone-search-btn {
            border: 2px solid white !important;
            background: rgba(255, 255, 255, 0.4) !important;
          }
        }

        /* Enhanced visibility styles */
        .high-visibility-search {
          animation: pulseGlow 2s infinite ease-in-out;
        }

        @keyframes pulseGlow {
          0% {
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.8);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.6), 0 0 20px rgba(59, 130, 246, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.8);
            transform: scale(1.05);
          }
          100% {
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.8);
            transform: scale(1);
          }
        }

        .search-icon {
          animation: subtleBounce 3s infinite ease-in-out;
        }

        @keyframes subtleBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        .attention-dot {
          animation: blink 1.5s infinite ease-in-out;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.2); }
        }

        .high-visibility-search:hover {
          animation: none;
          transform: scale(1.15) !important;
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.7), 0 0 25px rgba(59, 130, 246, 0.4) !important;
        }

        .high-visibility-search:active {
          transform: scale(0.95) !important;
        }

        /* Extra large mobile button for maximum visibility */
        @media (max-width: 480px) {
          .high-visibility-search {
            width: 60px !important;
            height: 60px !important;
            border-width: 3px !important;
          }
          
          .search-icon {
            width: 30px !important;
            height: 30px !important;
          }
          
          .attention-dot {
            width: 12px !important;
            height: 12px !important;
            top: 0px !important;
            right: 0px !important;
          }
        }

        /* Ensure maximum contrast in all lighting conditions */
        @media (prefers-color-scheme: dark) {
          .high-visibility-search {
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%) !important;
            border-color: #ffffff !important;
          }
          
          .search-icon {
            color: white !important;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5)) !important;
          }
        }
      `}} />

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="mobile-search-overlay">
          <div className="mobile-search-container position-relative">
            <button 
              className="mobile-search-close"
              onClick={toggleMobileSearch}
            >
              <FiSearch size={16} />
            </button>
            <input
              type="text"
              placeholder={t('search_anything')}
              className="mobile-search-input"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
            {searchResults.length > 0 && (
              <div className="mobile-search-results">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="mobile-search-result d-flex align-items-center gap-3"
                    onClick={() => handleSearchSelect(result.path)}
                  >
                    <FiSearch size={18} className="text-muted" />
                    <span className="fw-medium">{result.title}</span>
                  </div>
                ))}
              </div>
            )}
            {searchResults.length === 0 && searchQuery.trim() !== '' && (
              <div className="text-center py-4 text-muted">
                <FiSearch size={24} className="mb-2" />
                <p className="mb-0">No results found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Navbar>
  );
};

export default CustomNavbar;
