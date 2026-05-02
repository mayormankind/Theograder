"use client";

import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Save,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  Tag,
  Copy,
  Edit3,
  X,
  AlertCircle,
  ClipboardList,
  Upload,
} from 'lucide-react';
import { mockRubric } from '@/lib/mockData';
import type { RubricQuestion, RubricPart, Page } from '@/types';
import { cn } from '@/lib/utils';
import { rubricsApi, type Rubric, type CreateRubricData } from '@/lib/api/rubrics';

interface RubricPageProps {
  onNavigate: (page: Page) => void;
}

export default function RubricPage({ onNavigate }: RubricPageProps) {
  const [questions, setQuestions] = useState<RubricQuestion[]>(mockRubric);
  const [expandedQ, setExpandedQ] = useState<string[]>(['q1', 'q2']);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRubric, setCurrentRubric] = useState<Rubric | null>(null);
  const [rubricTitle, setRubricTitle] = useState('Database Systems — Final Examination');
  const [courseCode, setCourseCode] = useState('CSC 401');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateTitle, setDuplicateTitle] = useState('');

  const totalMarks = questions.reduce((acc, q) => acc + q.totalMarks, 0);

  const toggleQ = (id: string) =>
    setExpandedQ((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const updateQuestion = (qId: string, field: keyof RubricQuestion, value: unknown) => {
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, [field]: value } : q)));
  };

  const updatePart = (qId: string, pId: string, field: keyof RubricPart, value: unknown) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              parts: q.parts.map((p) => (p.id === pId ? { ...p, [field]: value } : p)),
              totalMarks: q.parts.reduce((acc, p) => acc + (p.id === pId && field === 'marks' ? (value as number) : p.marks), 0),
            }
          : q
      )
    );
  };

  const addPart = (qId: string) => {
    const q = questions.find((x) => x.id === qId);
    if (!q) return;
    const labels = 'abcdefghijklmnopqrstuvwxyz';
    const newLabel = labels[q.parts.length] || String(q.parts.length + 1);
    const newPart: RubricPart = {
      id: `${qId}-${Date.now()}`,
      label: newLabel,
      expectedAnswer: '',
      keyPoints: [],
      marks: 5,
    };
    setQuestions((prev) =>
      prev.map((x) =>
        x.id === qId ? { ...x, parts: [...x.parts, newPart] } : x
      )
    );
  };

  const removePart = (qId: string, pId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, parts: q.parts.filter((p) => p.id !== pId) }
          : q
      )
    );
  };

  const addQuestion = () => {
    const num = `Q${questions.length + 1}`;
    const newQ: RubricQuestion = {
      id: `q${Date.now()}`,
      questionNumber: num,
      questionText: '',
      parts: [
        { id: `q${Date.now()}-a`, label: 'a', expectedAnswer: '', keyPoints: [], marks: 5 },
      ],
      totalMarks: 5,
    };
    setQuestions((prev) => [...prev, newQ]);
    setExpandedQ((prev) => [...prev, newQ.id]);
  };

  const removeQuestion = (qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert to API format
      const questionsData = questions.map((q, index) => ({
        questionId: `Q${index + 1}`,
        question: q.questionText,
        maxScore: q.totalMarks,
        points: q.parts.map(part => ({
          id: part.id,
          point: part.expectedAnswer,
          weight: part.marks / q.totalMarks,
          maxScore: part.marks,
        })),
      }));

      const createData = {
        title: rubricTitle,
        description: `Rubric for ${rubricTitle}`,
        questions: questionsData,
      };

      // Validate rubric
      const validation = rubricsApi.validateRubric(createData);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      let result;
      if (currentRubric) {
        // Update existing rubric
        result = await rubricsApi.update({ ...createData, id: currentRubric.id });
      } else {
        // Create new rubric
        result = await rubricsApi.create(createData);
      }

      if (result.success) {
        setSaved(true);
        setCurrentRubric(result.data!);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(result.error || 'Failed to save rubric');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!currentRubric) return;
    
    setLoading(true);
    try {
      const result = await rubricsApi.duplicate(
        currentRubric.id,
        duplicateTitle || `${currentRubric.title} (Copy)`
      );
      
      if (result.success) {
        setShowDuplicateModal(false);
        setDuplicateTitle('');
        // Load the duplicated rubric
        setCurrentRubric(result.data!);
        setRubricTitle(result.data!.title);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(result.error || 'Failed to duplicate rubric');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentRubric) return;
    
    if (!confirm('Are you sure you want to delete this rubric?')) return;
    
    setLoading(true);
    try {
      const result = await rubricsApi.delete(currentRubric.id);
      
      if (result.success) {
        // Reset to new rubric state
        setCurrentRubric(null);
        setRubricTitle('Database Systems — Final Examination');
        setCourseCode('CSC 401');
        setQuestions(mockRubric);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(result.error || 'Failed to delete rubric');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Rubrics</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your grading rubrics and marking schemes.
          </p>
        </div>
        <button
          onClick={() => onNavigate('create-rubric')}
          className="flex items-center gap-2 rounded-lg bg-[#0f1f3d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#162b52] transition-all"
        >
          <Plus size={14} />
          Create Rubric
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
                3 rubrics
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

          <div className="divide-y divide-slate-50">
            {/* Mock rubric items */}
            <div className="px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-semibold text-slate-800">Database Systems — Final Examination</h4>
                    <span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-semibold text-teal-700 ring-1 ring-teal-200">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">CSC 401 • 5 questions • 100 marks</p>
                  <p className="text-xs text-slate-400 mt-1">Created 2 days ago • Used 3 times</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <Copy size={14} />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <Edit3 size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-semibold text-slate-800">Software Engineering Principles</h4>
                    <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-200">
                      Draft
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">CSC 312 • 8 questions • 150 marks</p>
                  <p className="text-xs text-slate-400 mt-1">Created 1 week ago • Never used</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <Copy size={14} />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <Edit3 size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-semibold text-slate-800">Algorithms & Complexity — Mid-Semester</h4>
                    <span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-semibold text-teal-700 ring-1 ring-teal-200">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">CSC 305 • 6 questions • 75 marks</p>
                  <p className="text-xs text-slate-400 mt-1">Created 2 weeks ago • Used 7 times</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <Copy size={14} />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <Edit3 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
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

      {/* Duplicate Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Duplicate Rubric</h3>
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Rubric Title
              </label>
              <input
                type="text"
                value={duplicateTitle}
                onChange={(e) => setDuplicateTitle(e.target.value)}
                placeholder={`${currentRubric?.title} (Copy)`}
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicate}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#0f1f3d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#162b52] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Copy size={14} />
                )}
                Duplicate
              </button>
            </div>
          </div>
        </div>
      )}

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
