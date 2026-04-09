import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AuthCallback from "./pages/AuthCallback";
import PrivateRoute from "./components/PrivateRoute";
import Dashboard from "./pages/Dashboard";
import ListPage from "./pages/ListPage.tsx";
import ItemsPage from "./pages/ItemsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/lists/:listId"
          element={
            <PrivateRoute>
              <ListPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/items"
          element={
            <PrivateRoute>
              <ItemsPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}