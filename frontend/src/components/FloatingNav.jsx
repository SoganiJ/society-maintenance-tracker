import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { FiArrowLeft, FiLogOut, FiBell } from 'react-icons/fi';
import api from '../services/api';
import ThemeToggle from './ThemeToggle';
import { notificationService } from '../services/notificationService';

const FloatingNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const notifRef = useRef(null);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications');
        const notificationsList = res.data?.data?.notifications || [];
        const unreadCount = notificationsList.filter(n => !n.isRead).length;
        setUnread(unreadCount);
      } catch (err) {
        console.error(err);
      }
    };
    if (user) fetchUnread();
  }, [location.pathname, user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleNotifClick = async () => {
    if (!notifOpen) {
      try {
        const { data } = await notificationService.getNotifications(1, 5);
        setRecentNotifs(data.notifications);
      } catch (err) {
        console.error('Failed to fetch recent notifs');
      }
    }
    setNotifOpen(!notifOpen);
  };

  const onNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif._id);
        setUnread(prev => Math.max(0, prev - 1));
      } catch (err) {}
    }
    setNotifOpen(false);
    if (notif.relatedComplaint) navigate(`/complaints/${notif.relatedComplaint}`);
    else if (notif.relatedNotice) navigate(`/notices/${notif.relatedNotice}`);
    else navigate('/notifications');
  };

  const tabs = [
    { id: 'radio-1', label: 'Home', path: '/' },
    { id: 'radio-2', label: 'Issues', path: '/complaints' },
    { id: 'radio-3', label: 'Notices', path: user?.role === 'admin' ? '/admin/notices' : '/notices' },
    ...(user?.role === 'admin' ? [{ id: 'radio-5', label: 'Workers', path: '/admin/workers' }] : []),
    { id: 'radio-4', label: 'Profile', path: '/profile' }
  ];

  const activeIndex = tabs.findIndex(t => location.pathname === t.path || (t.path !== '/' && location.pathname.startsWith(t.path)));
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  return (
    <div className="floating-nav-container">
      <div className="floating-nav-tabs row gap-2" style={{ padding: '10px 14px' }}>
        
        {location.pathname !== '/' && (
          <button type="button" className="btn btn-icon btn-ghost" onClick={() => navigate(-1)} style={{ width: 34, height: 34, padding: 0 }} aria-label="Go Back">
            <FiArrowLeft size={18} />
          </button>
        )}

        <ThemeToggle />

        <div style={{ display: 'flex', position: 'relative' }}>
          {tabs.map((tab, idx) => (
            <div key={tab.id} style={{ display: 'contents' }}>
              <input 
                type="radio" 
                id={tab.id} 
                name="tabs" 
                checked={safeIndex === idx} 
                onChange={() => navigate(tab.path)}
              />
              <label className="floating-nav-tab" htmlFor={tab.id}>
                {tab.label}
              </label>
            </div>
          ))}
          <span className="floating-nav-glider" style={{ transform: `translateX(${safeIndex * 100}%)` }}></span>
        </div>

        <div style={{ position: 'relative' }} ref={notifRef}>
          <button type="button" className="btn btn-icon btn-ghost" onClick={handleNotifClick} style={{ width: 34, height: 34, padding: 0 }}>
            <FiBell size={18} />
            {unread > 0 && (
              <span className="floating-nav-notification" style={{ top: -2, right: -2 }}>
                {unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="card" style={{ position: 'absolute', top: 45, right: -100, width: 320, padding: 0, zIndex: 1000 }}>
              <div className="row" style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--border)', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '0.9375rem' }}>Notifications</h4>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {recentNotifs.length === 0 ? (
                  <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>No notifications</div>
                ) : (
                  recentNotifs.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => onNotificationClick(n)}
                      style={{
                        padding: '10px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                        background: n.isRead ? 'transparent' : 'var(--accent-soft)'
                      }}
                    >
                      <p style={{ fontSize: '0.85rem', fontWeight: n.isRead ? 400 : 600 }}>{n.title}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button type="button" className="btn btn-icon btn-ghost" onClick={handleLogout} style={{ width: 34, height: 34, padding: 0, color: 'var(--status-overdue)' }}>
          <FiLogOut size={18} />
        </button>

      </div>
    </div>
  );
};

export default FloatingNav;
