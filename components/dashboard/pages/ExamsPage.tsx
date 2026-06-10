"use client";

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Calendar, Users, CheckCircle2, FileEdit, Edit2, Trash2, AlertCircle } from 'lucide-react';
import type { Page } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/page-loader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ExamsPageProps {
  onNavigate: (page: Page) => void;
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  courseCode?: string;
  courseName?: string;
  totalMarks: number;
  duration?: number;
  examDate?: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  rubrics?: Array<{
    id: string;
    title: string;
  }>;
  _count?: {
    scripts: number;
    graded: number;
  };
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Not set';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (e) {
    return dateStr;
  }
};

const formatInputDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch (e) {
    return '';
  }
};

export default function ExamsPage({ onNavigate }: ExamsPageProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    courseCode: string;
    courseName: string;
    totalMarks: number;
    duration: number;
    examDate: string;
    status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  }>({
    title: '',
    description: '',
    courseCode: '',
    courseName: '',
    totalMarks: 100,
    duration: 120,
    examDate: '',
    status: 'DRAFT',
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/exams');
      if (!response.ok) {
        throw new Error('Failed to fetch exams');
      }
      
      const data = await response.json();
      setExams(data.exams || []);
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError(err instanceof Error ? err.message : 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const filtered = exams.filter((e) => {
    const matchSearch =
      (e.title?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (e.courseCode?.toLowerCase() || '').includes(search.toLowerCase());
    const matchFilter = filter === 'all' || e.status === filter;
    return matchSearch && matchFilter;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    
    try {
      setSubmitting(true);
      const url = editingExam ? `/api/exams/${editingExam.id}` : '/api/exams';
      const method = editingExam ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save exam');
      }

      if (editingExam) {
        setExams(exams.map(exam => 
          exam.id === editingExam.id ? { ...exam, ...formData } : exam
        ));
        toast.success('Exam updated successfully');
      } else {
        const newExam = await response.json();
        setExams([...exams, { ...newExam, _count: { scripts: 0, graded: 0 } }]);
        toast.success('Exam created successfully');
      }

      setShowCreateModal(false);
      setShowEditModal(false);
      setEditingExam(null);
      setFormData({
        title: '',
        description: '',
        courseCode: '',
        courseName: '',
        totalMarks: 100,
        duration: 120,
        examDate: '',
        status: 'DRAFT',
      });
    } catch (err) {
      console.error('Error saving exam:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save exam');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      description: exam.description || '',
      courseCode: exam.courseCode || '',
      courseName: exam.courseName || '',
      totalMarks: exam.totalMarks,
      duration: exam.duration || 120,
      examDate: formatInputDate(exam.examDate),
      status: exam.status as 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED',
    });
    setShowEditModal(true);
  };

  const handleDelete = async (examId: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Exam',
      description: 'Are you sure you want to delete this exam? This action cannot be undone.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/exams/${examId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete exam');
          }

          setExams(exams.filter(exam => exam.id !== examId));
          toast.success('Exam deleted successfully');
        } catch (err) {
          console.error('Error deleting exam:', err);
          toast.error(err instanceof Error ? err.message : 'Failed to delete exam');
        }
      },
    });
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <AlertCircle size={28} className="text-slate-300" />
        <p className="text-sm text-slate-600">Failed to load exams</p>
        <Button variant="outline" size="sm" onClick={fetchExams}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Examinations</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage your examination sessions and rubrics.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus size={15} />
          New Exam
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 overflow-x-auto no-scrollbar">
          {(['all', 'DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap',
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
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-5">
          <BookOpen size={48} className="text-slate-300 mb-4" />
          <p className="text-sm font-medium text-slate-600">No exams found</p>
          <p className="text-xs text-slate-500 mt-1">
            {search ? 'Try adjusting your search or filter' : 'Create your first exam to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((exam) => {
          const progress = exam._count && exam._count.scripts > 0 
            ? Math.round((exam._count.graded || 0) / exam._count.scripts * 100) 
            : 0;
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
                    <p className="text-xs text-teal-600 font-medium mt-0.5">{exam.courseCode}</p>
                  </div>
                </div>
                <StatusBadge status={exam.status} className="shrink-0" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Calendar size={11} className="text-slate-400" />
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Date</p>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">{formatDate(exam.examDate)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Users size={11} className="text-slate-400" />
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Scripts</p>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">{exam._count?.scripts || 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <CheckCircle2 size={11} className="text-slate-400" />
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Graded</p>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">{exam._count?.graded || 0}</p>
                </div>
              </div>

              {/* Progress */}
              {exam._count && exam._count.scripts > 0 && (
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

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => onNavigate('scripts')}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Users size={12} />
                  View Scripts
                </button>
                <button
                  onClick={() => onNavigate('rubrics')}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <FileEdit size={12} />
                  Edit Rubric
                </button>
                <button
                  onClick={() => handleEdit(exam)}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Edit2 size={12} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(exam.id)}
                  className="sm:ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog
        open={showCreateModal || showEditModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setShowEditModal(false);
            setEditingExam(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExam ? 'Edit Exam' : 'Create New Exam'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-1">
            <div className="flex flex-col gap-1.5">
              <Label>Title *</Label>
              <Input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Database Systems Final Exam" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Optional description of the exam" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Course Code</Label>
                <Input type="text" value={formData.courseCode} onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })} placeholder="e.g., CS301" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Course Name</Label>
                <Input type="text" value={formData.courseName} onChange={(e) => setFormData({ ...formData, courseName: e.target.value })} placeholder="e.g., Database Systems" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Total Marks *</Label>
                <Input type="number" required min="1" value={formData.totalMarks || ''} onChange={(e) => { const v = e.target.value; setFormData({ ...formData, totalMarks: v === '' ? 0 : parseInt(v, 10) || 0 }); }} placeholder="100" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Duration (min)</Label>
                <Input type="number" min="1" value={formData.duration || ''} onChange={(e) => { const v = e.target.value; setFormData({ ...formData, duration: v === '' ? 0 : parseInt(v, 10) || 0 }); }} placeholder="120" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Exam Date</Label>
              <Input type="datetime-local" value={formData.examDate} onChange={(e) => setFormData({ ...formData, examDate: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring">
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" size="sm" disabled={submitting} onClick={() => { setShowCreateModal(false); setShowEditModal(false); setEditingExam(null); }}>Cancel</Button>
              <Button type="submit" size="sm" disabled={submitting} className="gap-2">
                {submitting && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {submitting ? (editingExam ? 'Updating...' : 'Creating...') : (editingExam ? 'Update Exam' : 'Create Exam')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
