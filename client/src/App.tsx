import type { ReactNode } from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TicketsPage from "./pages/TicketsPage";
import NewTicketPage from "./pages/NewTicketPage";
import TicketDetailPage from "./pages/TicketDetailPage";

function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}
function UserOnlyRoute({
  children,
}: {
  children: ReactNode;
}) {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  if (user.role !== "USER") {
    return (
      <Navigate
        to="/tickets"
        replace
      />
    );
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Login */}
      <Route
        path="/"
        element={<LoginPage />}
      />

      {/* Protected pages */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/tickets"
          element={<TicketsPage />}
        />

        <Route
         path="/tickets/new"
        element={
          <UserOnlyRoute>
          <NewTicketPage />
          </UserOnlyRoute>
         }
        />
        <Route
          path="/tickets/:id"
          element={<TicketDetailPage />}
        />
      </Route>

      {/* Unknown URL */}
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}