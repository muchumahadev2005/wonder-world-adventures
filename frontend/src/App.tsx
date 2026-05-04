import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChildProvider, useChild } from "@/context/ChildContext";
import LoginPage from "./pages/LoginPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import HomePage from "./pages/HomePage";
import GamesPage from "./pages/GamesPage";
import StoriesPage from "./pages/StoriesPage";
import ChatPage from "./pages/ChatPage";
import ParentsPage from "./pages/ParentsPage";
import LearnPage from "./pages/LearnPage";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useChild();
  if (!isLoggedIn) return <Navigate to="/signup" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isLoggedIn } = useChild();
  return (
    <>
      <Routes>
        <Route path="/signin" element={isLoggedIn ? <Navigate to="/" replace /> : <SignInPage />} />
        <Route path="/signup" element={isLoggedIn ? <Navigate to="/" replace /> : <SignUpPage />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/games" element={<ProtectedRoute><GamesPage /></ProtectedRoute>} />
        <Route path="/stories" element={<ProtectedRoute><StoriesPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/parents" element={<ProtectedRoute><ParentsPage /></ProtectedRoute>} />
        <Route path="/learn" element={<ProtectedRoute><LearnPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {isLoggedIn && <BottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ChildProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ChildProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
