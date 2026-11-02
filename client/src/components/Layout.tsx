import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isUser = user.role === "USER";

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  }

  function isActive(path: string) {
    return location.pathname === path;
  }

  function isTicketsActive() {
    return (
      location.pathname === "/tickets" ||
      (
        location.pathname.startsWith("/tickets/") &&
        location.pathname !== "/tickets/new"
      )
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold">
            Smart IT Helpdesk
          </h1>

          <p className="text-sm text-slate-400 mt-1">
            Ticket Management
          </p>
        </div>

        <div className="p-4">
          {/* User Card */}
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <p className="font-medium">
              {user.name || "User"}
            </p>

            <p className="text-sm text-slate-400">
              {user.email}
            </p>

            <span className="inline-block mt-2 text-xs bg-slate-700 px-2 py-1 rounded">
              {user.role}
            </span>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <Link
              to="/dashboard"
              className={`block px-4 py-3 rounded-lg transition ${
                isActive("/dashboard")
                  ? "bg-blue-600 text-white"
                  : "text-slate-200 hover:bg-slate-800"
              }`}
            >
              Dashboard
            </Link>

            <Link
              to="/tickets"
              className={`block px-4 py-3 rounded-lg transition ${
                isTicketsActive()
                  ? "bg-blue-600 text-white"
                  : "text-slate-200 hover:bg-slate-800"
              }`}
            >
              Tickets
            </Link>

            {/* USER เท่านั้นที่สร้าง Ticket ได้ */}
            {isUser && (
              <Link
                to="/tickets/new"
                className={`block px-4 py-3 rounded-lg transition ${
                  isActive("/tickets/new")
                    ? "bg-blue-600 text-white"
                    : "text-slate-200 hover:bg-slate-800"
                }`}
              >
                New Ticket
              </Link>
            )}
          </nav>
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 w-full p-4">
          <button
            onClick={logout}
            className="w-full border border-slate-700 text-slate-300 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <p className="text-sm text-slate-500">
            Smart IT Helpdesk System
          </p>

          <div className="text-sm">
            <span className="font-medium text-slate-800">
              {user.name}
            </span>

            <span className="text-slate-400 ml-2">
              ({user.role})
            </span>
          </div>
        </header>

        {/* Page */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}