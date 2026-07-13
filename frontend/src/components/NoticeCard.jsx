import { Link } from 'react-router-dom';
import { FiMapPin, FiClock } from 'react-icons/fi';

/**
 * Notice card using the card-signal motif.
 * Type determines left border color:
 *  - pinned → accent
 *  - important → status-overdue
 *  - general → text-muted
 *
 * Props:
 *  - notice: { _id, title, content, type, isPinned, createdBy, createdAt, expiresAt }
 *  - linkPrefix: route prefix (default: '/notices')
 */
const NoticeCard = ({ notice, linkPrefix = '/notices' }) => {
  const typeClass = `notice-type-${notice.type}`;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <Link to={`${linkPrefix}/${notice._id}`} style={{ display: 'block' }}>
      <div className={`card card-signal card-interactive ${typeClass}`}>
        <div className="row" style={{ justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <div style={{ minWidth: 0 }}>
            <div className="row gap-2" style={{ marginBottom: 4 }}>
              {notice.isPinned && (
                <span className="badge badge-notice-pinned">
                  <FiMapPin size={11} /> Pinned
                </span>
              )}
              <span className={`badge badge-notice-${notice.type}`}>
                {notice.type}
              </span>
            </div>
            <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{notice.title}</p>
            <p
              className="text-muted"
              style={{
                fontSize: '0.8125rem',
                marginTop: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 480,
              }}
            >
              {notice.content}
            </p>
          </div>
          <div
            className="stack gap-1"
            style={{ flexShrink: 0, alignItems: 'flex-end', fontSize: '0.75rem' }}
          >
            <span className="text-muted row gap-1">
              <FiClock size={12} />
              {formatDate(notice.createdAt)}
            </span>
            {notice.createdBy && (
              <span className="text-muted">by {notice.createdBy.name}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default NoticeCard;
