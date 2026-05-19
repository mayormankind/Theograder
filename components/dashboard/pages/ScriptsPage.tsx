//components/dashboard/pages/ScriptsPage.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Upload,
  Filter,
  Eye,
  BarChart3,
  Loader2,
  Trash2,
  Zap,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Page } from "@/types";
import { cn } from "@/lib/utils";
import { generateIndividualReportPDF } from "@/lib/pdf-report";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Script {
  id: string;
  fileName: string;
  studentName: string;
  studentId: string;
  examId: string;
  examTitle?: string;
  status: "UPLOADED" | "PROCESSING" | "PENDING_REVIEW" | "GRADED";
  uploadedAt: string;
  score?: number;
  totalMarks?: number;
  confidence?: number;
}

interface Exam {
  id: string;
  title: string;
  courseCode?: string;
  hasRubric?: boolean;
  rubricTitle?: string;
}

interface ScriptsPageProps {
  onNavigate: (page: Page, params?: Record<string, string>) => void;
}

const statusStyles: Record<
  string,
  { style: string; label: string; dot: string }
> = {
  GRADED: {
    style: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
    label: "Graded",
    dot: "bg-teal-400",
  },
  PROCESSING: {
    style: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    label: "Processing",
    dot: "bg-blue-400",
  },
  PENDING_REVIEW: {
    style: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    label: "Needs Review",
    dot: "bg-amber-400",
  },
  UPLOADED: {
    style: "bg-slate-50 text-slate-600 ring-1 ring-slate-200",
    label: "Queued",
    dot: "bg-slate-300",
  },
};

