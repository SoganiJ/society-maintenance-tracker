import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import ComplaintCard from '../components/ComplaintCard';
import WifiLoader from '../components/WifiLoader';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, listRes] = await Promise.all([
          complaintService.getStats(),
          complaintService.list({ limit: 5 }),
        ]);
        setStats(statsRes.data);
        setRecent(listRes.data.complaints);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <WifiLoader overlay label="Loading dashboard..." />;
  }

  const cards = [
    { key: 'open', label: 'Open', value: stats?.byStatus?.open || 0, signal: 'status-open' },
    {
      key: 'in_progress',
      label: 'In progress',
      value: stats?.byStatus?.in_progress || 0,
      signal: 'status-in_progress',
    },
    {
      key: 'resolved',
      label: 'Resolved',
      value: stats?.byStatus?.resolved || 0,
      signal: 'status-resolved',
    },
    { key: 'overdue', label: 'Overdue', value: stats?.overdue || 0, signal: 'status-overdue' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1>Dashboard</h1>
        <p className="text-secondary">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 'var(--space-6)' }}>
        {cards.map((c) => (
          <div key={c.key} className={`card card-signal ${c.signal} stat-card`}>
            <span className="text-muted">{c.label}</span>
            <span className="stat-value">{c.value}</span>
          </div>
        ))}
      </div>

      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3>Recent complaints</h3>
        {user?.role !== 'admin' && (
          <Link to="/raise-complaint" className="btn btn-primary btn-sm">
            Raise complaint
          </Link>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="card empty-state">
          <p>No complaints yet.</p>
          {user?.role !== 'admin' && (
            <Link to="/raise-complaint" className="btn btn-primary btn-sm">
              Raise your first complaint
            </Link>
          )}
        </div>
      ) : (
        <div className="stack gap-3">
          {recent.map((c) => (
            <ComplaintCard key={c._id} complaint={c} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
