import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  userType?: 'employer' | 'jobseeker' | 'admin';
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, userType }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (userType && user.role !== userType) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default PrivateRoute; 