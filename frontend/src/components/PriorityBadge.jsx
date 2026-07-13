const PriorityBadge = ({ priority }) => (
  <span
    className={`badge-priority-${priority}`}
    style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}
  >
    {priority}
  </span>
);

export default PriorityBadge;
