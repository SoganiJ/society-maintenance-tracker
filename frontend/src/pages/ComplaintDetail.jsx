import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { complaintService } from '../services/complaintService';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import Timeline from '../components/Timeline';
import WifiLoader from '../components/WifiLoader';

const STATUS_FLOW = ['open', 'in_progress', 'resolved'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];

const ComplaintDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await complaintService.getById(id);
      setComplaint(res.data.complaint);
      setHistory(res.data.history);
      setSelectedPriority(res.data.complaint.priority);
      setSelectedWorkerId(res.data.complaint.assignedTo?._id || '');

      if (user?.role === 'admin') {
        try {
          const workerRes = await adminService.getWorkers();
          setWorkers(workerRes.data);
        } catch (err) {
          console.error('Failed to load workers', err);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isResolved = complaint?.status === 'resolved' || complaint?.status === 'closed';
  const isAdminUser = user?.role === 'admin';

  const handleStatusChange = async (status) => {
    setUpdating(true);
    try {
      await complaintService.updateStatus(id, status, note);
      setNote('');
      await load();
      toast.success('Status updated successfully!');
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleOverdue = async () => {
    setUpdating(true);
    try {
      await complaintService.toggleOverdue(id);
      await load();
      toast.success(complaint.isOverdue ? 'Overdue flag removed' : 'Flagged as overdue');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle overdue flag');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignWorker = async () => {
    if (!selectedWorkerId) return;
    setUpdating(true);
    try {
      await complaintService.assignComplaint(id, null, selectedWorkerId);
      toast.success('Worker assigned successfully!');
      
      const assignedWorker = workers.find(w => w._id === selectedWorkerId);
      if (assignedWorker && assignedWorker.phone) {
        window.open(getWhatsappLink(assignedWorker), '_blank');
      }

      await load();
    } catch (err) {
      toast.error('Failed to assign worker');
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityChange = async (e) => {
    const newPriority = e.target.value;
    setSelectedPriority(newPriority);
    setUpdating(true);
    try {
      await complaintService.assignComplaint(id, newPriority, null);
      toast.success('Priority updated successfully!');
      await load();
    } catch (err) {
      toast.error('Failed to update priority');
      setSelectedPriority(complaint.priority);
    } finally {
      setUpdating(false);
    }
  };

  const handleSummarize = async () => {
    setSummarizing(true);
    try {
      const res = await complaintService.summarizeDescription({
        title: complaint.title,
        description: complaint.description,
      });
      setAiSummary(res.data?.summary || res.summary || 'Could not generate summary.');
    } catch (err) {
      toast.error('Failed to generate AI summary');
    } finally {
      setSummarizing(false);
    }
  };

  const getWhatsappLink = (worker) => {
    if (!worker || !worker.phone) return '#';
    const cleanPhone = worker.phone.replace(/[^0-9]/g, '');
    const flat = complaint.raisedBy?.flatNumber ? ` Flat ${complaint.raisedBy.flatNumber}` : '';
    const message = `Hello ${worker.name},\nThere is a new ${complaint.category} issue at${flat}.\nTitle: ${complaint.title}\nDescription: ${complaint.description}\nPlease check.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  if (loading) return <WifiLoader overlay label="Loading complaint..." />;
  if (!complaint) return <p>Complaint not found.</p>;

  return (
    <div>
      <Link to="/complaints" className="text-secondary" style={{ fontSize: '0.875rem' }}>
        ← Back to complaints
      </Link>

      <div className="row" style={{ justifyContent: 'space-between', margin: 'var(--space-3) 0 var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>{complaint.title}</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
            {complaint.category} · Raised by {complaint.raisedBy?.name}
            {complaint.raisedBy?.flatNumber ? ` (${complaint.raisedBy.flatNumber})` : ''}
          </p>
        </div>
        <div className="row gap-3">
          <PriorityBadge priority={complaint.priority} />
          <StatusBadge status={complaint.status} overdue={complaint.isOverdue} />
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ alignItems: 'start' }}>
        {/* LEFT COLUMN */}
        <div className="stack gap-4">
          {/* Description */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-3)' }}>Description</h3>
            <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{complaint.description}</p>

            {/* AI Summarize Button — only for admin, only before resolved */}
            {isAdminUser && !isResolved && (
              <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)' }}>
                {!aiSummary ? (
                  <button 
                    className="btn btn-sm" 
                    onClick={handleSummarize} 
                    disabled={summarizing}
                    style={{ 
                      gap: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {summarizing ? (
                      <>
                        <span className="ai-loader" style={{ transform: 'scale(0.5)', marginRight: 4 }}>
                          <span className="ai-loader-dot"></span>
                          <span className="ai-loader-dot"></span>
                          <span className="ai-loader-dot"></span>
                        </span>
                        Summarizing...
                      </>
                    ) : (
                      <>✨ AI Summarize</>
                    )}
                  </button>
                ) : (
                  <div style={{ padding: 'var(--space-3)', background: 'var(--accent-soft)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>✨</span>
                      <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>AI Summary</strong>
                    </div>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{aiSummary}</p>
                  </div>
                )}
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <button 
                    className="btn btn-sm" 
                    onClick={handleToggleOverdue} 
                    disabled={updating}
                    style={{ 
                      background: complaint.isOverdue ? 'var(--surface)' : '#fee2e2', 
                      color: complaint.isOverdue ? 'var(--text-secondary)' : '#dc2626', 
                      border: complaint.isOverdue ? '1px solid var(--border)' : '1px solid #f87171'
                    }}
                  >
                    {complaint.isOverdue ? 'Remove Overdue Flag' : '🚨 Flag as Overdue'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Photos */}
          {complaint.images?.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: 'var(--space-3)' }}>Photos</h3>
              <div className="grid grid-cols-3" style={{ gap: 'var(--space-2)' }}>
                {complaint.images.map((img) => (
                  <img
                    key={img.publicId}
                    src={img.url}
                    alt={complaint.title}
                    style={{
                      width: '100%',
                      height: 100,
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Admin Controls — ONLY shown when not resolved */}
          {isAdminUser && !isResolved && (
            <div className="card stack gap-4">
              <h3 style={{ margin: 0 }}>Update Details</h3>

              <div className="field">
                <label>Change Priority</label>
                <select className="select" value={selectedPriority} onChange={handlePriorityChange} disabled={updating}>
                  {PRIORITY_OPTIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Status Note (optional)</label>
                <textarea
                  className="textarea"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add context for this status update..."
                  rows={2}
                />
              </div>
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                {STATUS_FLOW.map((s) => (
                  <button
                    key={s}
                    className={`btn btn-sm${s === complaint.status ? ' btn-primary' : ''}`}
                    disabled={updating || s === complaint.status}
                    onClick={() => handleStatusChange(s)}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resolved banner */}
          {isResolved && (
            <div className="card" style={{ background: 'var(--accent-soft)', borderLeft: '4px solid var(--status-resolved)', textAlign: 'center' }}>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--status-resolved)' }}>✅ This complaint has been resolved</p>
              {complaint.resolvedAt && (
                <p className="text-secondary" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                  Resolved on {new Date(complaint.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="stack gap-4">
          {/* Worker Assignment — only for admin, only when not resolved */}
          {isAdminUser && !isResolved && (
            <div className="card" style={{ border: '2px solid var(--primary)', background: 'var(--surface)' }}>
              <h3 style={{ margin: '0 0 var(--space-3)' }}>Worker Assignment</h3>

              <div className="stack gap-3">
                <div className="row gap-2" style={{ alignItems: 'flex-end' }}>
                  <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Assign to Worker</label>
                    <select
                      className="select"
                      value={selectedWorkerId}
                      onChange={(e) => setSelectedWorkerId(e.target.value)}
                    >
                      <option value="">Select a worker...</option>
                      {workers.map(w => (
                        <option key={w._id} value={w._id}>
                          {w.name} {w.skills?.length > 0 ? `(${w.skills.join(', ')})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedWorkerId !== (complaint.assignedTo?._id || '') && (
                    <button className="btn btn-primary" onClick={handleAssignWorker} disabled={updating || !selectedWorkerId}>
                      Assign
                    </button>
                  )}
                </div>

                {complaint.assignedTo && (
                  <div style={{ padding: '12px', background: 'var(--accent-soft)', borderRadius: '8px' }}>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>Assigned to:</strong> {complaint.assignedTo.name}
                      </div>
                      <div className="row gap-2">
                        {complaint.assignedTo.phone && (
                          <a href={`tel:${complaint.assignedTo.phone}`} className="btn btn-sm" style={{ background: 'var(--surface)' }}>
                            📞 Call
                          </a>
                        )}
                        <a
                          href={getWhatsappLink(complaint.assignedTo)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm"
                          style={{ backgroundColor: '#25D366', color: '#fff', border: 'none' }}
                        >
                          💬 WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Timeline</h3>
            <Timeline history={history} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;
