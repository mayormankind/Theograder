"use client";

import {
  Download,
  CheckCircle2,
  Award,
  BarChart3,
  FileText,
  Printer,
  ChevronLeft,
  AlertTriangle,
} from 'lucide-react';
import { mockGradingResults } from '@/lib/mockData';
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
  onNavigate: (page: Page) => void;
}

const radarData = [
  { subject: 'Q1a', score: 80 },
  { subject: 'Q1b', score: 80 },
  { subject: 'Q1c', score: 60 },
  { subject: 'Q1d', score: 100 },
  { subject: 'Q2a', score: 75 },
  { subject: 'Q2b', score: 75 },
  { subject: 'Q2c', score: 75 },
];

const gradeFromPct = (pct: number) => {
  if (pct >= 70) return { grade: 'A', color: 'text-teal-700', bg: 'bg-teal-50', ring: 'ring-teal-200' };
  if (pct >= 60) return { grade: 'B', color: 'text-blue-700', bg: 'bg-blue-50', ring: 'ring-blue-200' };
  if (pct >= 50) return { grade: 'C', color: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-200' };
  if (pct >= 45) return { grade: 'D', color: 'text-orange-700', bg: 'bg-orange-50', ring: 'ring-orange-200' };
  return { grade: 'F', color: 'text-red-700', bg: 'bg-red-50', ring: 'ring-red-200' };
};

export default function ReportPage({ onNavigate }: ReportPageProps) {
  const totalScore = mockGradingResults.reduce((a, r) => a + r.score, 0);
  const totalMax = mockGradingResults.reduce((a, r) => a + r.maxScore, 0);
  const pct = Math.round((totalScore / totalMax) * 100);
  const avgConf = Math.round(mockGradingResults.reduce((a, r) => a + r.confidence, 0) / mockGradingResults.length);
  const { grade, color, bg, ring } = gradeFromPct(pct);

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
        <div className="border-b border-slate-100 bg-[#0f1f3d] px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">AutoGrade AI — Grading Report</p>
              <h2 className="text-xl font-bold text-white mb-0.5">Database Systems — Final Examination</h2>
              <p className="text-sm text-white/60">CSC 401 · Faculty of Computing Sciences · University of Lagos</p>
            </div>
            <div className={cn('flex flex-col items-center justify-center rounded-xl px-5 py-3 ring-1', bg, ring)}>
              <p className={cn('text-4xl font-black', color)}>{grade}</p>
              <p className={cn('text-[11px] font-semibold', color)}>{pct}%</p>
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 border-b border-slate-100 px-8 py-5">
          {[
            { label: 'Student Name', value: 'Adaeze Okonkwo' },
            { label: 'Student ID', value: 'STU-2021-0044' },
            { label: 'Date Graded', value: '2025-05-16' },
            { label: 'Graded By', value: 'AutoGrade AI + Dr. Eze' },
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
            { label: 'Questions', value: `${[...new Set(mockGradingResults.map(r => r.questionNumber))].length} (${mockGradingResults.length} parts)`, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100' },
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
                {mockGradingResults.map((r, i) => {
                  const pct = Math.round((r.score / r.maxScore) * 100);
                  const hasMissing = r.missingConcepts.length > 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {r.questionNumber}{r.partLabel}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">{r.score}/{r.maxScore}</span>
                          <div className="h-1.5 w-16 rounded-full bg-slate-100 hidden sm:block">
                            <div
                              className={cn('h-1.5 rounded-full', pct >= 80 ? 'bg-teal-500' : pct >= 60 ? 'bg-blue-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400')}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        <span className="text-sm text-slate-600">{r.similarityScore}%</span>
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        <span className={cn(
                          'text-[11px] font-semibold',
                          r.confidence >= 85 ? 'text-teal-600' : r.confidence >= 70 ? 'text-blue-600' : 'text-amber-600'
                        )}>
                          {r.confidence}%
                        </span>
                      </td>
                      <td className="py-3">
                        {hasMissing ? (
                          <div className="flex items-center gap-1 text-amber-600">
                            <AlertTriangle size={11} />
                            <span className="text-[10px] font-medium">{r.missingConcepts.length} missing</span>
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
                })}
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
                {mockGradingResults
                  .filter((r) => r.missingConcepts.length > 0)
                  .map((r, i) => (
                    <p key={i} className="text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">{r.questionNumber}{r.partLabel}:</span>{' '}
                      {r.missingConcepts.join(', ')}
                    </p>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-8 py-4">
          <p className="text-[11px] text-slate-400">
            This report was generated by AutoGrade AI using OCR text extraction and Sentence-BERT semantic similarity analysis.
            Confidence scores below 70% are flagged for mandatory manual review. All overrides are logged.
          </p>
        </div>
      </div>
    </div>
  );
}
