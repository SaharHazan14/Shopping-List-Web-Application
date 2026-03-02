export default function Dashboard() {
  // get tokens from localStorage (or wherever you stored them)
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/"; // go back to welcome page
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Dashboard</h1>
      <p>Access Token:</p>
      <pre style={{ whiteSpace: "break-spaces", maxHeight: 200, overflow: "auto" }}>
        {accessToken}
      </pre>
      <p>Refresh Token:</p>
      <pre style={{ whiteSpace: "break-spaces", maxHeight: 200, overflow: "auto" }}>
        {refreshToken}
      </pre>
      <button onClick={handleLogout} style={{ marginTop: "1rem" }}>
        Logout
      </button>
    </div>
  );
}