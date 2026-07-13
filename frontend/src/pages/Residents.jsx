import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiShield,
} from 'react-icons/fi';
import { adminService } from '../services/adminService';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import WifiLoader from '../components/WifiLoader';

const Residents = () => {
  const toast = useToast();
  const [residents, setResidents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Toggle confirm
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const fetchResidents = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await adminService.getResidents({
        page: params.page || 1,
        limit: 15,
        search: params.search || undefined,
        isActive: params.isActive || undefined,
      });
      setResidents(res.data.residents);
      setPagination(res.data.pagination);
    } catch {
      setResidents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResidents({ page: 1, search, isActive: activeFilter });
  }, [fetchResidents, search, activeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const requestToggleActive = (resident) => {
    setConfirmAction({
      resident,
      action: 'toggleActive',
      newValue: !resident.isActive,
    });
  };

  const requestToggleRole = (resident) => {
    setConfirmAction({
      resident,
      action: 'toggleRole',
      newValue: resident.role === 'admin' ? 'resident' : 'admin',
    });
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setConfirming(true);
    try {
      const { resident, action, newValue } = confirmAction;
      const payload =
        action === 'toggleActive' ? { isActive: newValue } : { role: newValue };

      await adminService.updateResident(resident._id, payload);

      toast.success(
        action === 'toggleActive'
          ? `${resident.name} ${newValue ? 'activated' : 'deactivated'}`
          : `${resident.name} is now ${newValue}`
      );

      setConfirmAction(null);
      fetchResidents({ page: pagination.page, search, isActive: activeFilter });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setConfirming(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getConfirmMessage = () => {
    if (!confirmAction) return '';
    const { resident, action, newValue } = confirmAction;
    if (action === 'toggleActive') {
      return newValue
        ? `Activate ${resident.name}? They will regain access to the portal.`
        : `Deactivate ${resident.name}? They will lose access to the portal but their data will be preserved.`;
    }
    return `Change ${resident.name}'s role to ${newValue}?`;
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <h1>Manage Residents</h1>
        <p className="text-secondary">View and manage society members</p>
      </div>

      {/* Filters */}
      <div
        className="row gap-3"
        style={{ marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}
      >
        <form onSubmit={handleSearch} className="row gap-2" style={{ flex: '1 1 240px' }}>
          <div
            className="row gap-2"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 14px',
              flex: 1,
            }}
          >
            <FiSearch size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by name, email, flat…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
        </form>

        <div className="row gap-2">
          {[
            { value: '', label: 'All' },
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ].map((f) => (
            <button
              key={f.value}
              type="button"
              className={`btn btn-sm${activeFilter === f.value ? ' btn-primary' : ''}`}
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Residents Table */}
      {loading ? (
        <WifiLoader label="Loading residents…" />
      ) : residents.length === 0 ? (
        <EmptyState
          icon={<FiUsers />}
          title="No residents found"
          description="No residents match your current filters."
        />
      ) : (
        <div>
          {/* Desktop table */}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Flat</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {residents.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <Link
                        to={`/residents/${r._id}`}
                        style={{ fontWeight: 600, color: 'var(--accent)' }}
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td>{r.flatNumber}</td>
                    <td>
                      <span className="text-secondary" style={{ fontSize: '0.8125rem' }}>
                        {r.email}
                      </span>
                    </td>
                    <td>{r.phone || '—'}</td>
                    <td>
                      <span
                        className={`badge ${r.role === 'admin' ? 'badge-notice-pinned' : 'badge-notice-general'}`}
                      >
                        {r.role}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${r.isActive ? 'badge-resolved' : 'badge-closed'}`}
                      >
                        {r.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.8125rem' }}>
                      {formatDate(r.createdAt)}
                    </td>
                    <td>
                      <div className="row gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => requestToggleActive(r)}
                          title={r.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {r.isActive ? (
                            <FiUserX size={15} color="var(--status-overdue)" />
                          ) : (
                            <FiUserCheck size={15} color="var(--status-resolved)" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => requestToggleRole(r)}
                          title={`Make ${r.role === 'admin' ? 'resident' : 'admin'}`}
                        >
                          <FiShield
                            size={15}
                            color={r.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)'}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 'var(--space-5)' }}>
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              onPageChange={(p) =>
                fetchResidents({ page: p, search, isActive: activeFilter })
              }
            />
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title="Confirm Action"
        message={getConfirmMessage()}
        confirmLabel="Confirm"
        variant={
          confirmAction?.action === 'toggleActive' && !confirmAction?.newValue
            ? 'danger'
            : 'primary'
        }
        loading={confirming}
      />
    </div>
  );
};

export default Residents;
