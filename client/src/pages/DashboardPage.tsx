import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router";

import { api } from "../api/client";

type Stats = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
};

type Ticket = {
  id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;

  createdBy: {
    id: number;
    name: string;
  };

  assignedTo: {
    id: number;
    name: string;
  } | null;
};

export default function DashboardPage() {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const [stats, setStats] =
    useState<Stats>({
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
    });

  const [recentTickets, setRecentTickets] =
    useState<Ticket[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadDashboard() {
    try {
      setError("");

      const [
        statsResponse,
        ticketsResponse,
      ] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/tickets"),
      ]);

      setStats(statsResponse.data);

      setRecentTickets(
        ticketsResponse.data.slice(0, 5)
      );
    } catch (error) {
      console.error(error);

      setError(
        "ไม่สามารถโหลดข้อมูล Dashboard ได้"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const completed =
    stats.resolved + stats.closed;

  const completionRate =
    stats.total === 0
      ? 0
      : Math.round(
          (completed / stats.total) *
            100
        );

  if (loading) {
    return (
      <div className="text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="text-slate-500 mt-1">
          ยินดีต้อนรับ {user.name}
        </p>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 mt-8">
        <StatCard
          label="Total Tickets"
          value={stats.total}
          description="Tickets ทั้งหมด"
        />

        <StatCard
          label="Open"
          value={stats.open}
          description="รอการดำเนินการ"
        />

        <StatCard
          label="In Progress"
          value={stats.inProgress}
          description="กำลังดำเนินการ"
        />

        <StatCard
          label="Resolved"
          value={stats.resolved}
          description="แก้ไขเรียบร้อย"
        />

        <StatCard
          label="Closed"
          value={stats.closed}
          description="ปิด Ticket แล้ว"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        {/* Status Overview */}
        <section className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Ticket Overview
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                ภาพรวมสถานะ Ticket
              </p>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">
                {completionRate}%
              </p>

              <p className="text-xs text-slate-400">
                Completion
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-6">
            <StatusProgress
              label="Open"
              value={stats.open}
              total={stats.total}
            />

            <StatusProgress
              label="In Progress"
              value={stats.inProgress}
              total={stats.total}
            />

            <StatusProgress
              label="Resolved"
              value={stats.resolved}
              total={stats.total}
            />

            <StatusProgress
              label="Closed"
              value={stats.closed}
              total={stats.total}
            />
          </div>
        </section>

        {/* System Status */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            System Status
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            สถานะระบบปัจจุบัน
          </p>

          <div className="mt-6 space-y-4">
            <SystemRow
              label="API Server"
              value="Online"
            />

            <SystemRow
              label="Database"
              value="Connected"
            />

            <SystemRow
              label="Authentication"
              value="Active"
            />

            <SystemRow
              label="Current Role"
              value={user.role}
            />
          </div>
        </section>
      </div>

      {/* Recent Tickets */}
      <section className="bg-white border border-slate-200 rounded-2xl mt-6 overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Tickets
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Ticket ล่าสุดในระบบ
            </p>
          </div>

          <Link
            to="/tickets"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            View all →
          </Link>
        </div>

        {recentTickets.length === 0 ? (
          <div className="border-t border-slate-200 p-8 text-center text-slate-400">
            ยังไม่มี Ticket
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left px-6 py-4">
                    ID
                  </th>

                  <th className="text-left px-6 py-4">
                    Issue
                  </th>

                  <th className="text-left px-6 py-4">
                    Priority
                  </th>

                  <th className="text-left px-6 py-4">
                    Status
                  </th>

                  <th className="text-left px-6 py-4">
                    Assigned
                  </th>

                  <th className="text-left px-6 py-4">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentTickets.map(
                  (ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 text-slate-500">
                        #{ticket.id}
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600"
                        >
                          {ticket.title}
                        </Link>

                        <p className="text-xs text-slate-400 mt-1">
                          โดย{" "}
                          {ticket.createdBy.name}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <PriorityBadge
                          priority={
                            ticket.priority
                          }
                        />
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge
                          status={
                            ticket.status
                          }
                        />
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {ticket.assignedTo
                          ?.name ||
                          "Unassigned"}
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {new Date(
                          ticket.createdAt
                        ).toLocaleDateString(
                          "th-TH"
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="text-3xl font-bold text-slate-900 mt-3">
        {value}
      </p>

      <p className="text-xs text-slate-400 mt-2">
        {description}
      </p>
    </div>
  );
}

function StatusProgress({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percent =
    total === 0
      ? 0
      : Math.round(
          (value / total) * 100
        );

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-slate-700">
          {label}
        </span>

        <span className="text-slate-500">
          {value} ({percent}%)
        </span>
      </div>

      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}

function SystemRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full" />

        <span className="text-sm font-medium text-slate-700">
          {value}
        </span>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<
    string,
    string
  > = {
    OPEN:
      "bg-blue-50 text-blue-700",
    IN_PROGRESS:
      "bg-amber-50 text-amber-700",
    RESOLVED:
      "bg-green-50 text-green-700",
    CLOSED:
      "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
        styles[status] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  const styles: Record<
    string,
    string
  > = {
    LOW:
      "bg-slate-100 text-slate-600",
    MEDIUM:
      "bg-blue-50 text-blue-700",
    HIGH:
      "bg-orange-50 text-orange-700",
    CRITICAL:
      "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
        styles[priority] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {priority}
    </span>
  );
}