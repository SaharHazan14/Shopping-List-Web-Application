import { Routes, Route, Navigate } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import ListPage from "./pages/ListPage";
import type { JSX } from "react";

function RequireAuth({ children }: { children: JSX.Element }) {
  // Minimal protection: check for stored access token
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    console.log("[RequireAuth] No access token found — redirecting to welcome");
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      {/* Keep the callback route public and top-level so no global redirect interferes */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Dashboard renders without the global AppLayout (no sidebar/topbar) */}
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/list/:listId" element={<RequireAuth><ListPage /></RequireAuth>} />
    </Routes>
  );
}