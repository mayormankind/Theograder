"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  AlertTriangle,
  Edit3,
  Save,
  Award,
  Loader2,
} from "lucide-react";
import { GradingResult, Page } from "@/types";
import { cn } from "@/lib/utils";

interface GradingPageProps {
  onNavigate: (page: Page) => void;
}

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 85 ? "bg-teal-500" : value >= 70 ? "bg-amber-500" : "bg-red-500";
  const text =
    value >= 85
      ? "text-teal-700"
      : value >= 70
        ? "text-amber-700"
        : "text-red-700";
  const bg =
    value >= 85 ? "bg-teal-50" : value >= 70 ? "bg-amber-50" : "bg-red-50";
  return (
    <div className={cn("rounded-lg px-3 py-2", bg)}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
          AI Confidence
        </span>
        <span className={cn("text-sm font-bold", text)}>{value}%</span>
      </div>
      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            color,
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function SimilarityRing({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "#14b8a6" : pct >= 65 ? "#f59e0b" : "#ef4444";
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="5"
        />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 30 30)"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text
          x="30"
          y="34"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="#1e293b"
        >
          {pct}%
        </text>
      </svg>
      <p className="text-[10px] text-slate-400 font-medium">Similarity</p>
    </div>
  );
}

export default function GradingPage({ onNavigate }: GradingPageProps) {
  const [results, setResults] = useState<GradingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQ, setExpandedQ] = useState<string[]>([]);
  const [editingScore, setEditingScore] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [finalized, setFinalized] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // This would typically fetch grading results from the API
    // For now, we'll keep the page in a state that requires a result ID
    setLoading(false);
  }, []);

  const toggleQ = (id: string) => {
    setExpandedQ((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const getScore = (r: GradingResult) => overrides[r.questionId] ?? r.score;
  const totalScore = results.reduce((sum: number, r: GradingResult) => sum + getScore(r), 0);
  const totalMax = results.reduce((sum: number, r: GradingResult) => sum + r.maxScore, 0);
  const avgConfidence = results.length > 0 
    ? Math.round(results.reduce((sum: number, r: GradingResult) => sum + r.confidence, 0) / results.length)
    : 0;

  const groupedResults: Record<string, GradingResult[]> = {};
  results.forEach((r: GradingResult) => {
    if (!groupedResults[r.questionNumber])
      groupedResults[r.questionNumber] = [];
    groupedResults[r.questionNumber].push(r);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-slate-600">Failed to load grading results</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-[#0f1f3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#162b52] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-slate-600">No grading results to display</p>
        <p className="text-sm text-slate-400">Select a script from the Scripts page to view grading results</p>
        <button
          onClick={() => onNavigate('scripts')}
          className="rounded-lg bg-[#0f1f3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#162b52] transition-colors"
        >
          Go to Scripts
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Summary Bar */}
      <div className="flex items-center gap-4 px-6 py-3 bg-white border-b border-slate-200 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#0f1e36]/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#0f1e36]">EM</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Esi Mensah</p>
            <p className="text-[10px] text-slate-400">
              ID: 10987301 · Database Systems — Final Examination
            </p>
          </div>
        </div>
        <div className="h-8 w-px bg-slate-200 hidden md:block" />
        <div className="flex items-center gap-5 flex-wrap">
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800">
              {totalScore}
              <span className="text-sm text-slate-400 font-normal">
                /{totalMax}
              </span>
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">
              Total Score
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800">
              {Math.round((totalScore / totalMax) * 100)}
              <span className="text-sm text-slate-400 font-normal">%</span>
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">
              Percentage
            </p>
          </div>
          <div className="text-center">
            <p
              className={cn(
                "text-lg font-bold",
                avgConfidence >= 85
                  ? "text-teal-600"
                  : avgConfidence >= 70
                    ? "text-amber-600"
                    : "text-red-600",
              )}
            >
              {avgConfidence}
              <span className="text-sm font-normal text-slate-400">%</span>
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">
              Avg. Confidence
            </p>
          </div>
        </div>
        <div className="flex-1" />
        {!finalized ? (
          <button
            onClick={() => setFinalized(true)}
            className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Award size={15} />
            Finalize Result
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-teal-600 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg">
              <CheckCircle2 size={14} /> Result Finalized
            </span>
            <button
              onClick={() => onNavigate("report")}
              className="flex items-center gap-2 bg-[#0f1e36] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a2f4e] transition-colors"
            >
              View Report <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left — Student Answers */}
        <div className="flex-1 overflow-y-auto border-r border-slate-200 bg-slate-50/30">
          <div className="p-5 space-y-4 max-w-170">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Student&apos;s Extracted Answers
              </p>
              <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-medium">
                OCR Output
              </span>
            </div>

            {Object.entries(groupedResults).map(([qNum, qResults]) => (
              <div
                key={qNum}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <div className="px-4 py-3 bg-[#0f1e36] flex items-center gap-2">
                  <span className="text-xs font-bold text-teal-400">
                    {qNum}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {qNum === "Q1"
                      ? "Relational Database Concepts"
                      : "SQL and Query Optimization"}
                  </span>
                </div>
                {qResults.map((r) => (
                  <div
                    key={r.questionId}
                    className="p-4 border-b border-slate-50 last:border-0"
                  >
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                      Part ({r.partLabel})
                    </p>
                    {/* Highlighted answer text */}
                    <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100">
                      {r.studentAnswer.split(" ").map((word, wi) => {
                        const matchedWord = r.matchedConcepts.some((concept) =>
                          concept
                            .toLowerCase()
                            .split(" ")
                            .some((cw) => word.toLowerCase().includes(cw)),
                        );
                        return (
                          <span
                            key={wi}
                            className={cn(
                              "transition-colors",
                              matchedWord
                                ? "bg-teal-100 text-teal-800 rounded px-0.5"
                                : "",
                            )}
                          >
                            {word}{" "}
                          </span>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-[10px] text-teal-600">
                        <span className="w-2.5 h-2.5 rounded-sm bg-teal-200 inline-block" />
                        Matched concept
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Grading Breakdown */}
        <div className="w-100 shrink-0 overflow-y-auto bg-white">
          <div className="p-5 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              AI Grading Breakdown
            </p>

            {results.map((r) => {
              const isExpanded = expandedQ.includes(r.questionId);
              const score = getScore(r);
              const isOverridden = overrides[r.questionId] != null;
              const isEditing = editingScore === r.questionId;

              return (
                <div
                  key={r.questionId}
                  className={cn(
                    "rounded-xl border overflow-hidden transition-all duration-200",
                    isOverridden ? "border-amber-200" : "border-slate-200",
                  )}
                >
                  {/* Question Header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleQ(r.questionId)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {r.questionNumber} ({r.partLabel})
                      </p>
                    </div>

                    {/* Score display / edit */}
                    <div className="flex items-center gap-1.5">
                      {isEditing ? (
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            title="set score"
                            type="number"
                            min={0}
                            max={r.maxScore}
                            defaultValue={score}
                            autoFocus
                            className="w-12 text-center bg-amber-50 border border-amber-300 rounded text-sm font-bold text-amber-800 outline-none py-0.5"
                            onChange={(e) =>
                              setOverrides((prev) => ({
                                ...prev,
                                [r.questionId]: Number(e.target.value),
                              }))
                            }
                          />
                          <span className="text-xs text-slate-400">
                            /{r.maxScore}
                          </span>
                          <button
                            title="save"
                            onClick={() => setEditingScore(null)}
                            className="w-6 h-6 rounded bg-teal-100 flex items-center justify-center text-teal-600 hover:bg-teal-200 ml-1"
                          >
                            <Save size={11} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "text-sm font-bold",
                              isOverridden
                                ? "text-amber-700"
                                : "text-slate-800",
                            )}
                          >
                            {score}
                          </span>
                          <span className="text-xs text-slate-400">
                            /{r.maxScore}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingScore(r.questionId);
                            }}
                            className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                            title="Override score"
                          >
                            <Edit3 size={10} />
                          </button>
                        </div>
                      )}
                    </div>

                    {isOverridden && (
                      <span className="text-[9px] font-semibold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded uppercase tracking-wide">
                        Override
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp
                        size={14}
                        className="text-slate-400 shrink-0"
                      />
                    ) : (
                      <ChevronDown
                        size={14}
                        className="text-slate-400 shrink-0"
                      />
                    )}
                  </div>

                  {/* Expanded breakdown */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
                      {/* Similarity + Confidence */}
                      <div className="flex items-start gap-3 pt-3">
                        <SimilarityRing value={r.similarityScore} />
                        <div className="flex-1">
                          <ConfidenceBar value={r.confidence} />
                        </div>
                      </div>

                      {/* Matched concepts */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <CheckCircle2 size={12} className="text-teal-500" />
                          <p className="text-[11px] font-semibold text-teal-700 uppercase tracking-wide">
                            Matched Concepts
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {r.matchedConcepts.map((c) => (
                            <span
                              key={c}
                              className="text-[11px] bg-teal-50 border border-teal-200 text-teal-700 px-2 py-0.5 rounded-full font-medium"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Missing concepts */}
                      {r.missingConcepts.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <XCircle size={12} className="text-red-400" />
                            <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wide">
                              Missing Concepts
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {r.missingConcepts.map((c) => (
                              <span
                                key={c}
                                className="text-[11px] bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded-full font-medium"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Model Answer Reference */}
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                          Model Answer (Rubric)
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {r.expectedAnswer}
                        </p>
                      </div>

                      {/* Low confidence warning */}
                      {r.confidence < 80 && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                          <AlertTriangle
                            size={13}
                            className="text-amber-500 shrink-0 mt-0.5"
                          />
                          <p className="text-xs text-amber-700">
                            Low confidence — manual review recommended.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Final Score Summary */}
            <div className="bg-[#0f1e36] rounded-xl p-4 mt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Score Summary
              </p>
              <div className="space-y-2 mb-4">
                {results.map((r) => (
                  <div
                    key={r.questionId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-400">
                      {r.questionNumber} ({r.partLabel})
                    </span>
                    <span className="font-semibold text-white">
                      {getScore(r)}/{r.maxScore}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">
                  Total
                </span>
                <span className="text-lg font-bold text-teal-400">
                  {totalScore}/{totalMax}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-slate-500">Percentage</span>
                <span className="text-sm font-semibold text-teal-300">
                  {Math.round((totalScore / totalMax) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
