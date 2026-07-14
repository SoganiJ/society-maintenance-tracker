import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintService } from '../services/complaintService';
import { useToast } from '../context/ToastContext';
import ImageDropzone from '../components/ImageDropzone';
import WifiLoader from '../components/WifiLoader';

const CATEGORIES = ['Plumbing', 'Electrical', 'Housekeeping', 'Security', 'Structural', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const initialForm = { title: '', description: '', category: CATEGORIES[0], priority: 'medium' };

const RaiseComplaint = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      images.forEach((file) => data.append('images', file));

      const res = await complaintService.create(data);
      const complaintId = res.data.complaint._id;
      
      // Fetch meantime suggestion
      let advice = 'The maintenance team will look into it shortly.';
      try {
        const suggestRes = await complaintService.suggestCategory({
          title: form.title,
          description: form.description,
        });
        advice = suggestRes.suggestion || suggestRes.data?.suggestion || advice;
      } catch (err) {
        // Ignore error
      }
      
      setSuccessData({ complaintId, advice });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to raise complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="card stack gap-3" style={{ maxWidth: 640, textAlign: 'center', margin: '0 auto', padding: 'var(--space-6)' }}>
        <div style={{ fontSize: '3rem', color: 'var(--status-resolved)' }}>✅</div>
        <h2>Complaint Raised Successfully!</h2>
        <div style={{ padding: 'var(--space-4)', background: 'var(--accent-soft)', borderRadius: '12px', textAlign: 'left' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            💡 AI Advice for the meantime:
          </h4>
          <p style={{ marginTop: '10px', fontSize: '1.05rem', lineHeight: '1.5' }}>{successData.advice}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate(`/complaints/${successData.complaintId}`, { replace: true })} style={{ marginTop: 'var(--space-4)' }}>
          View Complaint Details
        </button>
      </div>
    );
  }

  return (
    <div className="page-centered-sm">
      <h1 style={{ marginBottom: 'var(--space-5)' }}>Raise a complaint</h1>

      <form onSubmit={handleSubmit} className="card stack gap-1">
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            className="input"
            placeholder="e.g. Water leakage in B wing corridor"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            className="textarea"
            placeholder="Describe the issue in detail..."
            value={form.description}
            onChange={handleChange}
            required
            rows={4}
          />
        </div>

        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-3)' }}>
          <div className="row gap-3" style={{ flex: 1 }}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                className="select"
                value={form.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <ImageDropzone files={images} onChange={setImages} />

        {error && (
          <p className="field-error" style={{ marginBottom: 'var(--space-3)' }}>
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 'var(--space-4)' }}>
          {submitting ? <WifiLoader /> : 'Submit complaint'}
        </button>
      </form>
    </div>
  );
};

export default RaiseComplaint;
