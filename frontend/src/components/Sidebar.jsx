import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiMessageSquare,
  FiSpeaker,
  FiUser,
  FiUsers,
  FiSettings,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const residentLinks = [
  { to: '/', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/complaints', label: 'Complaints', icon: FiMessageSquare },
  { to: '/notices', label: 'Notices', icon: FiSpeaker },
  { to: '/profile', label: 'Profile', icon: FiUser },
];

const adminLinks = [
  { to: '/', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/complaints', label: 'Complaints', icon: FiMessageSquare },
  { to: '/residents', label: 'Residents', icon: FiUsers },
  { to: '/admin/notices', label: 'Notices', icon: FiSpeaker },
  { to: '/settings', label: 'Settings', icon: FiSettings },
];

const Sidebar = () => {
  const { user } = useAuth();
  const links = user?.role === 'admin' ? adminLinks : residentLinks;

  return (
    <aside
      className="stack"
      style={{
        width: 'var(--sidebar-width)',
        borderRight: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: 'var(--space-5) var(--space-3)',
        gap: '2px',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '0.9375rem',
          padding: 'var(--space-2) var(--space-3) var(--space-5)',
        }}
      >
        Society MT
      </div>

      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `row gap-3${isActive ? ' sidebar-link-active' : ''}`}
          style={({ isActive }) => ({
            padding: '9px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            background: isActive ? 'var(--accent-soft)' : 'transparent',
          })}
        >
          <Icon size={17} />
          {label}
        </NavLink>
      ))}
    </aside>
  );
};

export default Sidebar;
