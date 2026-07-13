/**
 * Reusable empty state placeholder.
 *
 * Props:
 *  - icon: React element (optional)
 *  - title: string
 *  - description: string (optional)
 *  - action: React element (optional CTA button)
 */
const EmptyState = ({ icon, title, description, action }) => {
  return (
    <div className="card empty-state">
      {icon && (
        <div style={{ fontSize: '2rem', color: 'var(--text-muted)', opacity: 0.6 }}>{icon}</div>
      )}
      <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-secondary)' }}>{title}</p>
      {description && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: 360 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 'var(--space-2)' }}>{action}</div>}
    </div>
  );
};

export default EmptyState;
