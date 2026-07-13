import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

const ComplaintCard = ({ complaint }) => {
  const signalClass = complaint.isOverdue ? 'status-overdue' : `status-${complaint.status}`;

  return (
    <Link to={`/complaints/${complaint._id}`} style={{ display: 'block' }}>
      <div className={`card card-signal card-interactive ${signalClass}`}>
        <div className="row" style={{ justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{complaint.title}</p>
            <p className="text-muted" style={{ fontSize: '0.8125rem', marginTop: 2 }}>
              {complaint.category} · Raised by {complaint.raisedBy?.name || 'Resident'}
              {complaint.raisedBy?.flatNumber ? ` (${complaint.raisedBy.flatNumber})` : ''}
            </p>
          </div>
          <div className="row gap-3" style={{ flexShrink: 0 }}>
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} overdue={complaint.isOverdue} />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ComplaintCard;
