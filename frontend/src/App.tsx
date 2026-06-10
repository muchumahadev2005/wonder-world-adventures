import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChildProvider, useChild } from "@/context/ChildContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginPage from "./pages/LoginPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import HomePage from "./pages/HomePage";
import GamesPage from "./pages/GamesPage";
import StoriesPage from "./pages/StoriesPage";
import ChatPage from "./pages/ChatPage";
import ParentsPage from "./pages/ParentsPage";
import LearnPage from "./pages/LearnPage";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";

// Admin Pages
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StoriesAdmin from "./pages/admin/StoriesAdmin";
import LanguagesAdmin from "./pages/admin/LanguagesAdmin";
import LessonsAdmin from "./pages/admin/LessonsAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import SubscriptionsAdmin from "./pages/admin/SubscriptionsAdmin";
import PaymentsAdmin from "./pages/admin/PaymentsAdmin";
import AnalyticsAdmin from "./pages/admin/AnalyticsAdmin";
import SettingsAdmin from "./pages/admin/SettingsAdmin";

import { ADMIN_EMAIL } from "./lib/adminApi";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const { profile } = useChild();
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (!profile) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Admin-only route guard — checks email
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (user?.email !== ADMIN_EMAIL) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();
  const { profile } = useChild();

  // Hide BottomNav for admin users
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <>
      <Routes>
        {/* ── Auth ─────────────────────────────── */}
        <Route path="/signin" element={isAuthenticated && !isAdmin ? <Navigate to="/" replace /> : <SignInPage />} />
        <Route path="/signup" element={isAuthenticated && !isAdmin ? <Navigate to="/" replace /> : <SignUpPage />} />
        <Route path="/login" element={!isAuthenticated ? <Navigate to="/signin" replace /> : profile ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* ── Child App ─────────────────────────── */}
        <Route path="/dashboard" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/games" element={<ProtectedRoute><GamesPage /></ProtectedRoute>} />
        <Route path="/stories" element={<ProtectedRoute><StoriesPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/parents" element={<ProtectedRoute><ParentsPage /></ProtectedRoute>} />
        <Route path="/learn" element={<ProtectedRoute><LearnPage /></ProtectedRoute>} />

        {/* ── Admin ─────────────────────────────── */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={isAuthenticated && user?.email === ADMIN_EMAIL ? <Navigate to="/admin/dashboard" replace /> : <AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/stories" element={<AdminRoute><StoriesAdmin /></AdminRoute>} />
        <Route path="/admin/languages" element={<AdminRoute><LanguagesAdmin /></AdminRoute>} />
        <Route path="/admin/lessons" element={<AdminRoute><LessonsAdmin /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UsersAdmin /></AdminRoute>} />
        <Route path="/admin/subscriptions" element={<AdminRoute><SubscriptionsAdmin /></AdminRoute>} />
        <Route path="/admin/payments" element={<AdminRoute><PaymentsAdmin /></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><AnalyticsAdmin /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><SettingsAdmin /></AdminRoute>} />

        {/* ── 404 ──────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Hide bottom nav on admin and unauth pages */}
      {isAuthenticated && profile && !isAdmin && <BottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ChildProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ChildProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
