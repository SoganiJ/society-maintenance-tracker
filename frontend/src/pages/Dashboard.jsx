import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import ComplaintCard from '../components/ComplaintCard';
import WifiLoader from '../components/WifiLoader';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';

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

  // Colors mapping for charts
  const COLORS = {
    Open: '#ef4444',        // using typical red or from theme
    'In Progress': '#f59e0b', // typical orange
    Resolved: '#10b981',    // typical green
  };

  const statusData = [
    { name: 'Open', value: stats?.byStatus?.open || 0, color: 'var(--status-open)' },
    { name: 'In Progress', value: stats?.byStatus?.in_progress || 0, color: 'var(--status-in_progress)' },
    { name: 'Resolved', value: stats?.byStatus?.resolved || 0, color: 'var(--status-resolved)' },
  ];

  const categoryData = stats?.byCategory 
    ? Object.keys(stats.byCategory).map(key => ({ name: key, count: stats.byCategory[key] })) 
    : [];

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1>Dashboard</h1>
        <p className="text-secondary">Welcome back, {user?.name}</p>
      </div>

      {user?.role === 'admin' ? (
        // Admin Dashboard Stats Layout
        <div style={{ marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          {/* Overdue Card with Exclamation Mark */}
          <div 
            className="card card-signal status-overdue stat-card" 
            style={{ 
              position: 'relative', 
              overflow: 'hidden', 
              flex: '1', 
              minWidth: '200px', 
              maxWidth: '300px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="text-muted" style={{ fontWeight: 600 }}>Overdue Complaints</span>
              <div className="stat-value" style={{ fontSize: '3rem', color: 'var(--status-overdue)' }}>{stats?.overdue || 0}</div>
            </div>
            {/* Faint Exclamation Background */}
            <div 
              style={{
                position: 'absolute',
                top: '-20px',
                right: '10px',
                fontSize: '10rem',
                fontWeight: 900,
                color: 'var(--status-overdue)',
                opacity: 0.1,
                lineHeight: 1,
                userSelect: 'none',
                pointerEvents: 'none'
              }}
            >
              !
            </div>
          </div>

          {/* Charts Section */}
          <div className="card" style={{ flex: '2', minWidth: '400px', display: 'flex', gap: 'var(--space-4)' }}>
            <div style={{ flex: '1', height: '200px' }}>
              <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Complaints by Status</h4>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {categoryData.length > 0 && (
              <div style={{ flex: '1.5', height: '200px' }}>
                <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Complaints by Category</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }}
                      cursor={{ fill: 'var(--bg)' }}
                    />
                    <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Resident Dashboard Stats Layout
        <div className="grid grid-cols-4" style={{ marginBottom: 'var(--space-6)' }}>
          {cards.map((c) => (
            <div key={c.key} className={`card card-signal ${c.signal} stat-card`}>
              <span className="text-muted">{c.label}</span>
              <span className="stat-value">{c.value}</span>
            </div>
          ))}
        </div>
      )}

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
