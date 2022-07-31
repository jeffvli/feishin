import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';

interface PrivateOutletProps {
  redirectTo: string;
}

export const PrivateOutlet = ({ redirectTo }: PrivateOutletProps) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Outlet />;
  }

  return <Navigate replace state={{ from: location }} to={redirectTo} />;
};
