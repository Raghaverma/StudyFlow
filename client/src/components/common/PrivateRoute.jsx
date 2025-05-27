import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/auth';

function PrivateRoute({ children }) {
  const { user, token, initialize } = useAuthStore();
  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }
  return children ? children : <Outlet />;
}

export default PrivateRoute; 