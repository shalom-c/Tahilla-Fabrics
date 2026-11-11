import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AdminRoute, ProtectedRoute } from "./components/ProtectedRoute.jsx";
import Loader from "./components/Loader.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import WelcomePage from "./pages/WelcomePage.jsx";

const ShopPage = lazy(() => import("./pages/ShopPage.jsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.jsx"));
const LoginPage = lazy(() =>
  import("./pages/AuthPages.jsx").then((pages) => ({ default: pages.LoginPage })),
);
const SignupPage = lazy(() =>
  import("./pages/AuthPages.jsx").then((pages) => ({ default: pages.SignupPage })),
);
const AdminLoginPage = lazy(() =>
  import("./pages/AuthPages.jsx").then((pages) => ({ default: pages.AdminLoginPage })),
);

function AppRoutes() {
  const location = useLocation();

  return (
    <div className="route-transition" key={location.pathname}>
      <Suspense fallback={<div className="route-loading"><Loader size="sm" /></div>}>
        <Routes location={location}>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<Navigate to="/shop" replace />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
