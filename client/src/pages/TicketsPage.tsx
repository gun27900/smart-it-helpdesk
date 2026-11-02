import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router";

import { api } from "../api/client";

type Ticket = {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;

  createdBy: {
    id: number;
    name: string;
    email?: string;
  };

  assignedTo: {
    id: number;
    name: string;
  } | null;

  _count?: {
    comments: number;
  };
};

export default function TicketsPage() {
  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isUser =
    currentUser.role === "USER";

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [priority, setPriority] =
    useState("");

  const [category, setCategory] =
    useState("");

  async function loadTickets(
    customParams?: {
      search?: string;
      status?: string;
      priority?: string;
      category?: string;
    }
  ) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      const searchValue =
        customParams?.search ??
        search;

      const statusValue =
        customParams?.status ??
        status;

      const priorityValue =
        customParams?.priority ??
        priority;

      const categoryValue =
        customParams?.category ??
        category;

      if (searchValue.trim()) {
        params.append(
          "search",
          searchValue.trim()
        );
      }

      if (statusValue) {
        params.append(
          "status",
          statusValue
        );
      }

      if (priorityValue) {
        params.append(
          "priority",
          priorityValue
        );
      }

      if (categoryValue) {
        params.append(
          "category",
          categoryValue
        );
      }

      const query =
        params.toString();

      const response =
        await api.get(
          query
            ? `/tickets?${query}`
            : "/tickets"
        );

      setTickets(response.data);
    } catch (error) {
      console.error(error);

      setError(
        "ไม่สามารถโหลด Ticket ได้"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets({
      search: "",
      status,
      priority,
      category,
    });
  }, [
    status,
    priority,
    category,
  ]);

  function handleSearch(
    e: React.FormEvent
  ) {
    e.preventDefault();

    loadTickets();
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setPriority("");
    setCategory("");

    loadTickets({
      search: "",
      status: "",
      priority: "",
      category: "",
    });
  }

  const hasFilters =
    search ||
    status ||
    priority ||
    category;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Tickets
          </h1>

          <p className="text-slate-500 mt-1">
            จัดการคำร้องและปัญหา IT Support
          </p>
        </div>

        {isUser && (
          <Link
            to="/tickets/new"
            className="inline-flex items-center justify-center bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-slate-800 transition"
          >
            + New Ticket
          </Link>
        )}
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className="bg-white border border-slate-200 rounded-2xl p-4 mt-7"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="ค้นหา Ticket..."
            className="border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          />

          <select
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value
              )
            }
            className="border border-slate-300 rounded-xl px-4 py-3 text-sm bg-white"
          >
            <option value="">
              All Status
            </option>

            <option value="OPEN">
              Open
            </option>

            <option value="IN_PROGRESS">
              In Progress
            </option>

            <option value="RESOLVED">
              Resolved
            </option>

            <option value="CLOSED">
              Closed
            </option>
          </select>

          <select
            value={priority}
            onChange={(e) =>
              setPriority(
                e.target.value
              )
            }
            className="border border-slate-300 rounded-xl px-4 py-3 text-sm bg-white"
          >
            <option value="">
              All Priority
            </option>

            <option value="LOW">
              Low
            </option>

            <option value="MEDIUM">
              Medium
            </option>

            <option value="HIGH">
              High
            </option>

            <option value="CRITICAL">
              Critical
            </option>
          </select>

          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }
            className="border border-slate-300 rounded-xl px-4 py-3 text-sm bg-white"
          >
            <option value="">
              All Category
            </option>

            <option value="HARDWARE">
              Hardware
            </option>

            <option value="SOFTWARE">
              Software
            </option>

            <option value="NETWORK">
              Network
            </option>

            <option value="ACCOUNT">
              Account
            </option>

            <option value="OTHER">
              Other
            </option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:bg-blue-700 transition"
            >
              Search
            </button>

            <button
              type="button"
              onClick={
                clearFilters
              }
              disabled={
                !hasFilters
              }
              className="border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mt-5">
        {loading ? (
          <div className="p-10 text-center text-slate-400">
            Loading tickets...
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-red-600">
              {error}
            </p>

            <button
              onClick={() =>
                loadTickets()
              }
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              ลองใหม่
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            isUser={isUser}
            hasFilters={
              Boolean(
                hasFilters
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-left font-medium">
                    ID
                  </th>

                  <th className="px-5 py-4 text-left font-medium">
                    Issue
                  </th>

                  <th className="px-5 py-4 text-left font-medium">
                    Category
                  </th>

                  <th className="px-5 py-4 text-left font-medium">
                    Priority
                  </th>

                  <th className="px-5 py-4 text-left font-medium">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left font-medium">
                    Assigned
                  </th>

                  <th className="px-5 py-4 text-left font-medium">
                    Comments
                  </th>

                  <th className="px-5 py-4 text-left font-medium">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {tickets.map(
                  (ticket) => (
                    <tr
                      key={
                        ticket.id
                      }
                      className="border-t border-slate-100 hover:bg-slate-50 transition"
                    >
                      <td className="px-5 py-5 text-slate-500">
                        #{ticket.id}
                      </td>

                      <td className="px-5 py-5 min-w-64">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600 transition"
                        >
                          {
                            ticket.title
                          }
                        </Link>

                        <p className="text-xs text-slate-400 mt-1">
                          โดย{" "}
                          {
                            ticket
                              .createdBy
                              .name
                          }
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <CategoryBadge
                          category={
                            ticket.category
                          }
                        />
                      </td>

                      <td className="px-5 py-5">
                        <PriorityBadge
                          priority={
                            ticket.priority
                          }
                        />
                      </td>

                      <td className="px-5 py-5">
                        <StatusBadge
                          status={
                            ticket.status
                          }
                        />
                      </td>

                      <td className="px-5 py-5 text-slate-600">
                        {ticket
                          .assignedTo
                          ?.name ||
                          "Unassigned"}
                      </td>

                      <td className="px-5 py-5 text-slate-500">
                        {ticket
                          ._count
                          ?.comments ??
                          0}
                      </td>

                      <td className="px-5 py-5 text-slate-500 whitespace-nowrap">
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
      </div>

      {/* Result count */}
      {!loading &&
        !error &&
        tickets.length > 0 && (
          <p className="text-xs text-slate-400 mt-3">
            แสดงทั้งหมด{" "}
            {tickets.length} Ticket
          </p>
        )}
    </div>
  );
}

function EmptyState({
  isUser,
  hasFilters,
}: {
  isUser: boolean;
  hasFilters: boolean;
}) {
  return (
    <div className="p-14 text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-xl">
        🎫
      </div>

      <h3 className="font-semibold text-slate-800 mt-4">
        ไม่พบ Ticket
      </h3>

      <p className="text-sm text-slate-400 mt-2">
        {hasFilters
          ? "ไม่พบ Ticket ที่ตรงกับเงื่อนไขที่ค้นหา"
          : isUser
            ? "คุณยังไม่ได้สร้าง Ticket"
            : "ยังไม่มี Ticket ในระบบ"}
      </p>

      {!hasFilters &&
        isUser && (
          <Link
            to="/tickets/new"
            className="inline-block mt-5 text-sm font-medium text-blue-600 hover:underline"
          >
            สร้าง Ticket แรก →
          </Link>
        )}
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
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
        styles[status] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {status.replaceAll(
        "_",
        " "
      )}
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
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
        styles[priority] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {priority}
    </span>
  );
}

function CategoryBadge({
  category,
}: {
  category: string;
}) {
  const styles: Record<
    string,
    string
  > = {
    HARDWARE:
      "bg-purple-50 text-purple-700",
    SOFTWARE:
      "bg-indigo-50 text-indigo-700",
    NETWORK:
      "bg-cyan-50 text-cyan-700",
    ACCOUNT:
      "bg-pink-50 text-pink-700",
    OTHER:
      "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
        styles[category] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {category}
    </span>
  );
}