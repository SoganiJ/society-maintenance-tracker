import WifiLoader from '../components/WifiLoader';

/**
 * Temporary landing page — proves the design system (tokens, buttons,
 * cards, badges, loader) is wired correctly before Auth/Navbar/Sidebar/
 * Dashboard replace this in later steps.
 */
const Home = () => {
  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1>Dashboard</h1>
        <p className="text-secondary">Overview of society complaints and activity</p>
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card card-signal status-open stat-card">
          <span className="text-muted">Open complaints</span>
          <span className="stat-value">12</span>
          <span className="badge badge-open">Open</span>
        </div>
        <div className="card card-signal status-in_progress stat-card">
          <span className="text-muted">In progress</span>
          <span className="stat-value">5</span>
          <span className="badge badge-in_progress">In Progress</span>
        </div>
        <div className="card card-signal status-resolved stat-card">
          <span className="text-muted">Resolved this month</span>
          <span className="stat-value">34</span>
          <span className="badge badge-resolved">Resolved</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Buttons</h3>
        <div className="row gap-3">
          <button className="btn btn-primary">Raise Complaint</button>
          <button className="btn">Secondary</button>
          <button className="btn btn-ghost">Ghost</button>
          <button className="btn btn-danger">Delete</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Loader</h3>
        <WifiLoader label="Fetching complaints..." />
      </div>
    </div>
  );
};

export default Home;
