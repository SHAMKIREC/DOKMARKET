import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="fixed inset-0 flex items-center justify-center"><div className="w-9 h-9 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/Login" replace state={{ from: location }} />;
  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) return <Navigate to="/Forbidden" replace />;
  return children;
}