export default function ScriptsPage({ onNavigate }: ScriptsPageProps) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScriptIds, setSelectedScriptIds] = useState<string[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedExamId, setSelectedExamId] = useState<string>("all");
  const [batchGrading, setBatchGrading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalScripts, setTotalScripts] = useState(0);

  useEffect(() => {
    fetchExams();
    fetchScripts();
  }, []);

  useEffect(() => {
    fetchScripts(currentPage);
  }, [selectedExamId, currentPage]);

  const fetchExams = async () => {
    try {
      const response = await fetch("/api/exams");
      if (!response.ok) {
        throw new Error("Failed to fetch exams");
      }
      const data = await response.json();

      // Fetch rubrics for each exam to check status
      const examsWithRubricStatus = await Promise.all(
        (data.exams || []).map(async (exam: Exam) => {
          const rubricsResponse = await fetch(`/api/rubrics?examId=${exam.id}`);
          if (rubricsResponse.ok) {
            const rubricsData = await rubricsResponse.json();
            return {
              ...exam,
              hasRubric: rubricsData.rubrics && rubricsData.rubrics.length > 0,
              rubricTitle:
                rubricsData.rubrics && rubricsData.rubrics.length > 0
                  ? rubricsData.rubrics[0].title
                  : undefined,
            };
          }
          return { ...exam, hasRubric: false };
        }),
      );

      setExams(examsWithRubricStatus);
    } catch (err) {
      console.error("Error fetching exams:", err);
    }
  };

  const fetchScripts = async (pageToFetch = 1) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedScriptIds([]); // Reset selection when fetching/paging
      const urlParams = new URLSearchParams({
        page: pageToFetch.toString(),
        limit: "15",
      });
      if (selectedExamId !== "all") {
        urlParams.append("examId", selectedExamId);
      }

      const response = await fetch(`/api/upload?${urlParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch scripts");
      }
      const data = await response.json();
      setScripts(data.scripts || []);
      if (data.pagination) {
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.pages);
        setTotalScripts(data.pagination.total);
      }
    } catch (err) {
      console.error("Error fetching scripts:", err);
      setError("Failed to load scripts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (scriptId: string) => {
    setConfirmState({
      isOpen: true,
      title: "Delete Script",
      description:
        "Are you sure you want to delete this script? This will also permanently delete all associated grading results and student answers. This action cannot be undone.",
      isDestructive: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/upload/${scriptId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to delete script");
          }

          setScripts(scripts.filter((s) => s.id !== scriptId));
          toast.success("Script deleted successfully");
        } catch (err) {
          console.error("Error deleting script:", err);
          toast.error("Failed to delete script");
        }
      },
    });
  };

  const handleBulkDelete = async () => {
    if (selectedScriptIds.length === 0) return;

    setConfirmState({
      isOpen: true,
      title: "Bulk Delete Scripts",
      description: `Are you sure you want to delete the ${selectedScriptIds.length} selected script(s)? This will also permanently delete all associated grading results and student answers. This action cannot be undone.`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          const response = await fetch("/api/upload", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ scriptIds: selectedScriptIds }),
          });

          if (!response.ok) {
            throw new Error("Failed to delete scripts");
          }

          setScripts(scripts.filter((s) => !selectedScriptIds.includes(s.id)));
          setSelectedScriptIds([]);
          toast.success("Selected scripts deleted successfully");
        } catch (err) {
          console.error("Error bulk deleting scripts:", err);
          toast.error("Failed to delete selected scripts");
        }
      },
    });
  };

  const handleGradeScript = async (scriptId: string) => {
    const selectedExam = exams.find((e) => e.id === selectedExamId);
    if (selectedExamId !== "all" && !selectedExam?.hasRubric) {
      toast.error("Please create a rubric for this exam before grading");
      return;
    }

    try {
      const response = await fetch(`/api/scripts/${scriptId}/process`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to grade script");
      }

      toast.success("Script graded successfully");
      fetchScripts();
    } catch (err) {
      console.error("Error grading script:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to grade script",
      );
    }
  };

  const handleBatchGrade = async () => {
    if (selectedExamId === "all") {
      toast.error("Please select an exam to grade");
      return;
    }

    const selectedExam = exams.find((e) => e.id === selectedExamId);
    if (!selectedExam?.hasRubric) {
      toast.error("Please create a rubric for this exam before grading");
      return;
    }

    const ungradedScripts = scripts.filter(
      (s) => s.status === "UPLOADED" || s.status === "PROCESSING",
    );
    if (ungradedScripts.length === 0) {
      toast.error("No ungraded scripts for this exam");
      return;
    }

    setConfirmState({
      isOpen: true,
      title: "Batch Grade Scripts",
      description: `Grade ${ungradedScripts.length} script(s) for this exam? This may take a while.`,
      isDestructive: false,
      onConfirm: async () => {
        setBatchGrading(true);
        let successCount = 0;
        let failCount = 0;

        try {
          // Process each script individually
          for (const script of ungradedScripts) {
            try {
              const response = await fetch(
                `/api/scripts/${script.id}/process`,
                {
                  method: "POST",
                },
              );

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to grade script");
              }

              successCount++;
            } catch (err) {
              console.error(`Error grading script ${script.id}:`, err);
              failCount++;
            }
          }

          if (successCount > 0) {
            toast.success(`Successfully graded ${successCount} script(s)`);
          }
          if (failCount > 0) {
            toast.error(`Failed to grade ${failCount} script(s)`);
          }

          // Refresh scripts list
          fetchScripts();

          // Collect flagged scripts for email
          const flaggedScripts = scripts
            .filter((s) => s.status === "PENDING_REVIEW")
            .map((s) => ({
              studentId: s.studentId || "Unknown",
              studentName: s.studentName || "Unknown",
              reason: "Flagged for manual review",
            }));

          // Send notification email (fire and forget)
          fetch("/api/notifications/grading-complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              examId: selectedExamId,
              total: ungradedScripts.length,
              successful: successCount,
              failed: failCount,
              flagged: flaggedScripts,
            }),
          }).catch((err) => console.error("Failed to send notification:", err));
        } catch (err) {
          console.error("Error during batch grade:", err);
          toast.error(
            err instanceof Error
              ? err.message
              : "Failed to complete batch grading",
          );
        } finally {
          setBatchGrading(false);
        }
      },
    });
  };

  const handleExportPDF = () => {
    if (filtered.length === 0) {
      toast.error("No scripts to export");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // -- Header Section --
    doc.setFillColor(15, 31, 61); // #0f1f3d
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Examination Results", 14, 25);

    // Filter to graded scripts for statistics
    const gradedScripts = filtered.filter(
      (s) => s.status === "GRADED" || s.status === "PENDING_REVIEW",
    );
    const totalScripts = gradedScripts.length;
    let avgScoreText = "N/A";

    if (totalScripts > 0) {
      const totalScore = gradedScripts.reduce(
        (acc, curr) => acc + (curr.score || 0),
        0,
      );
      const totalPossible = gradedScripts.reduce(
        (acc, curr) => acc + (curr.totalMarks || 0),
        0,
      );
      if (totalPossible > 0) {
        const avgPct = Math.round((totalScore / totalPossible) * 100);
        avgScoreText = `${avgPct}%`;

        // Draw Circular Average in Header
        doc.setFillColor(255, 255, 255);
        doc.circle(pageWidth - 30, 20, 12, "F");
        doc.setTextColor(15, 31, 61);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(avgScoreText, pageWidth - 30, 20, {
          align: "center",
          baseline: "middle",
        });
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text("Avg Score", pageWidth - 30, 26, {
          align: "center",
          baseline: "middle",
        });
      }
    }

    // -- Exam Details --
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const examName = selectedExam ? selectedExam.title : "All Examinations";
    doc.text(`Exam: ${examName}`, 14, 50);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 56);
    doc.text(`Total Graded: ${totalScripts}`, 14, 62);

    // -- Table Data --
    const tableColumns = [
      "Matric Number",
      "Status",
      "Score",
      "Total",
      "Percentage",
    ];
    const tableRows = filtered.map((script) => {
      const pct =
        script.score !== undefined && script.totalMarks !== undefined
          ? Math.round((script.score / script.totalMarks) * 100) + "%"
          : "-";

      return [
        script.studentId || "Unknown",
        script.status,
        script.score !== undefined ? script.score : "-",
        script.totalMarks !== undefined ? script.totalMarks : "-",
        pct,
      ];
    });

    autoTable(doc, {
      startY: 70,
      head: [tableColumns],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [15, 31, 61], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 4 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    // -- Footer Section --
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Generated with TheoGrader",
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" },
    );

    doc.save(
      `examination_results_${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  const handleDownloadAllReports = async () => {
    if (selectedExamId === "all") {
      toast.error("Please select a specific exam first");
      return;
    }

    try {
      setDownloadingAll(true);
      toast.info("Preparing and exporting all student reports...");

      const response = await fetch(`/api/results?examId=${selectedExamId}&export=json`);
      if (!response.ok) {
        throw new Error("Failed to fetch detailed results for bulk download");
      }

      const data = await response.json();
      const resultsToDownload = data.results || [];

      if (resultsToDownload.length === 0) {
        toast.error("No graded results found for this exam");
        return;
      }

      // Loop and download each PDF report with a short delay to avoid overwhelming the browser
      for (let i = 0; i < resultsToDownload.length; i++) {
        const result = resultsToDownload[i];
        generateIndividualReportPDF(result);
        if (i < resultsToDownload.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      toast.success(`Successfully downloaded ${resultsToDownload.length} report(s)!`);
    } catch (err) {
      console.error("Error bulk downloading reports:", err);
      toast.error(err instanceof Error ? err.message : "Failed to bulk download reports");
    } finally {
      setDownloadingAll(false);
    }
  };

  const filtered = scripts.filter((s: Script) => {
    const matchSearch =
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      (s.examTitle || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: scripts.length,
    GRADED: scripts.filter((s: Script) => s.status === "GRADED").length,
    PROCESSING: scripts.filter((s: Script) => s.status === "PROCESSING").length,
    PENDING_REVIEW: scripts.filter((s: Script) => s.status === "PENDING_REVIEW")
      .length,
    UPLOADED: scripts.filter((s: Script) => s.status === "UPLOADED").length,
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const ungradedCount = scripts.filter(
    (s) => s.status === "UPLOADED" || s.status === "PROCESSING",
  ).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">
            Examination Scripts
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage and grade student answer scripts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedScriptIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={batchGrading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 size={14} /> Delete Selected ({selectedScriptIds.length})
            </button>
          )}
          <button
            onClick={() => onNavigate("upload")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f1f3d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#162b52] transition-colors"
          >
            <Upload size={14} /> Upload Scripts
          </button>
        </div>
      </div>

      {/* Exam Filter & Batch Grade Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all sm:min-w-[250px]"
            >
              <option value="all">All Examinations</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} {exam.courseCode ? `(${exam.courseCode})` : ""}
                  {exam.hasRubric ? " ✓" : " ⚠"}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
          {selectedExamId !== "all" && selectedExam && (
            <div className="flex items-center gap-2 text-xs">
              {selectedExam.hasRubric ? (
                <span className="flex items-center gap-1 text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
                  <CheckCircle2 size={11} /> Rubric: {selectedExam.rubricTitle}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  <AlertTriangle size={11} /> No rubric - Create one first
                </span>
              )}
            </div>
          )}
          {selectedExamId !== "all" && (
            <button
              onClick={handleBatchGrade}
              disabled={batchGrading || ungradedCount === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {batchGrading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Zap size={14} />
              )}
              {batchGrading ? "Grading..." : `Grade All (${ungradedCount})`}
            </button>
          )}
          {selectedExamId !== "all" && (
            <button
              onClick={handleDownloadAllReports}
              disabled={batchGrading || downloadingAll || scripts.filter(s => s.status === "GRADED" || s.status === "PENDING_REVIEW").length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {downloadingAll ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Download size={14} />
              )}
              {downloadingAll ? "Downloading..." : "Download All Reports"}
            </button>
          )}
          {selectedExamId !== "all" && (
            <button
              onClick={handleExportPDF}
              disabled={batchGrading}
              className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={14} /> Export Summary
            </button>
          )}
        </div>
        <div className="text-xs text-slate-500">
          Showing {scripts.length} script{scripts.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID, or exam…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 overflow-x-auto no-scrollbar">
          {[
            { key: "all", label: `All (${counts.all})` },
            { key: "GRADED", label: `Graded (${counts.GRADED})` },
            {
              key: "PENDING_REVIEW",
              label: `Review (${counts.PENDING_REVIEW})`,
            },
            { key: "PROCESSING", label: `Processing (${counts.PROCESSING})` },
            { key: "UPLOADED", label: `Queued (${counts.UPLOADED})` },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                statusFilter === f.key
                  ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filtered.length > 0 &&
                      filtered.every((s) => selectedScriptIds.includes(s.id))
                    }
                    disabled={batchGrading}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedScriptIds((prev) => [
                          ...new Set([...prev, ...filtered.map((s) => s.id)]),
                        ]);
                      } else {
                        setSelectedScriptIds((prev) =>
                          prev.filter(
                            (id) => !filtered.some((s) => s.id === id),
                          ),
                        );
                      }
                    }}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Student
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">
                  Examination
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 hidden sm:table-cell">
                  Uploaded
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Status
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Score
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">
                  Confidence
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 min-w-45">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((script: Script) => {
                const st = statusStyles[script.status];
                const scorePct =
                  script.score !== undefined && script.totalMarks !== undefined
                    ? Math.round((script.score / script.totalMarks) * 100)
                    : null;
                const canGrade =
                  script.status === "UPLOADED" ||
                  script.status === "PROCESSING";
                return (
                  <tr
                    key={script.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-5 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedScriptIds.includes(script.id)}
                        disabled={batchGrading}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedScriptIds((prev) => [
                              ...prev,
                              script.id,
                            ]);
                          } else {
                            setSelectedScriptIds((prev) =>
                              prev.filter((id) => id !== script.id),
                            );
                          }
                        }}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-slate-200 to-slate-300 text-[10px] font-bold text-slate-600">
                          {script.studentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-slate-800">
                            {script.studentName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {script.studentId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-[12px] text-slate-600 max-w-50 truncate">
                        {script.examTitle}
                      </p>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <p className="text-[12px] text-slate-500">
                        {script.uploadedAt}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn("h-1.5 w-1.5 rounded-full", st.dot)}
                        />
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                            st.style,
                          )}
                        >
                          {st.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {script.score !== undefined && scorePct !== null ? (
                        <div>
                          <p className="text-[13px] font-semibold text-slate-800">
                            {script.score}/{script.totalMarks}
                          </p>
                          <div className="mt-1 h-1 w-16 rounded-full bg-slate-100">
                            <div
                              className={cn(
                                "h-1 rounded-full",
                                scorePct >= 70
                                  ? "bg-teal-500"
                                  : scorePct >= 50
                                    ? "bg-amber-400"
                                    : "bg-red-400",
                              )}
                              style={{ width: `${scorePct}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[12px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {script.confidence !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-slate-100">
                            <div
                              className={cn(
                                "h-1.5 rounded-full",
                                script.confidence >= 85
                                  ? "bg-teal-500"
                                  : script.confidence >= 70
                                    ? "bg-blue-400"
                                    : "bg-amber-400",
                              )}
                              style={{ width: `${script.confidence}%` }}
                            />
                          </div>
                          <span className="text-[12px] text-slate-600 font-medium">
                            {script.confidence}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[12px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {canGrade && (
                          <button
                            onClick={() => handleGradeScript(script.id)}
                            disabled={batchGrading}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                            title="Grade this script"
                          >
                            <Zap size={12} /> Grade
                          </button>
                        )}
                        {(script.status === "GRADED" ||
                          script.status === "PENDING_REVIEW") && (
                          <button
                            onClick={() =>
                              onNavigate("results", { scriptId: script.id })
                            }
                            disabled={batchGrading}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                            title="Review grading"
                          >
                            <Eye size={12} /> Review
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(script.id)}
                          disabled={batchGrading}
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                          title="Delete script"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {filtered.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Filter size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No scripts match your filters</p>
            <p className="text-xs mt-1">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <p>
          Showing {scripts.length > 0 ? (currentPage - 1) * 15 + 1 : 0} to{" "}
          {Math.min(currentPage * 15, totalScripts)} of {totalScripts} scripts
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 font-semibold text-teal-700">
            {currentPage}
          </button>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        description={confirmState.description}
        isDestructive={confirmState.isDestructive}
        onConfirm={confirmState.onConfirm}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
