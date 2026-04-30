"use client";

import { useState } from 'react';
import {
  Search,
  Upload,
  Filter,
  Eye,
  BarChart3,
} from 'lucide-react';
import { mockScripts } from '@/lib/mockData';
import type { Page } from '@/types';
import { cn } from '@/lib/utils';

interface ScriptsPageProps {
  onNavigate: (page: Page) => void;
}

const statusStyles: Record<string, { style: string; label: string; dot: string }> = {
  done: { style: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200', label: 'Graded', dot: 'bg-teal-400' },
  processing: { style: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', label: 'Processing', dot: 'bg-blue-400' },
  pending_review: { style: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', label: 'Needs Review', dot: 'bg-amber-400' },
  uploaded: { style: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200', label: 'Queued', dot: 'bg-slate-300' },
};

export default function ScriptsPage({ onNavigate }: ScriptsPageProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = mockScripts.filter((s) => {
    const matchSearch =
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      s.examTitle.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: mockScripts.length,
    done: mockScripts.filter((s) => s.status === 'done').length,
    processing: mockScripts.filter((s) => s.status === 'processing').length,
    pending_review: mockScripts.filter((s) => s.status === 'pending_review').length,
    uploaded: mockScripts.filter((s) => s.status === 'uploaded').length,
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Examination Scripts</h2>
          <p className="text-sm text-slate-500 mt-0.5">All uploaded student answer scripts across active examinations.</p>
        </div>
        <button
          onClick={() => onNavigate('upload')}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0f1f3d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#162b52] transition-colors"
        >
          <Upload size={14} /> Upload Scripts
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID, or exam…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {[
            { key: 'all', label: `All (${counts.all})` },
            { key: 'done', label: `Graded (${counts.done})` },
            { key: 'pending_review', label: `Review (${counts.pending_review})` },
            { key: 'processing', label: `Processing (${counts.processing})` },
            { key: 'uploaded', label: `Queued (${counts.uploaded})` },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                statusFilter === f.key
                  ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Student</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">Examination</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 hidden sm:table-cell">Uploaded</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Score</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">Confidence</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((script) => {
              const st = statusStyles[script.status];
              const scorePct = script.score !== undefined ? Math.round((script.score / script.totalMarks) * 100) : null;
              return (
                <tr key={script.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-[10px] font-bold text-slate-600">
                        {script.studentName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-slate-800">{script.studentName}</p>
                        <p className="text-[11px] text-slate-400">{script.studentId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-[12px] text-slate-600 max-w-[200px] truncate">{script.examTitle}</p>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <p className="text-[12px] text-slate-500">{script.uploadedAt}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                      <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold', st.style)}>
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
                            className={cn('h-1 rounded-full', scorePct >= 70 ? 'bg-teal-500' : scorePct >= 50 ? 'bg-amber-400' : 'bg-red-400')}
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
                            className={cn('h-1.5 rounded-full', script.confidence >= 85 ? 'bg-teal-500' : script.confidence >= 70 ? 'bg-blue-400' : 'bg-amber-400')}
                            style={{ width: `${script.confidence}%` }}
                          />
                        </div>
                        <span className="text-[12px] text-slate-600 font-medium">{script.confidence}%</span>
                      </div>
                    ) : (
                      <span className="text-[12px] text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onNavigate('results')}
                        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-teal-600 hover:bg-teal-50 transition-colors"
                      >
                        <Eye size={11} /> View
                      </button>
                      <button
                        onClick={() => onNavigate('report')}
                        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <BarChart3 size={11} /> Report
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Filter size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No scripts match your filters</p>
            <p className="text-xs mt-1">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <p>Showing {filtered.length} of {mockScripts.length} scripts</p>
        <div className="flex items-center gap-1">
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 transition-colors">Previous</button>
          <button className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 font-semibold text-teal-700">1</button>
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 transition-colors">2</button>
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
}
