import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "./Loader.jsx";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function AdminRoute() {
  const { user, role, loading } = useAuth();
  if (loading) return <Loader />;
  return user && role === "admin" ? <Outlet /> : <Navigate to="/login" replace />;
}
