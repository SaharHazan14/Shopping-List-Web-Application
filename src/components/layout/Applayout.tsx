import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useEffect, useState } from "react";
import { api } from "../../api/client";

export default function AppLayout() {
  const [email, setEmail] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("idToken");
    window.location.href = "/";
  };

  useEffect(() => {
    let mounted = true;

    async function fetchMe() {
      try {
        const resp = await api.get("/user/me");
        if (mounted && resp?.data?.email) {
          setEmail(resp.data.email);
        }
      } catch (err) {
        // ignore — Topbar will show fallback
        console.error("[AppLayout] failed to load user info:", err);
      }
    }

    fetchMe();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ display: "flex", background: "#f5f6f8" }}>
      <Sidebar />

      <div style={{ flex: 1 }}>
        <Topbar email={email ?? "User"} onLogout={handleLogout} />
        <div style={{ padding: "20px" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}