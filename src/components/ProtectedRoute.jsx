import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "./Loader.jsx";

function useLoaderVisible(loading) {
  const [visible, setVisible] = useState(loading);

  useEffect(() => {
    if (loading) {
      setVisible(true);
      return undefined;
    }
    if (!visible) return undefined;
    const timeout = window.setTimeout(() => setVisible(false), 150);
    return () => window.clearTimeout(timeout);
  }, [loading, visible]);

  return visible;
}

export function ProtectedRoute() {
  const { user, loading, roleLoading } = useAuth();
  const isLoading = loading || (Boolean(user) && roleLoading);
  const loaderVisible = useLoaderVisible(isLoading);
  if (!loading && !user) return <Navigate to="/login" replace />;
  return (
    <>
      {!isLoading && <Outlet />}
      {loaderVisible && <Loader fadeOut={!isLoading} />}
    </>
  );
}

export function AdminRoute() {
  const { role, loading, roleLoading } = useAuth();
  const isLoading = loading || roleLoading;
  const loaderVisible = useLoaderVisible(isLoading);
  if (!isLoading && role !== "admin") return <Navigate to="/shop" replace />;
  return (
    <>
      {!isLoading && <Outlet />}
      {loaderVisible && <Loader fadeOut={!isLoading} />}
    </>
  );
}
