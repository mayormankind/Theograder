"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Sparkles,
  Loader2,
} from 'lucide-react';
import type { Page, GradingResult } from '@/types';
import { cn } from '@/lib/utils';

interface ResultsPageProps {
  onNavigate: (page: Page, params?: Record<string, string>) => void;
}

const confidenceColor = (c: number) => {
  if (c >= 85) return { bar: 'bg-teal-500', text: 'text-teal-700', bg: 'bg-teal-50', ring: 'ring-teal-200', label: 'High' };
  if (c >= 70) return { bar: 'bg-blue-400', text: 'text-blue-700', bg: 'bg-blue-50', ring: 'ring-blue-200', label: 'Good' };
  if (c >= 55) return { bar: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-200', label: 'Moderate' };
  return { bar: 'bg-red-400', text: 'text-red-700', bg: 'bg-red-50', ring: 'ring-red-200', label: 'Low' };
};

const ScoreGauge = ({ score, max }: { score: number; max: number }) => {
  const pct = (score / max) * 100;
  const color = pct >= 80 ? '#14b8a6' : pct >= 60 ? '#60a5fa' : pct >= 40 ? '#fbbf24' : '#f87171';
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg className="-rotate-90" viewBox="0 0 72 72" width="64" height="64">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-sm font-bold text-slate-800 leading-none">{score}</p>
        <p className="text-[9px] text-slate-400 leading-none">/{max}</p>
      </div>
    </div>
  );
};

