// frontend/src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './ui/Spinner';

export default function ProtectedRoute({ requiredRole }) {
  const { user, loading, token } = useAuth();

  if (loading) return <Spinner />;
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to correct dashboard instead of unauthorized
    if (user.role === 'super_admin') {
      return <Navigate to="/super-admin" replace />;
    }
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
   if (user.role === 'customer') {
  return <Navigate to="/" replace />;   // ← was /customer
}
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}