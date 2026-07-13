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
        <div className="grid grid-cols-2" style={{ gap: 'var(--space-3)' }}>
          {workers.map((w) => (
            <div key={w._id} className="card" style={{ position: 'relative', padding: 'var(--space-4)' }}>
              {/* Delete button */}
              <button 
                className="btn btn-icon btn-ghost" 
                onClick={() => handleDelete(w._id)} 
                title="Remove Worker"
                style={{ position: 'absolute', top: '12px', right: '12px' }}
              >
                <FiTrash2 color="var(--status-overdue)" size={16} />
              </button>

              {/* Worker info */}
              <div className="row gap-3" style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0
                }}>
                  {w.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{w.name}</h3>
                  <p className="text-secondary" style={{ margin: 0, fontSize: '0.85rem' }}>{w.phone}</p>
                </div>
              </div>

              {/* Skills */}
              {w.skills?.length > 0 && (
                <div className="row gap-1" style={{ flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                  <FiTool size={14} style={{ color: 'var(--text-muted)', marginRight: 4 }} />
                  {w.skills.map((s, i) => (
                    <span key={i} className="badge badge-info" style={{ fontSize: '0.75rem' }}>{s}</span>
                  ))}
                </div>
              )}

              {/* Notes */}
              {w.notes && (
                <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: 'var(--space-3)', fontStyle: 'italic' }}>
                  {w.notes}
                </p>
              )}

              {/* Action Buttons */}
              <div className="row gap-2" style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)' }}>
                <a
                  href={`tel:${w.phone}`}
                  className="btn btn-sm"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <FiPhone size={14} /> Call
                </a>
                <a
                  href={`https://wa.me/${w.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: '#25D366', color: '#fff', border: 'none' }}
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
