"use client";

import { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import type { Page } from '@/types';
import { type GradingResult } from '@/lib/services/grading-service';
import { cn } from '@/lib/utils';

interface ResultsPageProps {
  onNavigate: (page: Page) => void;
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
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // Mock grading result for demonstration
  useEffect(() => {
    const mockResult: GradingResult = {
      studentId: 'STU-2021-0044',
      studentName: 'Adaeze Okonkwo',
      totalScore: 68,
      maxScore: 100,
      overallConfidence: 0.82,
      questions: [
        {
          question: 'Q1. Explain database transactions and ACID properties',
          score: 38,
          maxScore: 50,
          confidence: 0.85,
          breakdown: [
            { point: 'Atomicity definition', similarity: 0.88, weight: 0.25 },
            { point: 'Consistency explanation', similarity: 0.82, weight: 0.25 },
            { point: 'Isolation concept', similarity: 0.79, weight: 0.25 },
            { point: 'Durability guarantee', similarity: 0.91, weight: 0.25 },
          ]
        },
        {
          question: 'Q2. Compare relational vs NoSQL databases',
          score: 30,
          maxScore: 50,
          confidence: 0.79,
          breakdown: [
            { point: 'Relational structure', similarity: 0.85, weight: 0.33 },
            { point: 'NoSQL flexibility', similarity: 0.76, weight: 0.33 },
            { point: 'Comparison analysis', similarity: 0.75, weight: 0.34 },
          ]
        }
      ],
      processingTime: 12450,
      extractionMethod: 'hybrid',
      status: 'completed'
    };

    // Simulate loading and then set result
    setTimeout(() => {
      setGradingResult(mockResult);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading grading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle size={24} className="text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!gradingResult) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-slate-500">No grading results available</p>
      </div>
    );
  }

  const totalScore = gradingResult.totalScore;
  const totalMax = gradingResult.maxScore;
  const avgConfidence = Math.round(gradingResult.overallConfidence * 100);
  const overallPct = Math.round((totalScore / totalMax) * 100);

  const toggleRow = (key: string) =>
    setExpandedRows((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  // Convert questions to the format expected by the UI
  const results = gradingResult.questions.flatMap((q, qIndex) => 
    q.breakdown.map((part, pIndex) => ({
      questionId: `q${qIndex + 1}`,
      questionNumber: `Q${qIndex + 1}`,
      partLabel: String.fromCharCode(97 + pIndex), // a, b, c, d...
      studentAnswer: 'Extracted student answer would go here',
      score: Math.round(part.similarity * part.weight * q.maxScore),
      maxScore: Math.round(part.weight * q.maxScore),
      similarityScore: Math.round(part.similarity * 100),
      confidence: Math.round(q.confidence * 100),
      matchedConcepts: [part.point],
      missingConcepts: []
    }))
  );

  const groupedByQ: Record<string, typeof results> = {};
  results.forEach((r) => {
    if (!groupedByQ[r.questionNumber]) groupedByQ[r.questionNumber] = [];
    groupedByQ[r.questionNumber].push(r);
  });

  const studentAnswerLines = [
    { label: 'Q1a', text: 'Atomicity means that a transaction is treated as a single unit. Either all operations succeed or none of them are applied to the database. For example, if a bank transfer fails midway, the debit is rolled back.', match: 88 },
    { label: 'Q1b', text: 'Consistency ensures the database stays valid after a transaction. It must obey all constraints and integrity rules defined in the schema.', match: 82 },
    { label: 'Q1c', text: 'Isolation means transactions run independently from each other. Multiple transactions happening at once should not interfere.', match: 67 },
    { label: 'Q1d', text: 'Durability guarantees that once committed, a transaction is permanently saved. Even if the system crashes, the data is not lost because of logs.', match: 94 },
    { label: 'Q2a', text: 'Relational databases use tables with rows and columns. They use SQL for querying and foreign keys to link tables together.', match: 76 },
    { label: 'Q2b', text: 'NoSQL document stores like MongoDB use JSON documents. They are flexible and can scale horizontally across many servers.', match: 78 },
    { label: 'Q2c', text: 'Relational databases are more consistent but harder to scale. NoSQL is more flexible and scalable for big data.', match: 71 },
  ];

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Adaeze Okonkwo — STU-2021-0044</p>
            <p className="text-xs text-slate-500">Database Systems Final · CSC 401</p>
          </div>
          <div className="hidden md:flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">{totalScore}/{totalMax}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total Score</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">{overallPct}%</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Percentage</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: confidenceColor(avgConfidence).text.replace('text-', '') }}>
                <span className={confidenceColor(avgConfidence).text}>{avgConfidence}%</span>
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Avg Confidence</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors">
            <Flag size={12} /> Flag for Review
          </button>
          <button
            onClick={() => { onNavigate('report'); }}
            className="flex items-center gap-1.5 rounded-lg bg-[#0f1f3d] px-4 py-2 text-xs font-medium text-white hover:bg-[#162b52] transition-colors"
          >
            <Save size={12} /> Finalize Result
          </button>
        </div>
      </div>

      {/* Main Split */}
      <div className="flex flex-1 min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 64px - 58px)' }}>
        {/* Left: Student Script */}
        <div className="w-[42%] shrink-0 flex flex-col border-r border-slate-200 bg-slate-50 overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Student Answers (OCR Extract)</p>
          </div>
          <div className="flex flex-col gap-3 p-5">
            {studentAnswerLines.map((item) => {
              const matchColor =
                item.match >= 85 ? 'border-l-teal-400 bg-teal-50/50' :
                item.match >= 70 ? 'border-l-blue-400 bg-blue-50/50' :
                item.match >= 55 ? 'border-l-amber-400 bg-amber-50/50' :
                'border-l-red-400 bg-red-50/50';
              const badgeColor =
                item.match >= 85 ? 'bg-teal-100 text-teal-700' :
                item.match >= 70 ? 'bg-blue-100 text-blue-700' :
                item.match >= 55 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700';
              return (
                <div key={item.label} className={cn('rounded-lg border-l-2 p-3.5 bg-white shadow-sm', matchColor)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">
                      {item.label}
                    </span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', badgeColor)}>
                      {item.match}% match
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700">{item.text}</p>
                </div>
              );
            })}
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
                          className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                          onClick={() => toggleRow(key)}
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-50 ring-1 ring-teal-200 text-[11px] font-bold text-teal-700">
                            {result.partLabel}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                                <div
                                  className={cn('h-1.5 rounded-full transition-all', scorePct >= 80 ? 'bg-teal-500' : scorePct >= 60 ? 'bg-blue-400' : scorePct >= 40 ? 'bg-amber-400' : 'bg-red-400')}
                                  style={{ width: `${scorePct}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1', cfg.bg, cfg.text, cfg.ring)}>
                                {cfg.label} confidence
                              </span>
                              <span className="text-[11px] text-slate-400">{result.similarityScore}% similarity</span>
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
                                <input title=''
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
              onClick={() => onNavigate('report')}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              Finalize & Generate Report <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
