import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@/store/useUser";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Optional: restrict to specific roles */
  allowedRoles?: string[];
}

/**
 * Wraps any route that requires authentication.
 * Unauthenticated users are redirected to /login with a `from` param
 * so they can be sent back after login.
 */
const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, token } = useUser();
  const location = useLocation();

  // Not logged in at all → redirect to login
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
