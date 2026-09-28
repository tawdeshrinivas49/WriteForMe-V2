import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import About from "./pages/About";
import Community from "./pages/Community";
import HallOfFame from "./pages/HallOfFame";
import Donate from "./pages/Donate";
import Organisations from "./pages/Organisations";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Sitemap from "./pages/Sitemap";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";

// Protected / authenticated pages
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Matching from "./pages/Matching";
import Admin from "./pages/Admin";
import Request from "./pages/Request";
import Waiting from "./pages/Waiting";
import Match from "./pages/Match";
import Emergency from "./pages/Emergency";
import Profile from "./pages/Profile";
import Payment from "./pages/Payment";

class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-primary text-white rounded">
            Return to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* ── Public routes ─────────────────────────────────── */}
            <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/community" element={<Community />} />
          <Route path="/hall-of-fame" element={<HallOfFame />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/organisations" element={<Organisations />} />
          <Route path="/sitemap" element={<Sitemap />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* ── Protected routes (require login) ──────────────── */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/dashboard"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer/dashboard"
            element={
              <ProtectedRoute allowedRoles={["VOLUNTEER"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency"
            element={
              <ProtectedRoute>
                <Emergency />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/request"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <Request />
              </ProtectedRoute>
            }
          />
          <Route
            path="/waiting"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <Waiting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/match"
            element={
              <ProtectedRoute>
                <Match />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matching"
            element={
              <ProtectedRoute allowedRoles={["VOLUNTEER"]}>
                <Matching />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/:requestId"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* ── Fallback ──────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
