import { FiAlertTriangle } from 'react-icons/fi';
import Modal from './Modal';

/**
 * Reusable confirmation dialog for destructive actions.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - onConfirm: () => void
 *  - title: string (default: 'Are you sure?')
 *  - message: string
 *  - confirmLabel: string (default: 'Confirm')
 *  - variant: 'danger' | 'primary' (default: 'danger')
 *  - loading: boolean
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width={420}>
      <div className="stack gap-5" style={{ paddingTop: 'var(--space-2)' }}>
        <div className="row gap-3">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: variant === 'danger' ? 'var(--status-overdue-soft)' : 'var(--accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FiAlertTriangle
              size={20}
              color={variant === 'danger' ? 'var(--status-overdue)' : 'var(--accent)'}
            />
          </div>
          <p className="text-secondary" style={{ fontSize: '0.9375rem', lineHeight: 1.55 }}>
            {message}
          </p>
        </div>

        <div className="row gap-3" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-sm" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn btn-sm ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
