const labels = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const StatusBadge = ({ status, overdue }) => {
  if (overdue && (status === 'open' || status === 'in_progress')) {
    return <span className="badge badge-overdue">Overdue</span>;
  }
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
};

export default StatusBadge;
