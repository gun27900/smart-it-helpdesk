import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router";

import { api } from "../api/client";

type AISuggestion = {
  category: string;
  categoryConfidence: number;

  priority: string;
  priorityConfidence: number;

  prioritySource: string;
  needsReview: boolean;
};

export default function NewTicketPage() {
  const navigate = useNavigate();

  const [title, setTitle] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [category, setCategory] =
    useState("HARDWARE");

  const [priority, setPriority] =
    useState("MEDIUM");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // AI
  const [
    aiLoading,
    setAiLoading,
  ] = useState(false);

  const [
    aiError,
    setAiError,
  ] = useState("");

  const [
    aiSuggestion,
    setAiSuggestion,
  ] =
    useState<AISuggestion | null>(
      null
    );

  async function handleAISuggest() {
    if (title.trim().length < 3) {
      setAiError(
        "กรุณาใส่หัวข้อปัญหาก่อนใช้ AI Suggest"
      );

      return;
    }

    try {
      setAiLoading(true);
      setAiError("");

      const response =
        await api.post(
          "/ai/suggest",
          {
            title:
              title.trim(),

            description:
              description.trim(),
          }
        );

      const suggestion =
        response.data.suggestion;

      setAiSuggestion(
        suggestion
      );

      // ใส่ค่าที่ AI แนะนำลง Form
      setCategory(
        suggestion.category
      );

      setPriority(
        suggestion.priority
      );
    } catch (error) {
      console.error(error);

      setAiError(
        "AI Service ไม่พร้อมใช้งาน กรุณาเลือก Category และ Priority เอง"
      );
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await api.post(
  "/tickets",
  {
    title,
    description,
    category,
    priority,

    aiAnalysis: aiSuggestion
      ? {
          categorySuggested:
            aiSuggestion.category,

          categoryConfidence:
            aiSuggestion.categoryConfidence,

          prioritySuggested:
            aiSuggestion.priority,

          priorityConfidence:
            aiSuggestion.priorityConfidence,

          prioritySource:
            aiSuggestion.prioritySource,

          needsReview:
            aiSuggestion.needsReview,
        }
      : undefined,
  }
);

      navigate("/tickets");
    } catch (error) {
      console.error(error);

      setError(
        "ไม่สามารถสร้าง Ticket ได้"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          New Ticket
        </h1>

        <p className="text-slate-500 mt-1">
          แจ้งปัญหาหรือขอความช่วยเหลือจากฝ่าย IT
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-2xl p-6 mt-8"
      >
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            หัวข้อปัญหา
          </label>

          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(
                e.target.value
              );

              setAiSuggestion(
                null
              );
            }}
            placeholder="เช่น โน้ตบุ๊กเชื่อมต่อ Wi-Fi ไม่ได้"
            className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div className="mt-5">
          <label className="block text-sm font-medium text-slate-700">
            รายละเอียด
          </label>

          <textarea
            value={description}
            onChange={(e) => {
              setDescription(
                e.target.value
              );

              setAiSuggestion(
                null
              );
            }}
            placeholder="อธิบายปัญหาที่พบ..."
            rows={7}
            className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            required
          />
        </div>

        {/* AI Suggest */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                AI Assistant
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                ให้ AI วิเคราะห์ปัญหาและแนะนำ Category กับ Priority
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleAISuggest
              }
              disabled={
                aiLoading
              }
              className="bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {aiLoading
                ? "AI กำลังวิเคราะห์..."
                : "✨ AI Suggest"}
            </button>
          </div>

          {aiError && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
              {aiError}
            </div>
          )}

          {aiSuggestion && (
            <div className="mt-5 bg-white border border-blue-100 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-800">
                AI Suggestion
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-slate-400">
                    Category
                  </p>

                  <p className="font-semibold text-slate-900 mt-1">
                    {
                      aiSuggestion.category
                    }
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Confidence:{" "}
                    {Math.round(
                      aiSuggestion.categoryConfidence *
                        100
                    )}
                    %
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Priority
                  </p>

                  <p className="font-semibold text-slate-900 mt-1">
                    {
                      aiSuggestion.priority
                    }
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Confidence:{" "}
                    {Math.round(
                      aiSuggestion.priorityConfidence *
                        100
                    )}
                    %
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Source:{" "}
                    {
                      aiSuggestion.prioritySource
                    }
                  </p>
                </div>
              </div>

              {aiSuggestion.needsReview && (
                <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg p-3 text-sm">
                  ⚠ AI มีความมั่นใจต่ำ กรุณาตรวจสอบ Category และ Priority ก่อนสร้าง Ticket
                </div>
              )}

              <p className="text-xs text-slate-400 mt-4">
                AI เป็นเพียงคำแนะนำ คุณสามารถแก้ไขค่าด้านล่างได้
              </p>
            </div>
          )}
        </div>

        {/* Category + Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Category
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
            >
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
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Priority
            </label>

            <select
              value={priority}
              onChange={(e) =>
                setPriority(
                  e.target.value
                )
              }
              className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
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
        </div>

        {error && (
          <div className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/tickets"
              )
            }
            className="border border-slate-300 px-5 py-3 rounded-xl hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {loading
              ? "กำลังสร้าง..."
              : "Create Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}