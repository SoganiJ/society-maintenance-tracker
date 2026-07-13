import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiMessageSquare, FiSpeaker } from 'react-icons/fi';
import { notificationService } from '../services/notificationService';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import WifiLoader from '../components/WifiLoader';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(page);
      setNotifications(res.data.notifications);
      setPagination(res.data.pagination);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error('Failed to mark as read');
      }
    }

    // Navigate to related item
    if (notif.relatedComplaint) {
      navigate(`/complaints/${notif.relatedComplaint}`);
    } else if (notif.relatedNotice) {
      navigate(`/notices/${notif.relatedNotice}`);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIcon = (type) => {
    if (type.includes('COMPLAINT')) return <FiMessageSquare size={16} />;
    if (type.includes('NOTICE')) return <FiSpeaker size={16} />;
    return <FiBell size={16} />;
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
        <div>
          <h1>Notifications</h1>
          <p className="text-secondary">Updates on your complaints and society notices</p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={handleMarkAllRead}>
            <FiCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <WifiLoader label="Loading notifications…" />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<FiBell />}
          title="All caught up!"
          description="You have no notifications at the moment."
        />
      ) : (
        <div>
          <div className="stack gap-3">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`card card-interactive row gap-4 ${!notif.isRead ? 'notification-unread' : ''}`}
                style={{
                  padding: '16px 20px',
                  alignItems: 'flex-start',
                  borderLeft: !notif.isRead ? '3px solid var(--accent)' : '3px solid transparent',
                }}
                onClick={() => handleNotificationClick(notif)}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--surface-raised)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {getIcon(notif.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: !notif.isRead ? 600 : 500 }}>{notif.title}</p>
                  <p className="text-secondary" style={{ fontSize: '0.875rem', marginTop: 4 }}>
                    {notif.message}
                  </p>
                  <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 8 }}>
                    {formatDate(notif.createdAt)}
                  </p>
                </div>
                {!notif.isRead && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      marginTop: 6,
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-5)' }}>
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              onPageChange={fetchNotifications}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