export default function ResultsPage({ onNavigate }: ResultsPageProps) {
  const searchParams = useSearchParams();
  const scriptId = searchParams.get('scriptId');
  const [results, setResults] = useState<GradingResult[]>([]);
  const [resultId, setResultId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (scriptId) {
      fetchResults(scriptId);
    } else {
      setLoading(false);
      setError('No script ID provided');
    }
  }, [scriptId]);

  const fetchResults = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/results?scriptId=${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      const data = await response.json();
      setResults(data.results || []);
      setResultId(data.resultId || null);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!resultId) return;

    try {
      setFinalizing(true);
      // Map overrides to questionResultId -> score
      const overridePayload: Record<string, number> = {};
      Object.entries(overrides).forEach(([key, val]) => {
        const [qId] = key.split('-');
        overridePayload[qId] = parseFloat(val);
      });

      const response = await fetch(`/api/results/${resultId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'APPROVED',
          overrides: overridePayload,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to finalize results');
      }

      onNavigate('report', { resultId });
    } catch (err) {
      console.error('Error finalizing:', err);
      alert('Failed to finalize results');
    } finally {
      setFinalizing(false);
    }
  };

  const toggleRow = (key: string) => {
    setExpandedRows(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const totalScore = results.reduce((sum, r) => {
    const key = `${r.questionId}-${r.partLabel}`;
    return sum + (overrides[key] !== undefined ? parseFloat(overrides[key]) || 0 : r.score);
  }, 0);

  const totalMax = results.reduce((sum, r) => sum + r.maxScore, 0);
  const overallPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
  const avgConfidence = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length)
    : 0;

  const groupedByQ: Record<string, GradingResult[]> = {};
  results.forEach((r) => {
    if (!groupedByQ[r.questionNumber]) groupedByQ[r.questionNumber] = [];
    groupedByQ[r.questionNumber].push(r);
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
        <p className="text-slate-600">{error}</p>
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
        <p className="text-slate-600">No results to display</p>
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
    <div className="flex flex-col gap-0 h-full">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-3.5 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Grading Results</p>
            <p className="text-[11px] text-slate-500">Script ID: {scriptId}</p>
          </div>
          <div className="flex items-center gap-4 border-t border-slate-100 pt-3 md:border-t-0 md:border-l md:pl-4 md:pt-0">
            <div className="text-center">
              <p className="text-base md:text-lg font-bold text-slate-900">{totalScore}/{totalMax}</p>
              <p className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-wide">Total Score</p>
            </div>
            <div className="text-center">
              <p className="text-base md:text-lg font-bold text-slate-900">{overallPct}%</p>
              <p className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-wide">Percentage</p>
            </div>
            <div className="text-center">
              <p className="text-base md:text-lg font-bold" style={{ color: confidenceColor(avgConfidence).text.replace('text-', '') }}>
                <span className={confidenceColor(avgConfidence).text}>{avgConfidence}%</span>
              </p>
              <p className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-wide">Avg Confidence</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors md:flex-none">
            <Flag size={12} /> <span className="sm:inline">Flag</span>
          </button>
          <button
            onClick={handleFinalize}
            disabled={finalizing}
            className="flex flex-2 items-center justify-center gap-1.5 rounded-lg bg-[#0f1f3d] px-4 py-2 text-xs font-medium text-white hover:bg-[#162b52] disabled:opacity-50 transition-colors md:flex-none"
          >
            {finalizing ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} 
            {finalizing ? 'Saving...' : 'Finalize'}
          </button>
        </div>
      </div>

      {/* Main Split */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Left: Student Script */}
        <div className="w-full lg:w-[40%] shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 overflow-y-auto max-h-[35vh] lg:max-h-none">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-3">
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Student Answers (OCR Extract)</p>
          </div>
          <div className="flex flex-col gap-3 p-4">
            {results.map((result) => (
              <div key={result.questionId} className="rounded-lg border-l-2 border-teal-400 bg-white p-3.5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">
                    {result.questionNumber} ({result.partLabel})
                  </span>
                  <span className="rounded-full bg-teal-100 text-teal-700 px-2 py-0.5 text-[10px] font-semibold">
                    {Math.round(result.similarityScore)}% match
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700">{result.studentAnswer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Grading Breakdown */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">AI Grading Breakdown</p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Sparkles size={11} className="text-teal-500" />
              Powered by Sentence-BERT
            </div>
          </div>

          <div className="flex flex-col gap-0 divide-y divide-slate-100">
            {Object.entries(groupedByQ).map(([qNum, parts]) => {
              const qTotal = parts.reduce((a, p) => {
                const key = `${p.questionId}-${p.partLabel}`;
                return a + (overrides[key] !== undefined ? parseFloat(overrides[key]) || 0 : p.score);
              }, 0);
              const qMax = parts.reduce((a, p) => a + p.maxScore, 0);
              return (
                <div key={qNum}>
                  <div className="flex items-center justify-between bg-slate-50 px-5 py-2.5">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">{qNum}</p>
                    <span className="text-xs font-semibold text-slate-600">
                      {qTotal}/{qMax} marks
                    </span>
                  </div>
                  {parts.map((result) => {
                    const key = `${result.questionId}-${result.partLabel}`;
                    const isExpanded = expandedRows.includes(key);
                    const cfg = confidenceColor(result.confidence);
                    const displayScore = overrides[key] !== undefined ? parseFloat(overrides[key]) || 0 : result.score;
                    const scorePct = (displayScore / result.maxScore) * 100;

                    return (
                      <div key={key} className="border-t border-slate-50">
                        {/* Row Header */}
                        <div
                          className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3.5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                          onClick={() => toggleRow(key)}
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-50 ring-1 ring-teal-200 text-[11px] font-bold text-teal-700">
                            {result.partLabel}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                                <div
                                  className={cn('h-1.5 rounded-full transition-all', scorePct >= 80 ? 'bg-teal-500' : scorePct >= 60 ? 'bg-blue-400' : scorePct >= 40 ? 'bg-amber-400' : 'bg-red-400')}
                                  style={{ width: `${scorePct}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn('rounded-full px-2 py-0.5 text-[9px] md:text-[10px] font-semibold ring-1', cfg.bg, cfg.text, cfg.ring)}>
                                {cfg.label}
                              </span>
                              <span className="text-[9px] md:text-[11px] text-slate-400">{result.similarityScore}% similarity</span>
                            </div>
                          </div>
                          <ScoreGauge score={displayScore} max={result.maxScore} />
                          {isExpanded ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
                        </div>

                        {/* Expanded Detail */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-4">
                              {/* Matched Concepts */}
                              <div className="rounded-lg border border-teal-100 bg-white p-3">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <CheckCircle2 size={12} className="text-teal-500" />
                                  <p className="text-[11px] font-semibold text-teal-700">Matched Concepts</p>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {result.matchedConcepts.map((c, i) => (
                                    <span key={i} className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 ring-1 ring-teal-200">
                                      ✓ {c}
                                    </span>
                                  ))}
                                  {result.matchedConcepts.length === 0 && (
                                    <span className="text-[11px] text-slate-400 italic">None detected</span>
                                  )}
                                </div>
                              </div>

                              {/* Missing Concepts */}
                              <div className="rounded-lg border border-red-100 bg-white p-3">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <XCircle size={12} className="text-red-400" />
                                  <p className="text-[11px] font-semibold text-red-600">Missing Concepts</p>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {result.missingConcepts.map((c, i) => (
                                    <span key={i} className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 ring-1 ring-red-200">
                                      ✗ {c}
                                    </span>
                                  ))}
                                  {result.missingConcepts.length === 0 && (
                                    <span className="text-[11px] text-teal-600 font-medium">All key concepts present ✓</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Confidence Bar */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-[11px] font-semibold text-slate-500">Confidence Score</p>
                                <span className={cn('text-[11px] font-bold', cfg.text)}>{result.confidence}%</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-100">
                                <div
                                  className={cn('h-2 rounded-full transition-all', cfg.bar)}
                                  style={{ width: `${result.confidence}%` }}
                                />
                              </div>
                            </div>

                            {result.confidence < 70 && (
                              <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                                <AlertTriangle size={12} className="mt-0.5 text-amber-500 shrink-0" />
                                <p className="text-[11px] text-amber-700">
                                  Low confidence — manual review recommended before finalising this score.
                                </p>
                              </div>
                            )}

                            {/* Score Override */}
                            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                              <Edit3 size={12} className="text-slate-400 shrink-0" />
                              <p className="text-[11px] font-medium text-slate-600">Score Override</p>
                              <div className="flex items-center gap-1.5 ml-auto">
                                <input
                                  type="number"
                                  min={0}
                                  max={result.maxScore}
                                  value={overrides[key] ?? result.score}
                                  onChange={(e) =>
                                    setOverrides((prev) => ({ ...prev, [key]: e.target.value }))
                                  }
                                  className="h-8 w-14 rounded-lg border border-slate-200 bg-slate-50 px-2 text-center text-sm font-bold text-slate-800 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100"
                                />
                                <span className="text-[12px] text-slate-500">/ {result.maxScore}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Final Action */}
          <div className="sticky bottom-0 flex items-center justify-between border-t border-slate-200 bg-white px-5 py-4">
            <div>
              <p className="text-sm font-bold text-slate-800">
                Total: {totalScore}/{totalMax} ({overallPct}%)
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Avg. confidence: {avgConfidence}%
                {Object.keys(overrides).length > 0 && (
                  <span className="ml-2 text-amber-600 font-medium">· {Object.keys(overrides).length} override(s) applied</span>
                )}
              </p>
            </div>
            <button
              onClick={handleFinalize}
              disabled={finalizing}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {finalizing ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              {finalizing ? 'Finalising...' : 'Finalize & Generate Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}