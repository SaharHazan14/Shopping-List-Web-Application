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
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
      <p className="text-base font-medium text-slate-700">Redirecting to login...</p>
      <p className="text-base font-medium text-slate-700">
        If you are not redirected automatically, <a href={loginUrl} className="underline">click here</a>.
      </p>
    </div>
  );
}