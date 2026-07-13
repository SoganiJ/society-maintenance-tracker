import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div
      className="row"
      style={{
        minHeight: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'var(--space-5)',
      }}
    >
      <div style={{ position: 'absolute', top: 'var(--space-5)', right: 'var(--space-5)' }}>
        <ThemeToggle />
      </div>
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <Link to="/" style={{ display: 'block', marginBottom: 'var(--space-5)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            Society Maintenance Tracker
          </span>
        </Link>
        <h2 style={{ marginBottom: 'var(--space-1)' }}>{title}</h2>
        {subtitle && (
          <p className="text-secondary" style={{ marginBottom: 'var(--space-5)' }}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
