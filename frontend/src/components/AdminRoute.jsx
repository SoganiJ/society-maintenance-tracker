import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard that restricts access to admin-only routes.
 * Wrap admin pages inside <Route element={<AdminRoute />}>.
 * Residents are silently redirected to the dashboard.
 */
const AdminRoute = () => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
