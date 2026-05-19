"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  X,
  RefreshCw,
  BookOpen,
  Calendar,
  Users,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type GradingStatus =
  | "queued"
  | "ocr"
  | "segmenting"
  | "grading"
  | "done"
  | "error";

interface ScriptGradingEntry {
  id: string;
  studentName: string;
  studentId: string;
  fileName: string;
  fileUrl: string;
  status: GradingStatus;
  score: number | null;
  totalMarks: number | null;
  error: string | null;
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  courseCode?: string;
  courseName?: string;
  totalMarks: number;
  duration?: number;
  examDate?: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  createdAt: string;
  rubrics?: Array<{
    id: string;
    title: string;
  }>;
}

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [scripts, setScripts] = useState<ScriptGradingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [hasRubric, setHasRubric] = useState(false);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    fetchExam();
    fetchScripts();
  }, [examId]);

  const fetchExam = async () => {
    try {
      const response = await fetch(`/api/exams/${examId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch exam");
      }
      const data = await response.json();
      setExam(data);
      setHasRubric(data.rubrics && data.rubrics.length > 0);
    } catch (error) {
      console.error("Error fetching exam:", error);
      toast.error("Failed to load exam details");
    }
  };

  const fetchScripts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/exams/${examId}/scripts`);
      if (!response.ok) {
        throw new Error("Failed to fetch scripts");
      }
      const data = await response.json();

      // Map backend status to frontend grading status
      const mappedScripts = data.scripts.map((s: any) => {
        let status: GradingStatus = "queued";
        if (s.status === "PROCESSED") {
          status = "done";
        } else if (s.status === "PROCESSING") {
          status = "grading";
        } else if (s.status === "FAILED") {
          status = "error";
        } else {
          status = "queued";
        }

        return {
          ...s,
          status,
          error: s.status === "FAILED" ? "Processing failed" : null,
        };
      });

      setScripts(mappedScripts);
    } catch (error) {
      console.error("Error fetching scripts:", error);
      toast.error("Failed to load scripts");
    } finally {
      setLoading(false);
    }
  };

  const updateScriptStatus = (scriptId: string, status: GradingStatus) => {
    setScripts((prev) =>
      prev.map((s) => (s.id === scriptId ? { ...s, status } : s)),
    );
  };

  const updateScriptEntry = (
    scriptId: string,
    updates: Partial<ScriptGradingEntry>,
  ) => {
    setScripts((prev) =>
      prev.map((s) => (s.id === scriptId ? { ...s, ...updates } : s)),
    );
  };

  const processSingleScript = async (script: ScriptGradingEntry) => {
    updateScriptStatus(script.id, "ocr");

    try {
      const response = await fetch(`/api/scripts/${script.id}/process`, {
        method: "POST",
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Processing failed");
      }

      const result = await response.json();

      updateScriptEntry(script.id, {
        status: "done",
        score: result.totalScore,
        totalMarks: result.totalPossible,
        error: null,
      });
    } catch (error: any) {
      updateScriptEntry(script.id, {
        status: "error",
        error: error.message,
      });
    }
  };

  const startBatchGrading = async () => {
    isCancelledRef.current = false;
    setIsGrading(true);

    const toProcess = scripts.filter((s) => s.status !== "done");

    for (const script of toProcess) {
      if (isCancelledRef.current) break;

      updateScriptStatus(script.id, "ocr");

      try {
        if (toProcess.indexOf(script) > 0) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }

        await processSingleScript(script);
      } catch (error: any) {
        updateScriptEntry(script.id, {
          status: "error",
          error: error.message,
        });
      }
    }

    setIsGrading(false);

    const allDone = toProcess.every((s) => s.status === "done");
    if (allDone) {
      toast.success("All scripts graded successfully");
      // Update exam status to COMPLETED
      await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
    } else {
      toast.warning("Grading complete — some scripts need attention");
    }

    // Refresh scripts to get latest state
    fetchScripts();
  };

  const cancelGrading = () => {
    isCancelledRef.current = true;
    setIsGrading(false);
    toast.info("Grading cancelled");
  };

  const retryScript = async (scriptId: string) => {
    const script = scripts.find((s) => s.id === scriptId);
    if (!script) return;

    await processSingleScript(script);
    fetchScripts();
  };

  const uploadedCount = scripts.length;
  const gradedCount = scripts.filter((s) => s.status === "done").length;
  const pendingCount = uploadedCount - gradedCount;
  const processingCount = scripts.filter((s) =>
    ["ocr", "segmenting", "grading"].includes(s.status),
  ).length;
  const errorCount = scripts.filter((s) => s.status === "error").length;

  const progress =
    uploadedCount > 0 ? Math.round((gradedCount / uploadedCount) * 100) : 0;

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="animate-spin h-8 w-8 text-teal-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-800">{exam.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {exam.courseCode} · {exam.courseName}
          </p>
        </div>
      </div>

      {/* Exam Info Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-slate-400" />
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              Total Marks
            </p>
          </div>
          <p className="text-lg font-semibold text-slate-800">
            {exam.totalMarks}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-slate-400" />
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              Exam Date
            </p>
          </div>
          <p className="text-lg font-semibold text-slate-800">
            {exam.examDate
              ? new Date(exam.examDate).toLocaleDateString()
              : "Not set"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-slate-400" />
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              Scripts
            </p>
          </div>
          <p className="text-lg font-semibold text-slate-800">
            {uploadedCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-slate-400" />
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              Rubric
            </p>
          </div>
          <p className="text-lg font-semibold text-slate-800">
            {hasRubric ? "Created" : "Not created"}
          </p>
        </div>
      </div>

      {/* Script Grading Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Section Header */}
        <div className="flex flex-col gap-4 p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Script Grading
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {uploadedCount} scripts uploaded · {gradedCount} graded ·{" "}
                {pendingCount} pending
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isGrading && (
                <button
                  onClick={cancelGrading}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={startBatchGrading}
                disabled={isGrading || uploadedCount === 0 || !hasRubric}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors",
                  isGrading || uploadedCount === 0 || !hasRubric
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-[#0f1f3d] hover:bg-[#162b52]",
                )}
                title={
                  !hasRubric
                    ? "Create a rubric before grading"
                    : uploadedCount === 0
                      ? "Upload scripts first"
                      : ""
                }
              >
                {isGrading ? "Grading..." : "Grade All Scripts"}
              </button>
            </div>
          </div>

          {/* Overall Progress Bar */}
          {isGrading && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-slate-500">
                  {gradedCount} of {uploadedCount} scripts processed
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  {progress}%
                </p>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-teal-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Scripts Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Student
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  File Name
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Score
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Loader2 className="animate-spin h-6 w-6 text-slate-400 mx-auto" />
                  </td>
                </tr>
              ) : scripts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No scripts uploaded yet
                  </td>
                </tr>
              ) : (
                scripts.map((script) => (
                  <tr
                    key={script.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {script.studentName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {script.studentId}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-600 truncate max-w-50">
                        {script.fileName}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {script.status === "queued" && (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-slate-300" />
                          <span className="text-sm text-slate-600">Queued</span>
                        </div>
                      )}
                      {script.status === "ocr" && (
                        <div className="flex items-center gap-2">
                          <Loader2
                            size={14}
                            className="animate-spin text-blue-500"
                          />
                          <span className="text-sm text-blue-600">
                            Extracting text...
                          </span>
                        </div>
                      )}
                      {script.status === "segmenting" && (
                        <div className="flex items-center gap-2">
                          <Loader2
                            size={14}
                            className="animate-spin text-blue-500"
                          />
                          <span className="text-sm text-blue-600">
                            Reading answers...
                          </span>
                        </div>
                      )}
                      {script.status === "grading" && (
                        <div className="flex items-center gap-2">
                          <Loader2
                            size={14}
                            className="animate-spin text-blue-500"
                          />
                          <span className="text-sm text-blue-600">
                            Grading...
                          </span>
                        </div>
                      )}
                      {script.status === "done" && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-teal-500" />
                          <span className="text-sm text-teal-600">Graded</span>
                        </div>
                      )}
                      {script.status === "error" && (
                        <div className="flex items-center gap-2">
                          <X size={14} className="text-red-500" />
                          <span
                            className="text-sm text-red-600 truncate max-w-[200px]"
                            title={script.error || "Error"}
                          >
                            {script.error || "Error"}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {script.status === "done" && script.score !== null ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">
                              {script.score}
                            </span>
                            <span className="text-sm text-slate-500">
                              / {script.totalMarks}
                            </span>
                          </div>
                          {script.totalMarks && script.totalMarks > 0 && (
                            <div className="h-1.5 w-24 rounded-full bg-slate-100 mt-1">
                              <div
                                className="h-1.5 rounded-full bg-teal-500"
                                style={{
                                  width: `${(script.score / script.totalMarks) * 100}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {script.status === "error" && (
                        <button
                          onClick={() => retryScript(script.id)}
                          disabled={isGrading}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <RefreshCw size={12} />
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
