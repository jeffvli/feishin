import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from 'renderer/store';

interface AuthOutletProps {
  redirectTo: string;
}

export const AuthOutlet = ({ redirectTo }: AuthOutletProps) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={redirectTo} />;
  }

  return <Outlet />;
};
