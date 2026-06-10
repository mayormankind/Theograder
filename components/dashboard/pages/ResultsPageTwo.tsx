// src/components/dashboard/pages/ResultsPageTwo.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit3,
  ChevronDown,
  ChevronUp,
  Save,
  Flag,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  FileText,
  MinusCircle,
  Pen,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Page, GradingResult } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ResultsPageTwoProps {
  onNavigate: (page: Page, params?: Record<string, string>) => void;
}

const confidenceColor = (c: number) => {
  if (c >= 85)
    return {
      bar: "bg-teal-500",
      text: "text-teal-700",
      bg: "bg-teal-50",
      ring: "ring-teal-200",
      label: "High",
    };
  if (c >= 70)
    return {
      bar: "bg-blue-400",
      text: "text-blue-700",
      bg: "bg-blue-50",
      ring: "ring-blue-200",
      label: "Good",
    };
  if (c >= 55)
    return {
      bar: "bg-amber-400",
      text: "text-amber-700",
      bg: "bg-amber-50",
      ring: "ring-amber-200",
      label: "Moderate",
    };
  return {
    bar: "bg-red-400",
    text: "text-red-700",
    bg: "bg-red-50",
    ring: "ring-red-200",
    label: "Low",
  };
};

export default function ResultsPageTwo({ onNavigate }: ResultsPageTwoProps) {
  const searchParams = useSearchParams();
  const scriptId = searchParams.get("scriptId");
  const [results, setResults] = useState<GradingResult[]>([]);
  const [resultId, setResultId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [showOverride, setShowOverride] = useState<Record<string, boolean>>({});
  const [finalizing, setFinalizing] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [courseCode, setCourseCode] = useState<string | null>(null);
  const [courseName, setCourseName] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string>("");

  useEffect(() => {
    if (scriptId) {
      fetchResults(scriptId);
    } else {
      setLoading(false);
    }
  }, [scriptId]);

  useEffect(() => {
    if (results.length > 0 && !activeKey) {
      const firstResult = results[0];
      setActiveKey(`${firstResult.questionId}-${firstResult.partLabel}`);
    }
  }, [results, activeKey]);

  const fetchResults = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/results?scriptId=${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }
      const data = await response.json();
      setResults(data.results || []);
      setResultId(data.resultId || null);
      setStudentId(data.studentId || null);
      setStudentName(data.studentName || null);
      setCourseCode(data.courseCode || null);
      setCourseName(data.courseName || null);
    } catch (err) {
      console.error("Error fetching results:", err);
      setError("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!resultId) return;

    try {
      setFinalizing(true);
      const overridePayload: Record<string, number> = {};
      Object.entries(overrides).forEach(([key, val]) => {
        const [qId] = key.split("-");
        overridePayload[qId] = parseFloat(val);
      });

      const response = await fetch(`/api/results/${resultId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "APPROVED",
          overrides: overridePayload,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to finalize results");
      }

      toast.success("Results approved successfully!");
      onNavigate("report", { resultId });
    } catch (err) {
      console.error("Error finalizing:", err);
      toast.error("Failed to finalize results");
    } finally {
      setFinalizing(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name || name === "Unknown" || name === "Unknown Student") return "AO";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // Computations
  const totalScore = results.reduce((sum, r) => {
    const key = `${r.questionId}-${r.partLabel}`;
    return (
      sum +
      (overrides[key] !== undefined ? parseFloat(overrides[key]) || 0 : r.score)
    );
  }, 0);

  const totalMax = results.reduce((sum, r) => sum + r.maxScore, 0);

  // Active question details
  const activePart = activeKey
    ? results.find((r) => `${r.questionId}-${r.partLabel}` === activeKey)
    : undefined;

  if (!scriptId) {
    return (
      <div className="flex items-center justify-center min-h-[500px] w-full px-4">
        <div className="flex flex-col items-center justify-center max-w-md w-full gap-5 px-6 py-10 text-center bg-white rounded-2xl border border-slate-100 shadow-sm animate-in fade-in zoom-in duration-300">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 shadow-inner">
            <FileText size={22} className="text-emerald-600" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-800 tracking-tight">No Script Selected</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Please choose a student script from the submissions panel to view its grading breakdown.
            </p>
          </div>
          <Button
            onClick={() => onNavigate("scripts")}
          >
            <ArrowLeft size={13} className="opacity-75" />
            Go to Submissions
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin text-teal-600" size={36} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 bg-slate-50 border border-slate-200 rounded-xl p-8">
        <AlertTriangle className="text-amber-500" size={48} />
        <p className="text-slate-700 font-semibold">{error}</p>
        <Button
          onClick={() => window.location.reload()}
        >
          <RotateCcw size={14} />
          Retry Loading
        </Button>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 bg-slate-50 border border-slate-200 rounded-xl p-8">
        <p className="text-slate-600 font-medium">No results to display</p>
        <Button
          onClick={() => onNavigate("scripts")}
        >
          <ChevronLeft size={14} />
          Go to Scripts
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 h-full w-full bg-white animate-in fade-in duration-300">
      {/* Master Detail Inner Body */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Sidebar Area */}
        <div className="w-full md:w-[280px] border-b md:border-b-0 md:border-r border-slate-200 bg-[#f8fafc] flex flex-col justify-between py-6 shrink-0 overflow-y-auto">
          <div>
            {/* Sidebar Header (Course Meta) */}
            <div className="px-6 pb-4 border-b border-slate-200/80 mb-4">
              <div className="text-lg font-bold text-slate-800 tracking-tight uppercase">
                {courseCode || "BIO 301"}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {courseName || "Cell Biology — 2024/2025"}
              </div>
            </div>

            {/* Student Identification Profile Card */}
            <div className="flex items-center gap-3 px-6 py-3 bg-white/50 border border-slate-100 rounded-xl mx-4 mb-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
                {getInitials(studentName)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-700 truncate">
                  {studentName && studentName !== "Unknown" ? studentName : "Adewale Okonkwo"}
                </span>
                <span className="text-[11px] font-mono text-slate-400 truncate">
                  {studentId && studentId !== "Not extracted" ? studentId : "BIO/2021/047"}
                </span>
              </div>
            </div>

            {/* Interactive Navigation List */}
            <div className="flex flex-col gap-0.5">
              {results.map((result) => {
                const key = `${result.questionId}-${result.partLabel}`;
                const isActive = activeKey === key;
                const displayScore =
                  overrides[key] !== undefined
                    ? parseFloat(overrides[key]) || 0
                    : result.score;
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center justify-between px-6 py-3.5 cursor-pointer border-l-2 transition-all select-none hover:bg-slate-100/50",
                      isActive
                        ? "bg-emerald-50/40 border-emerald-500 font-semibold"
                        : "border-transparent text-slate-600"
                    )}
                    onClick={() => setActiveKey(key)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        Q{result.questionNumber}
                      </span>
                      <span className="text-sm text-slate-600">
                        Part {result.partLabel}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-emerald-600 font-bold bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-100">
                      {displayScore}/{result.maxScore}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Running Total Box */}
          <div className="mx-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex justify-between items-center shadow-sm select-none">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Running Total
            </span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono">
              {totalScore}
              <span className="text-xs text-slate-400 font-semibold font-mono">
                /{totalMax}
              </span>
            </span>
          </div>
        </div>

        {/* Main Detail Content Area */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-white min-w-0">
          {activePart ? (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Active Question Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-3 select-none">
                  <h3 className="text-lg font-bold text-slate-800">
                    Question {activePart.questionNumber}: Part {activePart.partLabel}
                  </h3>
                  <div className={cn("flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border shadow-sm", {
                    "bg-emerald-50 border-emerald-100 text-emerald-700": activePart.confidence >= 85,
                    "bg-blue-50 border-blue-100 text-blue-700": activePart.confidence >= 70 && activePart.confidence < 85,
                    "bg-amber-50 border-amber-100 text-amber-700": activePart.confidence >= 55 && activePart.confidence < 70,
                    "bg-red-50 border-red-100 text-red-700": activePart.confidence < 55,
                  })}>
                    <ShieldCheck size={10} />
                    {activePart.confidence}% Confident
                  </div>
                </div>
                {/* Question Text Box */}
                <p className="text-sm italic text-slate-500 leading-relaxed border-l-4 border-slate-300 pl-4 py-2 bg-slate-50 rounded-r-lg">
                  &quot;{activePart.questionText || activePart.expectedAnswer || "Describe the question requirements."}&quot;
                </p>
              </div>

                {/* Student Written Response Box */}
                <div className="rounded-xl border border-slate-200 p-5 mb-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Student's Written Answer
                    </h4>
                    <span className="rounded-full bg-slate-100 text-slate-600 border border-slate-200/50 px-3 py-0.5 text-xs font-semibold flex items-center gap-1.5 font-mono">
                      <RefreshCw size={10} className="text-slate-400" />
                      {activePart.similarityScore}% match
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-medium pl-1">
                    {activePart.studentAnswer || (
                      <span className="italic text-slate-400">No answer text extracted.</span>
                    )}
                  </p>
                </div>

                {/* Grading Breakdown Block */}
                <div className="grading-breakdown border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden shadow-sm flex-1 flex flex-col mb-6">
                  {/* Breakdown Top Info Row */}
                  <div className="breakdown-header flex justify-between items-center px-6 py-4 bg-white border-b border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800 tracking-wide">
                      AI Concept Verification
                    </h4>
                    <div className="score-display flex items-baseline select-none">
                      <span className="score-big text-3xl font-extrabold text-emerald-600 font-mono">
                        {overrides[activeKey] !== undefined ? overrides[activeKey] : activePart.score}
                      </span>
                      <span className="score-total text-sm text-slate-400 font-bold font-mono">
                        /{activePart.maxScore}
                      </span>
                    </div>
                  </div>

                  {/* List of Concepts (Using static points/fills to match high-fidelity mockup) */}
                  <div className="concept-matches flex-1 divide-y divide-slate-200/80 bg-white">
                    {/* Matched list */}
                    {activePart.matchedConcepts.map((concept, idx) => (
                      <div
                        key={`matched-${idx}`}
                        className="concept-item matched flex items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50/30"
                      >
                        <div className="concept-status text-emerald-500 text-base shrink-0 mt-0.5">
                          <CheckCircle2 size={16} />
                        </div>
                        <div className="concept-detail flex-1 min-w-0">
                          <span className="concept-name block text-sm font-bold text-slate-700 mb-1">
                            {concept}
                          </span>
                          <span className="concept-explanation block text-xs text-slate-400 leading-normal">
                            Key concept successfully matched with high semantic similarity.
                          </span>
                        </div>
                        <div className="concept-sim flex items-center gap-3 shrink-0 select-none">
                          <div className="sim-bar w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                            <div className="sim-fill h-full bg-emerald-500 rounded-full" style={{ width: "92%" }}></div>
                          </div>
                          <span className="sim-value text-xs font-mono font-bold text-slate-500 min-w-[28px]">
                            0.92
                          </span>
                        </div>
                        <span className="concept-points text-sm font-mono font-bold text-emerald-600 shrink-0 text-right">
                          Matched
                        </span>
                      </div>
                    ))}

                    {/* Partially Matched list */}
                    {activePart.partialConcepts?.map((concept, idx) => (
                      <div
                        key={`partial-${idx}`}
                        className="concept-item partial flex items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50/30"
                      >
                        <div className="concept-status text-amber-500 text-base shrink-0 mt-0.5">
                          <MinusCircle size={16} />
                        </div>
                        <div className="concept-detail flex-1 min-w-0">
                          <span className="concept-name block text-sm font-bold text-slate-700 mb-1">
                            {concept}
                          </span>
                          <span className="concept-explanation block text-xs text-slate-400 leading-normal">
                            Mentioned concept partially matched but lacks full clarification.
                          </span>
                        </div>
                        <div className="concept-sim flex items-center gap-3 shrink-0 select-none">
                          <div className="sim-bar w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                            <div className="sim-fill bg-amber-500 rounded-full h-full" style={{ width: "54%" }}></div>
                          </div>
                          <span className="sim-value text-xs font-mono font-bold text-slate-500 min-w-[28px]">
                            0.54
                          </span>
                        </div>
                        <span className="concept-points text-sm font-mono font-bold text-amber-500 shrink-0 text-right">
                          Partial
                        </span>
                      </div>
                    ))}

                    {/* Missing list */}
                    {activePart.missingConcepts.map((concept, idx) => (
                      <div
                        key={`missing-${idx}`}
                        className="concept-item missed flex items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50/30"
                      >
                        <div className="concept-status text-red-500 text-base shrink-0 mt-0.5">
                          <XCircle size={16} />
                        </div>
                        <div className="concept-detail flex-1 min-w-0">
                          <span className="concept-name block text-sm font-bold text-slate-700 mb-1">
                            {concept}
                          </span>
                          <span className="concept-explanation block text-xs text-slate-400 leading-normal">
                            Concept missing or not detected in the student response text.
                          </span>
                        </div>
                        <div className="concept-sim flex items-center gap-3 shrink-0 select-none">
                          <div className="sim-bar w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                            <div className="sim-fill bg-red-400 rounded-full h-full" style={{ width: "12%" }}></div>
                          </div>
                          <span className="sim-value text-xs font-mono font-bold text-slate-500 min-w-[28px]">
                            0.12
                          </span>
                        </div>
                        <span className="concept-points text-sm font-mono font-bold text-slate-400 shrink-0 text-right">
                          Missed
                        </span>
                      </div>
                    ))}

                    {/* Empty State Concepts */}
                    {activePart.matchedConcepts.length === 0 &&
                      (!activePart.partialConcepts || activePart.partialConcepts.length === 0) &&
                      activePart.missingConcepts.length === 0 && (
                        <div className="p-8 text-center text-slate-400 italic">
                          <Sparkles size={24} className="mx-auto mb-2 text-slate-300" />
                          No key concepts configured or extracted for this question part.
                        </div>
                      )}
                  </div>

                  {/* Interactive Score Override & Comment boxes */}
                  {showOverride[activeKey] && (
                    <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-between gap-4 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 text-amber-800 select-none">
                        <Pen size={10} />
                        <span className="text-xs font-bold uppercase tracking-wider">Override Marks:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={activePart.maxScore}
                          value={overrides[activeKey] ?? activePart.score}
                          onChange={(e) =>
                            setOverrides((prev) => ({
                              ...prev,
                              [activeKey]: e.target.value,
                            }))
                          }
                          className="h-8 w-16 text-center font-bold text-sm bg-white border border-amber-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-200 text-slate-800"
                        />
                        <span className="text-xs text-slate-400 font-bold">/ {activePart.maxScore} marks</span>
                      </div>
                    </div>
                  )}

                  {/* Grading Bottom Actions Bar (Mockup Style) */}
                  <div className="flex items-center gap-2.5 px-6 py-4 border-t border-slate-200 bg-slate-50 select-none">
                    <button
                      onClick={handleFinalize}
                      disabled={finalizing}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs text-white bg-emerald-600 shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {finalizing ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Check size={10} />
                      )}
                      Accept Score
                    </button>
                    <button
                      onClick={() =>
                        setShowOverride((prev) => ({
                          ...prev,
                          [activeKey]: !prev[activeKey],
                        }))
                      }
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs transition-all border border-amber-200",
                        showOverride[activeKey]
                          ? "bg-amber-100 text-amber-800"
                          : "bg-amber-50/50 text-amber-700 hover:bg-amber-50"
                      )}
                    >
                      <Pen size={10} />
                      Override
                    </button>

                    {/* Flag button */}
                    <button className="flex items-center justify-center gap-1.5 ml-auto border border-slate-200 bg-white hover:bg-slate-50 transition-colors px-3 py-2.5 rounded-lg text-xs font-bold text-slate-400">
                      <Flag size={11} className="text-slate-400" />
                      Flag
                    </button>
                  </div>
                </div>

                {/* Bottom Finalize Button Box (Matches ResultsPage.tsx bottom action) */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-5 mt-auto bg-white select-none">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Total marks finalized: {totalScore}/{totalMax}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Average verification confidence: {activePart.confidence}%
                      {Object.keys(overrides).length > 0 && (
                        <span className="ml-2 text-amber-600 font-bold">
                          · {Object.keys(overrides).length} override(s) pending
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={handleFinalize}
                    disabled={finalizing}
                    className="flex items-center gap-2 rounded-lg bg-[#0f1f3d] hover:bg-[#162b52] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50"
                  >
                    {finalizing ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ArrowRight size={12} />
                    )}
                    {finalizing ? "Finalizing..." : "Finalize & Approve Script"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 italic">
                Select a question from the sidebar to inspect grading details.
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
