import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiClock, FiUser } from 'react-icons/fi';
import { noticeService } from '../services/noticeService';
import WifiLoader from '../components/WifiLoader';

const NoticeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await noticeService.getById(id);
        setNotice(res.data.notice);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load notice.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <WifiLoader overlay label="Loading notice…" />;

  if (error) {
    return (
      <div className="card empty-state">
        <p>{error}</p>
        <button type="button" className="btn btn-sm" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => navigate(-1)}
        style={{ marginBottom: 'var(--space-4)' }}
      >
        <FiArrowLeft size={16} /> Back
      </button>

      <div className="card" style={{ maxWidth: 720 }}>
        {/* Header badges */}
        <div className="row gap-2" style={{ marginBottom: 'var(--space-4)' }}>
          {notice.isPinned && (
            <span className="badge badge-notice-pinned">
              <FiMapPin size={11} /> Pinned
            </span>
          )}
          <span className={`badge badge-notice-${notice.type}`}>{notice.type}</span>
        </div>

        <h1 style={{ marginBottom: 'var(--space-4)' }}>{notice.title}</h1>

        {/* Meta */}
        <div
          className="row gap-4"
          style={{
            marginBottom: 'var(--space-5)',
            paddingBottom: 'var(--space-4)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span className="text-muted row gap-1" style={{ fontSize: '0.8125rem' }}>
            <FiClock size={14} />
            {formatDate(notice.createdAt)}
          </span>
          {notice.createdBy && (
            <span className="text-muted row gap-1" style={{ fontSize: '0.8125rem' }}>
              <FiUser size={14} />
              {notice.createdBy.name}
            </span>
          )}
        </div>

        {/* Content */}
        <div
          style={{
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            color: 'var(--text-primary)',
          }}
        >
          {notice.content}
        </div>

        {/* Expiry */}
        {notice.expiresAt && (
          <div
            className="text-muted"
            style={{
              marginTop: 'var(--space-5)',
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid var(--border)',
              fontSize: '0.8125rem',
            }}
          >
            Expires: {formatDate(notice.expiresAt)}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeDetail;
