/*
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
*/

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface User {
  id: number;
  cognitoSub: string;
  email: string;
}

interface ShoppingList {
  id: number;
  title: string;
  description: string | null;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const me = await apiFetch<User>("/user/me");
        const myLists = await apiFetch<ShoppingList[]>("/list");

        setUser(me);
        setLists(myLists);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const totalLists = lists.length;

  return (
    <div>
      <h2>Welcome, {user?.email}</h2>

      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <div style={{ padding: "10px", background: "white", flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h4>Total Lists</h4>
          <p>{totalLists}</p>
        </div>
        <div style={{ padding: "10px", background: "white", flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h4>Total Items</h4>
          <p>0</p>
        </div>
        <div style={{ padding: "10px", background: "white", flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h4>Completed %</h4>
          <p>0%</p>
        </div>
      </div>

      <h3 style={{ marginTop: "40px" }}>Your Lists</h3>
      <table style={{ width: "100%", marginTop: "10px", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <thead>
          <tr>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Title</th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {lists.map((list) => (
            <tr key={list.id}>
              <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{list.title}</td>
              <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{list.description ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}