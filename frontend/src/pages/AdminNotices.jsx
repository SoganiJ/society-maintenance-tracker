import { useEffect, useState, useCallback } from 'react';
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiSpeaker,
  FiMapPin,
} from 'react-icons/fi';
import { noticeService } from '../services/noticeService';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import WifiLoader from '../components/WifiLoader';

const NOTICE_TYPES = [
  { value: '', label: 'All' },
  { value: 'pinned', label: 'Pinned' },
  { value: 'important', label: 'Important' },
  { value: 'general', label: 'General' },
];

const EMPTY_FORM = {
  title: '',
  content: '',
  type: 'general',
  isPinned: false,
  expiresAt: '',
};

const AdminNotices = () => {
  const toast = useToast();
  const [notices, setNotices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchNotices = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await noticeService.list({
        page: params.page || 1,
        limit: 12,
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

  const openCreate = () => {
    setEditingNotice(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (notice) => {
    setEditingNotice(notice);
    setForm({
      title: notice.title,
      content: notice.content,
      type: notice.type,
      isPinned: notice.isPinned,
      expiresAt: notice.expiresAt ? notice.expiresAt.slice(0, 16) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        expiresAt: form.expiresAt || null,
      };

      if (editingNotice) {
        await noticeService.update(editingNotice._id, payload);
        toast.success('Notice updated');
      } else {
        await noticeService.create(payload);
        toast.success('Notice created');
      }
      setModalOpen(false);
      fetchNotices({ page: pagination.page, type, search });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await noticeService.remove(deleteTarget._id);
      toast.success('Notice deleted');
      setDeleteTarget(null);
      fetchNotices({ page: pagination.page, type, search });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
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

  return (
    <div>
      <div
        className="row"
        style={{ justifyContent: 'space-between', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}
      >
        <div>
          <h1>Manage Notices</h1>
          <p className="text-secondary">Create and manage society announcements</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <FiPlus size={16} /> New Notice
        </button>
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

      {/* Notice list */}
      {loading ? (
        <WifiLoader label="Loading notices…" />
      ) : notices.length === 0 ? (
        <EmptyState
          icon={<FiSpeaker />}
          title="No notices yet"
          description="Create your first notice to communicate with residents."
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
              <FiPlus size={14} /> Create Notice
            </button>
          }
        />
      ) : (
        <div>
          <div className="stack gap-3">
            {notices.map((notice) => (
              <div key={notice._id} className={`card card-signal notice-type-${notice.type}`}>
                <div
                  className="row"
                  style={{ justifyContent: 'space-between', gap: 'var(--space-3)' }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
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
                        maxWidth: 520,
                      }}
                    >
                      {notice.content}
                    </p>
                    <div className="row gap-3 text-muted" style={{ marginTop: 6, fontSize: '0.75rem' }}>
                      <span>{formatDate(notice.createdAt)}</span>
                      {notice.expiresAt && <span>Expires: {formatDate(notice.expiresAt)}</span>}
                    </div>
                  </div>

                  <div className="row gap-2" style={{ flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => openEdit(notice)}
                      aria-label="Edit notice"
                    >
                      <FiEdit2 size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => setDeleteTarget(notice)}
                      aria-label="Delete notice"
                      style={{ color: 'var(--status-overdue)' }}
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-5)' }}>
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              onPageChange={(p) => fetchNotices({ page: p, type, search })}
            />
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingNotice ? 'Edit Notice' : 'Create Notice'}
        width={560}
      >
        <form onSubmit={handleSubmit} className="stack gap-4" style={{ paddingTop: 'var(--space-2)' }}>
          <div className="field">
            <label htmlFor="notice-title">Title</label>
            <input
              id="notice-title"
              className="input"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              maxLength={150}
              placeholder="Notice title"
            />
          </div>

          <div className="field">
            <label htmlFor="notice-content">Content</label>
            <textarea
              id="notice-content"
              className="textarea"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              maxLength={3000}
              placeholder="Write the notice content…"
              rows={6}
            />
          </div>

          <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: '1 1 160px' }}>
              <label htmlFor="notice-type">Type</label>
              <select
                id="notice-type"
                className="select"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="general">General</option>
                <option value="important">Important</option>
                <option value="pinned">Pinned</option>
              </select>
            </div>

            <div className="field" style={{ flex: '1 1 200px' }}>
              <label htmlFor="notice-expires">Expires at (optional)</label>
              <input
                id="notice-expires"
                className="input"
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
          </div>

          <div className="row gap-3">
            <label className="toggle-label row gap-2" style={{ cursor: 'pointer' }}>
              <span
                className={`toggle-track${form.isPinned ? ' toggle-active' : ''}`}
                onClick={() => setForm({ ...form, isPinned: !form.isPinned })}
                role="switch"
                aria-checked={form.isPinned}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setForm({ ...form, isPinned: !form.isPinned });
                  }
                }}
              >
                <span className="toggle-thumb" />
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Pin this notice</span>
            </label>
          </div>

          <div className="row gap-3" style={{ justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting
                ? 'Saving…'
                : editingNotice
                  ? 'Update Notice'
                  : 'Create Notice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Notice"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default AdminNotices;
