import StatusBadge from './StatusBadge';

const formatDate = (d) =>
  new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const Timeline = ({ history }) => {
  if (!history?.length) {
    return <p className="text-muted">No history yet.</p>;
  }

  return (
    <div className="stack gap-4">
      {history.map((entry, i) => (
        <div key={entry._id} className="row gap-3" style={{ alignItems: 'flex-start' }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--accent)',
              marginTop: 6,
              flexShrink: 0,
              opacity: i === history.length - 1 ? 1 : 0.4,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div className="row gap-2">
              <StatusBadge status={entry.status} />
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                {formatDate(entry.createdAt)}
              </span>
            </div>
            {entry.note && (
              <p style={{ fontSize: '0.875rem', marginTop: 4 }}>{entry.note}</p>
            )}
            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 2 }}>
              {entry.actor?.name} ({entry.actor?.role})
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
