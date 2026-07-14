import { useEffect, useState } from 'react';
import {
  FiPlus,
  FiX,
  FiSave,
  FiDownload,
  FiSettings as FiSettingsIcon,
} from 'react-icons/fi';
import { adminService } from '../services/adminService';
import { useToast } from '../context/ToastContext';
import WifiLoader from '../components/WifiLoader';

const Settings = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [overdueDays, setOverdueDays] = useState(5);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminService.getSettings();
        const s = res.data.settings;
        setOverdueDays(s.overdueDays || 5);
        setCategories(s.categories || []);
      } catch (err) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddCategory = (e) => {
    e.preventDefault();
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      toast.error('Category already exists');
      return;
    }
    setCategories([...categories, trimmed]);
    setNewCategory('');
  };

  const handleRemoveCategory = (cat) => {
    if (categories.length <= 1) {
      toast.error('At least one category is required');
      return;
    }
    setCategories(categories.filter((c) => c !== cat));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.updateSettings({ overdueDays, categories });
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await adminService.exportComplaints({});
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `complaints_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch {
      toast.error('Failed to export');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <WifiLoader overlay label="Loading settings…" />;

  return (
    <div className="page-centered-sm">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1>System Settings</h1>
        <p className="text-secondary">Configure global application settings</p>
      </div>

      {/* Overdue Days */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Overdue Configuration</h3>
        <div className="field">
          <label htmlFor="overdue-days">
            Days before a complaint is marked overdue
          </label>
          <div className="row gap-3">
            <input
              id="overdue-days"
              className="input"
              type="number"
              min={1}
              max={90}
              value={overdueDays}
              onChange={(e) => setOverdueDays(Number(e.target.value))}
              style={{ width: 120 }}
            />
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>
              days
            </span>
          </div>
          <p className="text-muted" style={{ fontSize: '0.8125rem', marginTop: 4 }}>
            Complaints in &quot;open&quot; or &quot;in progress&quot; status will be
            automatically flagged as overdue after this many days.
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Complaint Categories</h3>
        <div className="tag-list" style={{ marginBottom: 'var(--space-4)' }}>
          {categories.map((cat) => (
            <span key={cat} className="tag">
              {cat}
              <button
                type="button"
                className="tag-remove"
                onClick={() => handleRemoveCategory(cat)}
                aria-label={`Remove ${cat}`}
              >
                <FiX size={13} />
              </button>
            </span>
          ))}
        </div>
        <form onSubmit={handleAddCategory} className="row gap-2">
          <input
            className="input"
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            maxLength={50}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-sm btn-primary">
            <FiPlus size={14} /> Add
          </button>
        </form>
      </div>

      {/* Export */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Data Export</h3>
        <p className="text-secondary" style={{ fontSize: '0.9375rem', marginBottom: 'var(--space-3)' }}>
          Download all complaints as a CSV file for reporting and analysis.
        </p>
        <button
          type="button"
          className="btn btn-sm"
          onClick={handleExport}
          disabled={exporting}
        >
          <FiDownload size={15} />
          {exporting ? 'Exporting…' : 'Export Complaints CSV'}
        </button>
      </div>

      {/* Save */}
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          <FiSave size={16} />
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
