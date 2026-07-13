import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WifiLoader from './WifiLoader';

/**
 * Usage:
 *   <ProtectedRoute><Dashboard /></ProtectedRoute>
 *   <ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>
 */
const ProtectedRoute = ({ children, roles }) => {
  const { user, initializing, isAuthenticated } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <WifiLoader overlay label="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
