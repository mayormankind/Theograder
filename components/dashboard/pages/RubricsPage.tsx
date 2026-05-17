"use client";

import { useState, useEffect } from 'react';
import {
  Plus,
  CheckCircle2,
  HelpCircle,
  Copy,
  Edit3,
  X,
  AlertCircle,
  ClipboardList,
  Upload,
  Trash2,
  Loader2,
  Link,
  Link2Off,
} from 'lucide-react';
import type { Page } from '@/types';
import { cn } from '@/lib/utils';
import { rubricsApi, type Rubric } from '@/lib/api/rubrics';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Exam {
  id: string;
  title: string;
  courseCode?: string;
}

interface RubricPageProps {
  onNavigate: (page: Page, params?: Record<string, string>) => void;
}

export default function RubricPage({ onNavigate }: RubricPageProps) {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingRubric, setDeletingRubric] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingRubric, setLinkingRubric] = useState<Rubric | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
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

  useEffect(() => {
    fetchRubrics();
    fetchExams();
  }, []);

  const fetchRubrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await rubricsApi.getAll();
      if (result.success) {
        setRubrics(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch rubrics');
      }
    } catch (err) {
      console.error('Error fetching rubrics:', err);
      setError('Failed to fetch rubrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/exams');
      if (response.ok) {
        const data = await response.json();
        setExams(data.exams || []);
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Rubric',
      description: 'Are you sure you want to delete this rubric? This action cannot be undone.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setDeletingRubric(id);
          const result = await rubricsApi.delete(id);
          if (result.success) {
            setRubrics(rubrics.filter(r => r.id !== id));
            toast.success('Rubric deleted successfully');
          } else {
            setError(result.error || 'Failed to delete rubric');
            toast.error(result.error || 'Failed to delete rubric');
          }
        } catch (err) {
          setError('An unexpected error occurred');
          toast.error('An unexpected error occurred');
        } finally {
          setDeletingRubric(null);
        }
      },
    });
  };

  const openLinkModal = (rubric: Rubric) => {
    setLinkingRubric(rubric);
    setSelectedExamId('');
    setShowLinkModal(true);
  };

  const handleLink = async () => {
    if (!linkingRubric || !selectedExamId) return;

    try {
      const response = await fetch(`/api/rubrics/${linkingRubric.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: selectedExamId }),
      });

      if (!response.ok) {
        throw new Error('Failed to link rubric to exam');
      }

      setShowLinkModal(false);
      setLinkingRubric(null);
      setSelectedExamId('');
      await fetchRubrics();
    } catch (err) {
      setError('Failed to link rubric to exam');
    }
  };

  const handleUnlink = async (rubricId: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Unlink Rubric',
      description: 'Unlink this rubric from the exam? It will become a template.',
      isDestructive: false,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/rubrics/${rubricId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ examId: null }),
          });

          if (!response.ok) {
            throw new Error('Failed to unlink rubric');
          }

          toast.success('Rubric unlinked successfully');
          await fetchRubrics();
        } catch (err) {
          setError('Failed to unlink rubric');
          toast.error('Failed to unlink rubric');
        }
      },
    });
  };



  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-xs font-semibold text-red-800">Error</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Rubrics</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your grading rubrics and marking schemes.
          </p>
        </div>
        <button
          onClick={() => onNavigate('create-rubric')}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#0f1f3d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#162b52] transition-all"
        >
          <Plus size={14} />
          <span>Create Rubric</span>
        </button>
      </div>

      {/* Rubrics List */}
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <ClipboardList size={14} className="text-slate-500" />
              <p className="text-sm font-semibold text-slate-800">Your Rubrics</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {rubrics.length} rubrics
              </span>
            </div>
            <button
              onClick={() => onNavigate('create-rubric')}
              className="flex items-center gap-2 rounded-lg bg-[#0f1f3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#162b52] transition-all"
            >
              <Plus size={14} />
              Create New
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : rubrics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-5">
              <ClipboardList size={40} className="text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No rubrics yet</p>
              <p className="text-xs text-slate-500 mt-1">Create your first rubric to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {rubrics.map((rubric) => (
                <div key={rubric.id} className="px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-none">{rubric.title}</h4>
                        {rubric.examId ? (
                          <span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-semibold text-teal-700 ring-1 ring-teal-200">
                            Linked
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-200">
                            Template
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {rubric.exam?.courseCode || 'No course'} • {rubric.questions.length} questions • {rubric.totalMarks} marks
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Created {new Date(rubric.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-4">
                      {rubric.examId ? (
                        <button
                          onClick={() => handleUnlink(rubric.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 border border-slate-200 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                          title="Unlink from Exam"
                        >
                          <Link2Off size={15} />
                        </button>
                      ) : (
                        <button
                          onClick={() => openLinkModal(rubric)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Link to Exam"
                        >
                          <Link size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => onNavigate('create-rubric', { edit: rubric.id })}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 border border-slate-200 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(rubric.id)}
                        disabled={deletingRubric === rubric.id}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 border border-slate-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                        title="Delete"
                      >
                        {deletingRubric === rubric.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Start */}
      <div className="rounded-xl border border-teal-100 bg-teal-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-teal-500" />
          <div>
            <p className="text-sm font-semibold text-teal-800">Quick Start with AI</p>
            <p className="text-xs text-teal-600 mt-0.5">
              Upload your existing marking scheme document and let AI extract the rubric structure for you. Setup in under 2 minutes.
            </p>
            <button
              onClick={() => onNavigate('create-rubric')}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-medium text-white hover:bg-teal-700 transition-all mt-3"
            >
              <Upload size={12} />
              Upload Document
            </button>
          </div>
        </div>
      </div>

      {/* Link to Exam Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Link Rubric to Exam</h3>
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkingRubric(null);
                  setSelectedExamId('');
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Exam
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
              >
                <option value="">Choose an exam...</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} {exam.courseCode ? `(${exam.courseCode})` : ''}
                  </option>
                ))}
              </select>
              {exams.length === 0 && (
                <p className="text-xs text-slate-500 mt-2">No exams available. Create an exam first.</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkingRubric(null);
                  setSelectedExamId('');
                }}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLink}
                disabled={!selectedExamId}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#0f1f3d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#162b52] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Link size={14} />
                Link
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        description={confirmState.description}
        isDestructive={confirmState.isDestructive}
        onConfirm={confirmState.onConfirm}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <HelpCircle size={15} className="mt-0.5 shrink-0 text-blue-500" />
        <div>
          <p className="text-xs font-semibold text-blue-800">How the rubric is used</p>
          <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
            The expected answers and key concepts are fed into the Sentence-BERT model for semantic similarity analysis.
            Similarity scores are computed per sub-part, weighted by the mark allocation defined here.
          </p>
        </div>
      </div>
    </div>
  );
}
