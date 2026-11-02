import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router";

import { api } from "../api/client";

type User = {
  id: number;
  name: string;
  email?: string;
  role?: string;
};

type Comment = {
  id: number;
  message: string;
  createdAt: string;
  author: User;
};

type Activity = {
  id: number;
  type: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;

  actor: {
    id: number;
    name: string;
    role: string;
  };
};
type AIAnalysis = {
  id: number;

  categorySuggested: string;
  categoryConfidence: number;

  prioritySuggested: string;
  priorityConfidence: number;

  prioritySource: string;
  needsReview: boolean;

  createdAt: string;
};

type Ticket = {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;

  createdById: number;
  assignedToId: number | null;

  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;

  createdBy: User;
  assignedTo: User | null;

  comments: Comment[];
  activities: Activity[];
  aiAnalysis: AIAnalysis | null;
};

export default function TicketDetailPage() {
  const { id } = useParams();

  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isStaff =
    currentUser.role === "STAFF" ||
    currentUser.role === "ADMIN";

  const [ticket, setTicket] =
    useState<Ticket | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [comment, setComment] =
    useState("");

  const [sendingComment, setSendingComment] =
    useState(false);

  const [status, setStatus] =
    useState("");

  const [priority, setPriority] =
    useState("");

  async function loadTicket() {
    try {
      setError("");

      const response = await api.get(
        `/tickets/${id}`
      );

      const data = response.data;

      setTicket(data);
      setStatus(data.status);
      setPriority(data.priority);
    } catch (error) {
      console.error(error);

      setError("ไม่สามารถโหลด Ticket ได้");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTicket();
  }, [id]);

  async function submitComment(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!comment.trim()) {
      return;
    }

    setSendingComment(true);

    try {
      await api.post(
        `/tickets/${id}/comments`,
        {
          message: comment.trim(),
        }
      );

      setComment("");

      await loadTicket();
    } catch (error) {
      console.error(error);

      setError("ไม่สามารถเพิ่ม Comment ได้");
    } finally {
      setSendingComment(false);
    }
  }

  async function updateTicket() {
    try {
      await api.patch(
        `/tickets/${id}`,
        {
          status,
          priority,
        }
      );

      await loadTicket();
    } catch (error) {
      console.error(error);

      setError("ไม่สามารถอัปเดต Ticket ได้");
    }
  }

  async function assignToMe() {
    try {
      await api.patch(
        `/tickets/${id}`,
        {
          assignedToId: currentUser.id,
          status:
            ticket?.status === "OPEN"
              ? "IN_PROGRESS"
              : ticket?.status,
        }
      );

      await loadTicket();
    } catch (error) {
      console.error(error);

      setError("ไม่สามารถรับ Ticket นี้ได้");
    }
  }

  if (loading) {
    return (
      <div className="text-slate-500">
        Loading ticket...
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
        {error}
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            to="/tickets"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Tickets
          </Link>

          <h1 className="text-3xl font-bold text-slate-900 mt-3">
            #{ticket.id} {ticket.title}
          </h1>

          <p className="text-slate-500 mt-2">
            สร้างโดย {ticket.createdBy.name}
          </p>
        </div>

        <StatusBadge
          status={ticket.status}
        />
      </div>

      {error && (
        <div className="mt-5 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
        {/* Main */}
        <div className="xl:col-span-2 space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold">
              รายละเอียดปัญหา
            </h2>

            <p className="text-slate-700 whitespace-pre-wrap mt-4">
              {ticket.description}
            </p>
          </section>
          <section className="bg-white border border-slate-200 rounded-2xl p-6">
  <h2 className="text-lg font-semibold">
    Activity Timeline
  </h2>

  <p className="text-sm text-slate-500 mt-1">
    ประวัติการดำเนินการของ Ticket นี้
  </p>

  <div className="mt-6">
    {!ticket.activities ||
    ticket.activities.length === 0 ? (
      <p className="text-sm text-slate-400">
        ยังไม่มี Activity
      </p>
    ) : (
      <div className="space-y-0">
        {ticket.activities.map(
          (activity, index) => (
            <div
              key={activity.id}
              className="flex gap-4"
            >
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div
                    className={`w-3 h-3 rounded-full mt-1.5 ${getActivityColor(
                    activity.type
                )}`}
/>

                {index <
                  ticket.activities.length -
                    1 && (
                  <div className="w-px flex-1 bg-slate-200 min-h-14" />
                )}
              </div>

              {/* Content */}
              <div className="pb-6">
                <p className="text-sm text-slate-800">
                  <span className="font-semibold">
                        {activity.actor.name}
                    </span>
                    <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {activity.actor.role}
                    </span>

                  {" "}

                  {getActivityText(
                    activity
                  )}
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  {new Date(
                    activity.createdAt
                  ).toLocaleString(
                    "th-TH"
                  )}
                </p>
              </div>
            </div>
          )
        )}
      </div>
    )}
  </div>
</section>
          

          {/* Comments */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold">
              Comments
            </h2>

            <div className="mt-6 space-y-4">
              {ticket.comments.length === 0 ? (
                <p className="text-sm text-slate-400">
                  ยังไม่มี Comment
                </p>
              ) : (
                ticket.comments.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="border border-slate-200 rounded-xl p-4"
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <span className="font-medium text-slate-900">
                            {item.author.name}
                          </span>

                          <span className="ml-2 text-xs bg-slate-100 px-2 py-1 rounded">
                            {item.author.role}
                          </span>
                        </div>

                        <span className="text-xs text-slate-400">
                          {new Date(
                            item.createdAt
                          ).toLocaleString(
                            "th-TH"
                          )}
                        </span>
                      </div>

                      <p className="text-slate-700 mt-3 whitespace-pre-wrap">
                        {item.message}
                      </p>
                    </div>
                  )
                )
              )}
            </div>

            <form
              onSubmit={submitComment}
              className="mt-6"
            >
              <textarea
                value={comment}
                onChange={(e) =>
                  setComment(
                    e.target.value
                  )
                }
                rows={4}
                placeholder="เพิ่ม Comment..."
                className="w-full border border-slate-300 rounded-xl p-4 resize-none"
              />

              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={
                    sendingComment ||
                    !comment.trim()
                  }
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-lg disabled:opacity-50"
                >
                  {sendingComment
                    ? "กำลังส่ง..."
                    : "Add Comment"}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
  <section className="bg-white border border-slate-200 rounded-2xl p-6">
    <h2 className="font-semibold">
      Ticket Information
    </h2>

    <div className="mt-5 space-y-4 text-sm">
      <InfoRow
        label="Category"
        value={ticket.category}
      />

      <InfoRow
        label="Priority"
        value={ticket.priority}
      />

      <InfoRow
        label="Status"
        value={ticket.status}
      />

      <InfoRow
        label="Assigned"
        value={
          ticket.assignedTo?.name ||
          "Unassigned"
        }
      />

      <InfoRow
        label="Created"
        value={new Date(
          ticket.createdAt
        ).toLocaleString("th-TH")}
      />

      <InfoRow
        label="Last updated"
        value={new Date(
          ticket.updatedAt
        ).toLocaleString("th-TH")}
      />

      {ticket.resolvedAt && (
        <InfoRow
          label="Resolved"
          value={new Date(
            ticket.resolvedAt
          ).toLocaleString("th-TH")}
        />
      )}
    </div>
  </section>

  {/* AI Analysis */}
  {ticket.aiAnalysis && (
    <section className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">
            AI Analysis
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            คำแนะนำจาก AI ตอนสร้าง Ticket
          </p>
        </div>

        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
          AI
        </span>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <p className="text-xs text-slate-400">
            Suggested Category
          </p>

          <div className="flex justify-between items-center mt-1">
            <span className="font-semibold text-slate-800">
              {ticket.aiAnalysis.categorySuggested}
            </span>

            <span className="text-sm text-slate-500">
              {Math.round(
                ticket.aiAnalysis.categoryConfidence * 100
              )}
              %
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400">
            Suggested Priority
          </p>

          <div className="flex justify-between items-center mt-1">
            <span className="font-semibold text-slate-800">
              {ticket.aiAnalysis.prioritySuggested}
            </span>

            <span className="text-sm text-slate-500">
              {Math.round(
                ticket.aiAnalysis.priorityConfidence * 100
              )}
              %
            </span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">
              Priority Source
            </span>

            <span className="font-medium">
              {ticket.aiAnalysis.prioritySource}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">
              Category Result
            </span>

            <span
              className={
                ticket.category ===
                ticket.aiAnalysis.categorySuggested
                  ? "text-green-600 font-medium"
                  : "text-amber-600 font-medium"
              }
            >
              {ticket.category ===
              ticket.aiAnalysis.categorySuggested
                ? "Accepted"
                : "Changed"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">
              Priority Result
            </span>

            <span
              className={
                ticket.priority ===
                ticket.aiAnalysis.prioritySuggested
                  ? "text-green-600 font-medium"
                  : "text-amber-600 font-medium"
              }
            >
              {ticket.priority ===
              ticket.aiAnalysis.prioritySuggested
                ? "Accepted"
                : "Changed"}
            </span>
          </div>
        </div>

        {ticket.aiAnalysis.needsReview && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg p-3 text-xs">
            AI มีความมั่นใจต่ำ ผลลัพธ์นี้ควรได้รับการตรวจสอบ
          </div>
        )}
      </div>
    </section>
  )}
          {/* STAFF CONTROL */}
          {isStaff && (
            <section className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="font-semibold">
                Staff Actions
              </h2>

              {!ticket.assignedTo && (
                <button
                  onClick={assignToMe}
                  className="w-full mt-5 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                >
                  Assign to Me
                </button>
              )}

              {ticket.assignedTo?.id ===
                currentUser.id && (
                <div className="mt-5 text-sm bg-green-50 text-green-700 p-3 rounded-lg">
                  Ticket นี้ถูก Assign
                  ให้คุณแล้ว
                </div>
              )}

              <div className="mt-5">
                <label className="text-sm font-medium">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value
                    )
                  }
                  className="mt-2 w-full border border-slate-300 rounded-lg p-3"
                >
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
              </div>

              <div className="mt-5">
                <label className="text-sm font-medium">
                  Priority
                </label>

                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(
                      e.target.value
                    )
                  }
                  className="mt-2 w-full border border-slate-300 rounded-lg p-3"
                >
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
              </div>

              <button
                onClick={updateTicket}
                className="w-full mt-6 bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800"
              >
                Save Changes
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">
        {label}
      </span>

      <span className="font-medium text-right">
        {value}
      </span>
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
      className={`px-4 py-2 rounded-full text-sm font-medium ${
        styles[status] ||
        "bg-slate-100"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
function getActivityText(
  activity: Activity
)
 {
  switch (activity.type) {
    case "CREATED":
      return "สร้าง Ticket นี้";

    case "ASSIGNED":
      return "รับผิดชอบ Ticket นี้";

    case "COMMENT_ADDED":
      return "เพิ่ม Comment";

    case "STATUS_CHANGED":
      return `เปลี่ยน Status จาก ${formatValue(
        activity.oldValue
      )} → ${formatValue(
        activity.newValue
      )}`;

    case "PRIORITY_CHANGED":
      return `เปลี่ยน Priority จาก ${formatValue(
        activity.oldValue
      )} → ${formatValue(
        activity.newValue
      )}`;

    default:
      return activity.type;
  }
}
function getActivityColor(
  type: string
) {
  switch (type) {
    case "CREATED":
      return "bg-blue-500";

    case "ASSIGNED":
      return "bg-purple-500";

    case "COMMENT_ADDED":
      return "bg-cyan-500";

    case "STATUS_CHANGED":
      return "bg-amber-500";

    case "PRIORITY_CHANGED":
      return "bg-orange-500";

    default:
      return "bg-slate-400";
  }
}

function formatValue(
  value: string | null
) {
  if (!value) {
    return "-";
  }

  return value.replaceAll("_", " ");
}