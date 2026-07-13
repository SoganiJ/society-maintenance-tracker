import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

/**
 * Reusable modal component.
 * Renders a centered overlay with a card; closes on Escape or backdrop click.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - title: string
 *  - children: content
 *  - width: optional max-width (default 520px)
 */
const Modal = ({ isOpen, onClose, title, children, width = 520 }) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleBackdropClick}>
      <div className="modal-content card" style={{ maxWidth: width }}>
        <div className="modal-header row" style={{ justifyContent: 'space-between' }}>
          <h3>{title}</h3>
          <button
            type="button"
            className="btn btn-icon btn-ghost"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
