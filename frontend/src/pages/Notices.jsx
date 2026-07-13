import { useEffect, useState, useCallback } from 'react';
import { FiSearch, FiSpeaker } from 'react-icons/fi';
import { noticeService } from '../services/noticeService';
import NoticeCard from '../components/NoticeCard';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import WifiLoader from '../components/WifiLoader';

const NOTICE_TYPES = [
  { value: '', label: 'All' },
  { value: 'pinned', label: 'Pinned' },
  { value: 'important', label: 'Important' },
  { value: 'general', label: 'General' },
];

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchNotices = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await noticeService.list({
        page: params.page || 1,
        limit: 10,
        type: params.type || undefined,
        search: params.search || undefined,
      });
      setNotices(res.data.notices);
      setPagination(res.data.pagination);
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices({ page: 1, type, search });
  }, [fetchNotices, type, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handlePageChange = (newPage) => {
    fetchNotices({ page: newPage, type, search });
  };

  // Separate pinned notices for the hero section (only on first page with no filters)
  const pinnedNotices =
    !type && !search && pagination.page === 1
      ? notices.filter((n) => n.isPinned)
      : [];
  const regularNotices =
    !type && !search && pagination.page === 1
      ? notices.filter((n) => !n.isPinned)
      : notices;

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <h1>Notice Board</h1>
        <p className="text-secondary">Stay updated with society announcements</p>
      </div>

      {/* Filters bar */}
      <div
        className="row gap-3"
        style={{
          marginBottom: 'var(--space-5)',
          flexWrap: 'wrap',
        }}
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
              placeholder="Search notices…"
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
          {NOTICE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`btn btn-sm${type === t.value ? ' btn-primary' : ''}`}
              onClick={() => setType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <WifiLoader label="Loading notices…" />
      ) : notices.length === 0 ? (
        <EmptyState
          icon={<FiSpeaker />}
          title="No notices"
          description="There are no notices to display right now."
        />
      ) : (
        <div>
          {/* Pinned section */}
          {pinnedNotices.length > 0 && (
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>📌 Pinned</h3>
              <div className="stack gap-3">
                {pinnedNotices.map((n) => (
                  <NoticeCard key={n._id} notice={n} />
                ))}
              </div>
            </div>
          )}

          {/* Regular notices */}
          {regularNotices.length > 0 && (
            <div>
              {pinnedNotices.length > 0 && (
                <h3 style={{ marginBottom: 'var(--space-3)' }}>Recent</h3>
              )}
              <div className="stack gap-3">
                {regularNotices.map((n) => (
                  <NoticeCard key={n._id} notice={n} />
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 'var(--space-5)' }}>
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Notices;
