import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AdminRoute, ProtectedRoute } from "./components/ProtectedRoute.jsx";
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
const VerifyEmailPage = lazy(() =>
  import("./pages/AuthPages.jsx").then((pages) => ({ default: pages.VerifyEmailPage })),
);
const AdminLoginPage = lazy(() =>
  import("./pages/AuthPages.jsx").then((pages) => ({ default: pages.AdminLoginPage })),
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
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
    </BrowserRouter>
  );
}
