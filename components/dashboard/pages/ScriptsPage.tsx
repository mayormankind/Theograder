//components/dashboard/pages/ScriptsPage.tsx
"use client";

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import type { Page } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Script {
  id: string;
  fileName: string;
  studentName: string;
  studentId: string;
  examId: string;
  examTitle?: string;
  status: 'UPLOADED' | 'PROCESSING' | 'PENDING_REVIEW' | 'GRADED';
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

const statusStyles: Record<string, { style: string; label: string; dot: string }> = {
  GRADED: { style: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200', label: 'Graded', dot: 'bg-teal-400' },
  PROCESSING: { style: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', label: 'Processing', dot: 'bg-blue-400' },
  PENDING_REVIEW: { style: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', label: 'Needs Review', dot: 'bg-amber-400' },
  UPLOADED: { style: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200', label: 'Queued', dot: 'bg-slate-300' },
};

export default function ScriptsPage({ onNavigate }: ScriptsPageProps) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [batchGrading, setBatchGrading] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchScripts();
  }, []);

  useEffect(() => {
    fetchScripts();
  }, [selectedExamId]);

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/exams');
      if (!response.ok) {
        throw new Error('Failed to fetch exams');
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
              rubricTitle: rubricsData.rubrics && rubricsData.rubrics.length > 0 
                ? rubricsData.rubrics[0].title 
                : undefined,
            };
          }
          return { ...exam, hasRubric: false };
        })
      );
      
      setExams(examsWithRubricStatus);
    } catch (err) {
      console.error('Error fetching exams:', err);
    }
  };

  const fetchScripts = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = selectedExamId === 'all' 
        ? '/api/upload' 
        : `/api/upload?examId=${selectedExamId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch scripts');
      }
      const data = await response.json();
      setScripts(data.scripts || []);
    } catch (err) {
      console.error('Error fetching scripts:', err);
      setError('Failed to load scripts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (scriptId: string) => {
    if (!confirm('Are you sure you want to delete this script? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/upload/${scriptId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete script');
      }

      setScripts(scripts.filter(s => s.id !== scriptId));
      toast.success('Script deleted successfully');
    } catch (err) {
      console.error('Error deleting script:', err);
      toast.error('Failed to delete script');
    }
  };

  const handleGradeScript = async (scriptId: string) => {
    const selectedExam = exams.find(e => e.id === selectedExamId);
    if (selectedExamId !== 'all' && !selectedExam?.hasRubric) {
      toast.error('Please create a rubric for this exam before grading');
      return;
    }

    try {
      const response = await fetch('/api/grading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to grade script');
      }

      toast.success('Script graded successfully');
      fetchScripts();
    } catch (err) {
      console.error('Error grading script:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to grade script');
    }
  };

  const handleBatchGrade = async () => {
    if (selectedExamId === 'all') {
      toast.error('Please select an exam to grade');
      return;
    }

    const selectedExam = exams.find(e => e.id === selectedExamId);
    if (!selectedExam?.hasRubric) {
      toast.error('Please create a rubric for this exam before grading');
      return;
    }

    const ungradedScripts = scripts.filter(s => s.status === 'UPLOADED' || s.status === 'PROCESSING');
    if (ungradedScripts.length === 0) {
      toast.error('No ungraded scripts for this exam');
      return;
    }

    if (!confirm(`Grade ${ungradedScripts.length} script(s) for this exam? This may take a while.`)) {
      return;
    }

    setBatchGrading(true);
    try {
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Batch Grade - ${new Date().toLocaleDateString()}`,
          examId: selectedExamId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start batch grading');
      }

      toast.success(`Started grading ${ungradedScripts.length} script(s)`);
      onNavigate('processing');
    } catch (err) {
      console.error('Error starting batch grade:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to start batch grading');
    } finally {
      setBatchGrading(false);
    }
  };

  const filtered = scripts.filter((s: Script) => {
    const matchSearch =
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      (s.examTitle || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: scripts.length,
    GRADED: scripts.filter((s: Script) => s.status === 'GRADED').length,
    PROCESSING: scripts.filter((s: Script) => s.status === 'PROCESSING').length,
    PENDING_REVIEW: scripts.filter((s: Script) => s.status === 'PENDING_REVIEW').length,
    UPLOADED: scripts.filter((s: Script) => s.status === 'UPLOADED').length,
  };

  const selectedExam = exams.find(e => e.id === selectedExamId);
  const ungradedCount = scripts.filter(s => s.status === 'UPLOADED' || s.status === 'PROCESSING').length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Examination Scripts</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage and grade student answer scripts by examination.</p>
        </div>
        <button
          onClick={() => onNavigate('upload')}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0f1f3d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#162b52] transition-colors"
        >
          <Upload size={14} /> Upload Scripts
        </button>
      </div>

      {/* Exam Filter & Batch Grade Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="h-10 appearance-none rounded-lg border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all min-w-[250px]"
            >
              <option value="all">All Examinations</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} {exam.courseCode ? `(${exam.courseCode})` : ''}
                  {exam.hasRubric ? ' ✓' : ' ⚠'}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          {selectedExamId !== 'all' && selectedExam && (
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
          {selectedExamId !== 'all' && (
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
              {batchGrading ? 'Grading...' : `Grade All (${ungradedCount})`}
            </button>
          )}
        </div>
        <div className="text-xs text-slate-500">
          Showing {scripts.length} script{scripts.length !== 1 ? 's' : ''}
        </div>
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
            { key: 'GRADED', label: `Graded (${counts.GRADED})` },
            { key: 'PENDING_REVIEW', label: `Review (${counts.PENDING_REVIEW})` },
            { key: 'PROCESSING', label: `Processing (${counts.PROCESSING})` },
            { key: 'UPLOADED', label: `Queued (${counts.UPLOADED})` },
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
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : (
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
              {filtered.map((script: Script) => {
                const st = statusStyles[script.status];
                const scorePct = script.score !== undefined && script.totalMarks !== undefined
    ? Math.round((script.score / script.totalMarks) * 100)
    : null;
                const canGrade = script.status === 'UPLOADED' || script.status === 'PROCESSING';
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
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {canGrade && (
                        <button
                          onClick={() => handleGradeScript(script.id)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-teal-600 hover:bg-teal-50 transition-colors"
                          title="Grade this script"
                        >
                          <Zap size={11} /> Grade
                        </button>
                      )}
                      {script.status === 'GRADED' && (
                        <button
                          onClick={() => onNavigate('grading', { scriptId: script.id })}
                          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View grading details"
                        >
                          <Eye size={11} /> Review
                        </button>
                      )}
                      <button
                        onClick={() => onNavigate('results', { scriptId: script.id })}
                        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        title="View results"
                      >
                        <BarChart3 size={11} /> Results
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
            <p className="text-xs mt-1">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <p>Showing {filtered.length} of {scripts.length} scripts</p>
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
