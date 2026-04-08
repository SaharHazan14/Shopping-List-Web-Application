import { useEffect, useRef } from "react";

export default function LoginPage() {
  const domain = import.meta.env.VITE_COGNITO_DOMAIN;
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_COGNITO_REDIRECT_URI;
  const scope = import.meta.env.VITE_COGNITO_SCOPE;
  const redirectedRef = useRef(false);

  const loginUrl = `https://${domain}/login?client_id=${clientId}&response_type=code&scope=${encodeURIComponent(
    scope
  )}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  useEffect(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    window.location.replace(loginUrl);
  }, [loginUrl]);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>Redirecting to login...</h1>
      <p>
        If you are not redirected automatically, <a href={loginUrl}>click here</a>.
      </p>
    </div>
  );
}