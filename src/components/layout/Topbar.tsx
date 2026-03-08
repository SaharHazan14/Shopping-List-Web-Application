interface TopbarProps {
  email?: string;
  onLogout?: () => void;
}

export default function Topbar({ email, onLogout }: TopbarProps) {
  return (
    <div
      style={{
        height: "60px",
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <h3>Dashboard</h3>

      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <span>{email ?? "User"}</span>
        <button onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}