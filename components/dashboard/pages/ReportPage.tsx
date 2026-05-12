"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Download,
  CheckCircle2,
  Award,
  BarChart3,
  FileText,
  Printer,
  ChevronLeft,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import type { Page } from '@/types';
import { cn } from '@/lib/utils';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface ReportPageProps {
  onNavigate: (page: Page, params?: Record<string, string>) => void;
}

const gradeFromPct = (pct: number) => {
  if (pct >= 70) return { grade: 'A', color: 'text-teal-700', bg: 'bg-teal-50', ring: 'ring-teal-200' };
  if (pct >= 60) return { grade: 'B', color: 'text-blue-700', bg: 'bg-blue-50', ring: 'ring-blue-200' };
  if (pct >= 50) return { grade: 'C', color: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-200' };
  if (pct >= 45) return { grade: 'D', color: 'text-orange-700', bg: 'bg-orange-50', ring: 'ring-orange-200' };
  return { grade: 'F', color: 'text-red-700', bg: 'bg-red-50', ring: 'ring-red-200' };
};

export default function ReportPage({ onNavigate }: ReportPageProps) {
  const searchParams = useSearchParams();
  const resultId = searchParams.get('resultId');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradingResult, setGradingResult] = useState<any>(null);

  useEffect(() => {
    if (resultId) {
      fetchResult(resultId);
    } else {
      setLoading(false);
    }
  }, [resultId]);

  const fetchResult = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/results/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      const data = await response.json();
      setGradingResult(data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!gradingResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-sm text-slate-500">No grading result selected</p>
        <p className="text-xs text-slate-400">Select a script from the Scripts page to view its report</p>
        <button
          onClick={() => onNavigate('scripts')}
          className="rounded-lg bg-[#0f1f3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#162b52] transition-colors"
        >
          Go to Scripts
        </button>
      </div>
    );
  }

  // Calculate metrics from grading result
  const totalScore = gradingResult.totalScore || 0;
  const totalMax = gradingResult.maxScore || 100;
  const pct = Math.round((totalScore / totalMax) * 100);
  const avgConf = Math.round((gradingResult.overallConfidence || 0.8) * 100);
  const { grade, color, bg, ring } = gradeFromPct(pct);
  const radarData = gradingResult.questions?.map((q: any) => ({
    subject: q.questionNumber || 'Q',
    score: Math.round((q.score / q.maxScore) * 100)
  })) || [];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => onNavigate('results')}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft size={14} /> Back to Grading
        </button>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Printer size={13} /> Print
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-[#0f1f3d] px-4 py-2 text-xs font-medium text-white hover:bg-[#162b52] transition-colors">
            <Download size={13} /> Download PDF Report
          </button>
        </div>
      </div>

      {/* Report Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header Banner */}
        <div className="border-b border-slate-100 bg-[#0f1f3d] px-4 sm:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">TheoGrader AI — Grading Report</p>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-0.5">{gradingResult.exam?.title || 'Examination'}</h2>
              <p className="text-xs sm:text-sm text-white/60">{gradingResult.exam?.courseCode} · {gradingResult.exam?.courseName}</p>
            </div>
            <div className={cn('flex flex-col items-center justify-center rounded-xl px-5 py-3 ring-1 self-end sm:self-auto', bg, ring)}>
              <p className={cn('text-3xl sm:text-4xl font-black', color)}>{grade}</p>
              <p className={cn('text-[10px] sm:text-[11px] font-semibold', color)}>{pct}%</p>
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 border-b border-slate-100 px-8 py-5">
          {[
            { label: 'Student Name', value: gradingResult.script?.studentName || 'N/A' },
            { label: 'Student ID', value: gradingResult.script?.studentId || 'N/A' },
            { label: 'Date Graded', value: gradingResult.gradedAt ? new Date(gradingResult.gradedAt).toLocaleDateString() : 'N/A' },
            { label: 'Graded By', value: 'TheoGrader AI' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Score Summary */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 border-b border-slate-100 px-8 py-5 bg-slate-50/50">
          {[
            { label: 'Total Score', value: `${totalScore}/${totalMax}`, icon: Award, color: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Percentage', value: `${pct}%`, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Avg. Confidence', value: `${avgConf}%`, icon: CheckCircle2, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Questions', value: `${gradingResult.questions?.length || 0}`, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', item.bg)}>
                  <Icon size={16} className={item.color} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">{item.label}</p>
                  <p className="text-sm font-bold text-slate-800">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Per-Question Breakdown + Radar */}
        <div className="grid grid-cols-1 gap-0 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Table */}
          <div className="md:col-span-2 px-8 py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">Per-Question Breakdown</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-2 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Part</th>
                  <th className="pb-2 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Score</th>
                  <th className="pb-2 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Similarity</th>
                  <th className="pb-2 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Confidence</th>
                  <th className="pb-2 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {gradingResult.questions?.map((q: any, i: number) => {
                  const pct = Math.round((q.score / q.maxScore) * 100);
                  const hasMissing = q.missingConcepts && q.missingConcepts.length > 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {q.questionNumber || `Q${i + 1}`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">{q.score}/{q.maxScore}</span>
                          <div className="h-1.5 w-16 rounded-full bg-slate-100 hidden sm:block">
                            <div
                              className={cn('h-1.5 rounded-full', pct >= 80 ? 'bg-teal-500' : pct >= 60 ? 'bg-blue-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400')}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        <span className="text-sm text-slate-600">{q.similarityScore || '—'}</span>
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        <span className={cn(
                          'text-[11px] font-semibold',
                          (q.confidence || 0) >= 85 ? 'text-teal-600' : (q.confidence || 0) >= 70 ? 'text-blue-600' : 'text-amber-600'
                        )}>
                          {q.confidence || 0}%
                        </span>
                      </td>
                      <td className="py-3">
                        {hasMissing ? (
                          <div className="flex items-center gap-1 text-amber-600">
                            <AlertTriangle size={11} />
                            <span className="text-[10px] font-medium">{q.missingConcepts.length} missing</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-teal-600">
                            <CheckCircle2 size={11} />
                            <span className="text-[10px] font-medium">Complete</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }) || []}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td className="pt-3 text-xs font-bold text-slate-700 uppercase">Total</td>
                  <td className="pt-3 text-sm font-bold text-slate-900">{totalScore}/{totalMax}</td>
                  <td className="pt-3 hidden sm:table-cell text-sm text-slate-600">—</td>
                  <td className="pt-3 hidden sm:table-cell text-sm font-bold text-slate-700">{avgConf}%</td>
                  <td className="pt-3" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Radar */}
          <div className="px-8 py-5 flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">Performance Profile</p>
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Radar
                    name="Score %"
                    dataKey="score"
                    stroke="#14b8a6"
                    fill="#14b8a6"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(v) => [`${v}%`, 'Score']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold text-slate-600 mb-1">Areas for Improvement</p>
              <div className="flex flex-col gap-1">
                {gradingResult.questions?.filter((q: any) => q.missingConcepts && q.missingConcepts.length > 0)
                  .map((r: any, i: number) => (
                    <p key={i} className="text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">{r.questionNumber || `Q${i + 1}`}:</span>{' '}
                      {r.missingConcepts.join(', ')}
                    </p>
                  )) || []}
                {(!gradingResult.questions || gradingResult.questions.filter((q: any) => q.missingConcepts && q.missingConcepts.length > 0).length === 0) && (
                  <p className="text-[11px] text-slate-400 italic">No areas for improvement identified</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-8 py-4">
          <p className="text-[10px] sm:text-[11px] text-slate-400">
            This report was generated by TheoGrader AI using OCR text extraction and Sentence-BERT semantic similarity analysis.
            Confidence scores below 70% are flagged for mandatory manual review. All overrides are logged.
          </p>
        </div>
      </div>
    </div>
  );
}
