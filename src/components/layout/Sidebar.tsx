import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <div
      style={{
        width: "240px",
        background: "#1f2937",
        color: "white",
        padding: "20px",
        height: "100vh",
      }}
    >
      <h2 style={{ marginBottom: "30px" }}>Shopping App</h2>

      <nav style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <NavLink to="/dashboard" style={{ color: "white", textDecoration: "none" }}>
          Dashboard
        </NavLink>

        <NavLink to="/lists" style={{ color: "white", textDecoration: "none" }}>
          My Lists
        </NavLink>

        <NavLink to="/profile" style={{ color: "white", textDecoration: "none" }}>
          Profile
        </NavLink>
      </nav>
    </div>
  );
}