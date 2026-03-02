import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

function makeRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Authenticating...");
  const ranRef = useRef(false);

  console.log("[AuthCallback] render");

  useEffect(() => {
    if (ranRef.current) {
      console.log("[AuthCallback] effect already ran in this mount, skipping");
      return;
    }
    ranRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    console.group("[AuthCallback] start");
    console.log("Parsed query params:", Object.fromEntries(params.entries()));

    if (!code) {
      console.error("[AuthCallback] Authorization code not found in URL");
      setMessage("Authorization code missing. Redirecting to home...");
      setTimeout(() => navigate("/", { replace: true }), 1200);
      console.groupEnd();
      return;
    }

    const exchangedKey = `oauth_exchanged_${code}`;
    const exchangingKey = `oauth_exchanging_${code}`;
    const requestIdKey = `oauth_request_id_${code}`;

    // If we've already completed exchange for this code, skip and go to dashboard
    if (localStorage.getItem(exchangedKey) === "true") {
      console.log("[AuthCallback] code already exchanged previously, skipping exchange");
      window.history.replaceState({}, document.title, "/dashboard");
      navigate("/dashboard", { replace: true });
      console.groupEnd();
      return;
    }

    // Prevent duplicate exchanges across StrictMode double-mounts by using sessionStorage
    if (sessionStorage.getItem(exchangingKey) === "1") {
      console.log("[AuthCallback] exchange already in progress for this code — skipping duplicate attempt");
      setMessage("Waiting for authentication to finish...");
      console.groupEnd();
      return;
    }

    // Mark exchange in progress
    sessionStorage.setItem(exchangingKey, "1");

    // Ensure we send the same requestId for retries during this tab/session
    let requestId = sessionStorage.getItem(requestIdKey);
    if (!requestId) {
      requestId = makeRequestId();
      sessionStorage.setItem(requestIdKey, requestId);
    }

    async function exchangeCode() {
      console.log("[AuthCallback] exchanging code for tokens", { code, requestId });
      setMessage("Exchanging authorization code for tokens...");
      try {
        const resp = await api.post("/auth/exchange", { code, requestId });

        console.log("[AuthCallback] /auth/exchange response status:", resp.status);
        console.log("[AuthCallback] response data:", resp.data);

        const { accessToken, refreshToken, idToken } = resp.data || {};

        if (!accessToken) {
          throw new Error("No accessToken in response");
        }

        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        if (idToken) localStorage.setItem("idToken", idToken);

        // Mark as exchanged so future mounts won't retry
        localStorage.setItem(exchangedKey, "true");
        sessionStorage.removeItem(exchangingKey);

        console.log("[AuthCallback] Tokens stored. Navigating to dashboard.");
        setMessage("Authenticated — redirecting to dashboard...");

        // Clean URL (remove querystring) and navigate
        window.history.replaceState({}, document.title, "/dashboard");
        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("[AuthCallback] Exchange failed:", err);
        sessionStorage.removeItem(exchangingKey);
        setMessage("Authentication failed. Redirecting to home...");
        // Keep verbose error info in console, then go home
        setTimeout(() => navigate("/", { replace: true }), 1500);
      } finally {
        console.groupEnd();
      }
    }

    exchangeCode();
  }, [navigate]);

  return <div>{message}</div>;
}