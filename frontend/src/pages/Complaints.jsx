import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import ComplaintCard from '../components/ComplaintCard';
import WifiLoader from '../components/WifiLoader';

const STATUS_OPTIONS = ['', 'open', 'in_progress', 'resolved', 'closed'];
const PRIORITY_OPTIONS = ['', 'low', 'medium', 'high', 'urgent'];

const Complaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await complaintService.list({
        ...filters,
        page: pagination.page,
        limit: 10,
      });
      setComplaints(res.data.complaints);
      setPagination(res.data.pagination);
      setLoading(false);
    };
    const debounce = setTimeout(load, 300);
    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const updateFilter = (key, value) => {
    setPagination((p) => ({ ...p, page: 1 }));
    setFilters((f) => ({ ...f, [key]: value }));
  };

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
        <h1>Complaints</h1>
        {user?.role !== 'admin' && (
          <Link to="/raise-complaint" className="btn btn-primary btn-sm">
            Raise complaint
          </Link>
        )}
      </div>

      <div className="card row gap-3" style={{ marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="Search complaints..."
          style={{ flex: '1 1 200px' }}
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
        />
        <select
          className="select"
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s ? s.replace('_', ' ') : 'All statuses'}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={filters.priority}
          onChange={(e) => updateFilter('priority', e.target.value)}
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p || 'All priorities'}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <WifiLoader label="Loading complaints..." />
      ) : complaints.length === 0 ? (
        <div className="card empty-state">
          <p>No complaints match these filters.</p>
        </div>
      ) : (
        <div className="stack gap-3">
          {complaints.map((c) => (
            <ComplaintCard key={c._id} complaint={c} />
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="row gap-2" style={{ justifyContent: 'center', marginTop: 'var(--space-5)' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`btn btn-sm${p === pagination.page ? ' btn-primary' : ''}`}
              onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Complaints;
