export default function WelcomePage() {
  const handleLogin = () => {
    const loginUrl = import.meta.env.VITE_COGNITO_LOGIN_URL;
    if (!loginUrl) {
        return console.error("Cognito login URL not set");
    }

    window.location.href = loginUrl;
  };

  return (
    <div style={containerStyle}>
      <h1>Welcome to Shopping List</h1>
      <button style={buttonStyle} onClick={handleLogin}>
        Login
      </button>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "sans-serif",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 20px",
  fontSize: "16px",
  cursor: "pointer",
};