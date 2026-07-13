import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiHome,
  FiCalendar,
  FiClock,
  FiShield,
} from 'react-icons/fi';
import { adminService } from '../services/adminService';
import WifiLoader from '../components/WifiLoader';

const ResidentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resident, setResident] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminService.getResident(id);
        setResident(res.data.resident);
        setStats(res.data.complaintStats);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load resident.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) return <WifiLoader overlay label="Loading resident…" />;

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

  const statCards = [
    { label: 'Total', value: stats?.total || 0, signal: '' },
    { label: 'Open', value: stats?.open || 0, signal: 'status-open' },
    { label: 'In Progress', value: stats?.inProgress || 0, signal: 'status-in_progress' },
    { label: 'Resolved', value: stats?.resolved || 0, signal: 'status-resolved' },
    { label: 'Closed', value: stats?.closed || 0, signal: 'status-closed' },
    { label: 'Overdue', value: stats?.overdue || 0, signal: 'status-overdue' },
  ];

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

      <div className="row gap-5" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Profile Card */}
        <div className="card" style={{ flex: '1 1 320px', maxWidth: 420 }}>
          <div className="row gap-4" style={{ marginBottom: 'var(--space-5)' }}>
            {/* Avatar */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {resident.name
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0].toUpperCase())
                .join('')}
            </div>
            <div>
              <h2 style={{ marginBottom: 2 }}>{resident.name}</h2>
              <div className="row gap-2">
                <span
                  className={`badge ${resident.role === 'admin' ? 'badge-notice-pinned' : 'badge-notice-general'}`}
                >
                  {resident.role}
                </span>
                <span
                  className={`badge ${resident.isActive ? 'badge-resolved' : 'badge-closed'}`}
                >
                  {resident.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="stack gap-4">
            <div className="row gap-3">
              <FiMail size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '0.9375rem' }}>{resident.email}</span>
            </div>
            <div className="row gap-3">
              <FiPhone size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '0.9375rem' }}>{resident.phone || '—'}</span>
            </div>
            <div className="row gap-3">
              <FiHome size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '0.9375rem' }}>Flat {resident.flatNumber}</span>
            </div>
            <div className="row gap-3">
              <FiShield size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '0.9375rem', textTransform: 'capitalize' }}>
                {resident.role}
              </span>
            </div>
            <div className="row gap-3">
              <FiCalendar size={16} color="var(--text-muted)" />
              <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
                Joined {formatDate(resident.createdAt)}
              </span>
            </div>
            {resident.lastLoginAt && (
              <div className="row gap-3">
                <FiClock size={16} color="var(--text-muted)" />
                <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
                  Last login {formatDate(resident.lastLoginAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Complaint Stats */}
        <div style={{ flex: '1 1 400px' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Complaint Statistics</h3>
          <div className="grid grid-cols-3">
            {statCards.map((sc) => (
              <div
                key={sc.label}
                className={`card card-signal ${sc.signal} stat-card`}
              >
                <span className="text-muted">{sc.label}</span>
                <span className="stat-value">{sc.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentDetail;
