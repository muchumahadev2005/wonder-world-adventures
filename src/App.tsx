import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChildProvider, useChild } from "@/context/ChildContext";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import GamesPage from "./pages/GamesPage";
import StoriesPage from "./pages/StoriesPage";
import ChatPage from "./pages/ChatPage";
import ParentsPage from "./pages/ParentsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useChild();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isLoggedIn } = useChild();
  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/games" element={<ProtectedRoute><GamesPage /></ProtectedRoute>} />
      <Route path="/stories" element={<ProtectedRoute><StoriesPage /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/parents" element={<ProtectedRoute><ParentsPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
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
