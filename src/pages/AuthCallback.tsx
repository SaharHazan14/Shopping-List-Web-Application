import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Authenticating...");
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      setMessage("Authorization code missing. Redirecting...");
      setTimeout(() => navigate("/", { replace: true }), 1200);
      return;
    }

    async function exchangeCode() {
      try {
        setMessage("Exchanging authorization code...");
        const resp = await api.post("/auth/exchange", { code });
        const { accessToken, refreshToken, idToken } = resp.data;

        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        if (idToken) localStorage.setItem("idToken", idToken);

        setMessage("Authenticated — redirecting...");
        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error(err);
        setMessage("Authentication failed. Redirecting...");
        setTimeout(() => navigate("/", { replace: true }), 1500);
      }
    }

    exchangeCode();
  }, [navigate]);

  return <div>{message}</div>;
}