import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMenu, FiBell, FiSearch, FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import ThemeToggle from './ThemeToggle';

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Account menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data } = await notificationService.getUnreadCount();
        setUnreadCount(data.count);
      } catch (err) {
        console.error('Failed to fetch unread count');
      }
    };
    fetchUnreadCount();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleNotifClick = async () => {
    if (!notifOpen) {
      // Fetch recent notifications when opening
      try {
        const { data } = await notificationService.getNotifications(1, 5);
        setRecentNotifs(data.notifications);
      } catch (err) {
        console.error('Failed to fetch recent notifs');
      }
    }
    setNotifOpen(!notifOpen);
    setMenuOpen(false);
  };

  const handleMenuClick = () => {
    setMenuOpen(!menuOpen);
    setNotifOpen(false);
  };

  const onNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif._id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark as read');
      }
    }
    setNotifOpen(false);
    if (notif.relatedComplaint) {
      navigate(`/complaints/${notif.relatedComplaint}`);
    } else if (notif.relatedNotice) {
      navigate(`/notices/${notif.relatedNotice}`);
    } else {
      navigate('/notifications');
    }
  };

  return (
    <header
      className="row"
      style={{
        height: 'var(--navbar-height)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '0 var(--space-5)',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      <div className="row gap-3">
        <button
          type="button"
          className="btn btn-icon btn-ghost sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <FiMenu size={18} />
        </button>
        <div
          className="row gap-2"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
            width: 260,
          }}
        >
          <FiSearch size={16} color="var(--text-muted)" />
          <input
            placeholder="Search complaints, notices..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.875rem',
              width: '100%',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      <div className="row gap-3">
        <ThemeToggle />
        
        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            type="button"
            className="btn btn-icon btn-ghost"
            onClick={handleNotifClick}
            aria-label="Notifications"
          >
            <FiBell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--status-overdue)', // Red dot
                  border: '2px solid var(--surface)',
                }}
              />
            )}
          </button>

          {notifOpen && (
            <div
              className="card"
              style={{
                position: 'absolute',
                right: 0,
                top: 44,
                width: 320,
                padding: 0,
                zIndex: 50,
                overflow: 'hidden',
              }}
            >
              <div
                className="row"
                style={{
                  padding: 'var(--space-3)',
                  borderBottom: '1px solid var(--border)',
                  justifyContent: 'space-between',
                }}
              >
                <h4 style={{ fontSize: '0.9375rem', margin: 0 }}>Notifications</h4>
                {unreadCount > 0 && (
                  <span className="badge badge-open" style={{ fontSize: '0.6875rem' }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {recentNotifs.length === 0 ? (
                  <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No recent notifications
                  </div>
                ) : (
                  recentNotifs.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => onNotificationClick(n)}
                      style={{
                        padding: 'var(--space-3)',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: n.isRead ? 'transparent' : 'var(--accent-soft)',
                      }}
                    >
                      <p style={{ fontSize: '0.875rem', fontWeight: n.isRead ? 400 : 600 }}>{n.title}</p>
                      <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                        {new Date(n.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <Link
                to="/notifications"
                onClick={() => setNotifOpen(false)}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '10px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  background: 'var(--surface-raised)',
                }}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>

        {/* Account Menu */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            type="button"
            onClick={handleMenuClick}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: user?.avatar?.url ? `url(${user.avatar.url}) center/cover` : 'var(--accent)',
              color: 'var(--accent-contrast)',
              fontSize: '0.75rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Account menu"
          >
            {!user?.avatar?.url && (initials(user?.name) || <FiUser size={16} />)}
          </button>

          {menuOpen && (
            <div
              className="card stack gap-1"
              style={{
                position: 'absolute',
                right: 0,
                top: 44,
                width: 220,
                padding: 'var(--space-2)',
                zIndex: 50,
              }}
            >
              <div style={{ padding: 'var(--space-2) var(--space-3)', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.name}</p>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {user?.email}
                </p>
              </div>
              
              <Link to="/profile" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => setMenuOpen(false)}>
                <FiUser size={16} /> My Profile
              </Link>
              
              {user?.role === 'admin' && (
                <Link to="/settings" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => setMenuOpen(false)}>
                  <FiSettings size={16} /> Settings
                </Link>
              )}
              
              <button
                type="button"
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--status-overdue)' }}
                onClick={handleLogout}
              >
                <FiLogOut size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
