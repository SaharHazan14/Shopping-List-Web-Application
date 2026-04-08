import { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../api/user";
import type { CurrentUser } from "../types/user";

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      } finally {
        setUserLoading(false);
      }
    }

    fetchCurrentUser();
  }, []);

  const username = useMemo(() => {
    if (!currentUser?.email) return "User";
    const [namePart] = currentUser.email.split("@");
    return namePart || currentUser.email;
  }, [currentUser]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Shopping List</h1>
      <p>{userLoading ? "Loading user..." : `Welcome, ${username}`}</p>
    </div>
  );
}
