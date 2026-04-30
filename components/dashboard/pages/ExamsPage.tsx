"use client";

import { useState } from 'react';
import { BookOpen, Plus, Search, ChevronRight, Calendar, Users, CheckCircle2, Clock, FileEdit } from 'lucide-react';
import { mockExams } from '@/lib/mockData';
import type { Page } from '@/types';
import { cn } from '@/lib/utils';

interface ExamsPageProps {
  onNavigate: (page: Page) => void;
}

const statusStyles = {
  active: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  completed: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  draft: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
};

const statusLabels = {
  active: 'Active',
  completed: 'Completed',
  draft: 'Draft',
};

export default function ExamsPage({ onNavigate }: ExamsPageProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all');

  const filtered = mockExams.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.course.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || e.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Examinations</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage your examination sessions and rubrics.</p>
        </div>
        <button
          onClick={() => onNavigate('rubrics')}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0f1f3d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#162b52] transition-colors"
        >
          <Plus size={15} />
          Create New Exam
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search by title or course code…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {(['all', 'active', 'completed', 'draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                filter === f
                  ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Exam Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((exam) => {
          const progress = exam.totalScripts > 0 ? Math.round((exam.graded / exam.totalScripts) * 100) : 0;
          return (
            <div
              key={exam.id}
              className="group flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0f1f3d]/5 ring-1 ring-[#0f1f3d]/10">
                    <BookOpen size={17} className="text-[#0f1f3d]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{exam.title}</p>
                    <p className="text-xs text-teal-600 font-medium mt-0.5">{exam.course}</p>
                  </div>
                </div>
                <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold', statusStyles[exam.status])}>
                  {statusLabels[exam.status]}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Calendar size={11} className="text-slate-400" />
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Date</p>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">{exam.date}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Users size={11} className="text-slate-400" />
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Scripts</p>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">{exam.totalScripts}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <CheckCircle2 size={11} className="text-slate-400" />
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Graded</p>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">{exam.graded}</p>
                </div>
              </div>

              {/* Progress */}
              {exam.totalScripts > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] text-slate-500">Grading progress</p>
                    <p className="text-[11px] font-semibold text-slate-700">{progress}%</p>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full bg-teal-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {exam.status === 'draft' && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                  <Clock size={12} className="text-amber-500" />
                  <p className="text-[11px] text-amber-700">No scripts uploaded yet. Add a rubric to get started.</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => onNavigate('scripts')}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Users size={12} />
                  View Scripts
                </button>
                <button
                  onClick={() => onNavigate('rubrics')}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <FileEdit size={12} />
                  Edit Rubric
                </button>
                <button
                  onClick={() => onNavigate('results')}
                  className="ml-auto flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                >
                  View Results <ChevronRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
