import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';

interface AuthOutletProps {
  redirectTo: string;
}

export const AuthOutlet = ({ redirectTo }: AuthOutletProps) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);

  if (isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={redirectTo} />;
  }

  return <Outlet />;
};
