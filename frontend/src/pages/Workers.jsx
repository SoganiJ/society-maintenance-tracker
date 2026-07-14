import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { useToast } from '../context/ToastContext';
import WifiLoader from '../components/WifiLoader';
import { FiTrash2, FiPlus, FiPhone, FiMessageCircle, FiUser, FiTool } from 'react-icons/fi';

const Workers = () => {
  const { addToast } = useToast();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', skills: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchWorkers = async () => {
    try {
      const res = await adminService.getWorkers();
      setWorkers(res.data);
    } catch (err) {
      addToast('error', 'Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      };
      await adminService.createWorker(payload);
      addToast('success', 'Worker added successfully');
      setForm({ name: '', phone: '', skills: '', notes: '' });
      setShowForm(false);
      fetchWorkers();
    } catch (err) {
      addToast('error', 'Failed to add worker');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this worker?')) return;
    try {
      await adminService.deleteWorker(id);
      addToast('success', 'Worker removed');
      fetchWorkers();
    } catch (err) {
      addToast('error', 'Failed to delete worker');
    }
  };

  return (
    <div className="stack gap-4">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Worker Directory</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>{workers.length} worker{workers.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <FiPlus size={16} style={{ marginRight: 6 }} />
          {showForm ? 'Cancel' : 'Add Worker'}
        </button>
      </div>

      {/* Add Worker Form — collapsible */}
      {showForm && (
        <div className="card" style={{ border: '2px solid var(--primary)', background: 'var(--surface)' }}>
          <h3 style={{ margin: '0 0 var(--space-3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiPlus size={18} /> New Worker
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Full Name *</label>
                <input name="name" className="input" placeholder="e.g. Ramesh Kumar" value={form.name} onChange={handleChange} required />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Phone Number *</label>
                <input name="phone" className="input" placeholder="e.g. 919876543210" value={form.phone} onChange={handleChange} required />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Skills (comma separated)</label>
                <input name="skills" className="input" placeholder="e.g. Plumber, Electrician" value={form.skills} onChange={handleChange} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Notes (optional)</label>
                <input name="notes" className="input" placeholder="e.g. Available on weekends" value={form.notes} onChange={handleChange} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Save Worker'}
            </button>
          </form>
        </div>
      )}

      {/* Worker List */}
      {loading ? (
        <WifiLoader label="Loading workers..." />
      ) : workers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
          <FiUser size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }} />
          <h3>No workers yet</h3>
          <p className="text-secondary">Add your first worker to get started with assignments.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 'var(--space-3)' }}>
            <FiPlus size={16} style={{ marginRight: 6 }} /> Add First Worker
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3" style={{ gap: 'var(--space-3)' }}>
          {workers.map((w) => (
            <div key={w._id} className="worker-card">
              {/* Header: name + phone + delete */}
              <div className="worker-card-header">
                <div>
                  <p className="worker-name">{w.name}</p>
                  <a href={`tel:${w.phone}`} className="worker-phone">{w.phone}</a>
                </div>
                <button 
                  className="worker-delete" 
                  onClick={() => handleDelete(w._id)} 
                  title="Remove Worker"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>

              {/* Main: skills + notes */}
              <div className="worker-card-main">
                {w.skills?.length > 0 && (
                  <div className="worker-skills">
                    <FiTool size={13} style={{ color: 'var(--text-muted)', marginRight: 4, flexShrink: 0 }} />
                    {w.skills.map((s, i) => (
                      <span key={i} className="worker-skill-tag">{s}</span>
                    ))}
                  </div>
                )}
                {w.notes && (
                  <p className="worker-notes">{w.notes}</p>
                )}
              </div>

              {/* Footer: action buttons */}
              <div className="worker-card-footer">
                <a
                  href={`tel:${w.phone}`}
                  className="worker-action worker-action-call"
                >
                  <FiPhone size={14} /> Call
                </a>
                <a
                  href={`https://wa.me/${w.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="worker-action worker-action-whatsapp"
                >
                  <FiMessageCircle size={14} /> WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Workers;
