"use client";

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Type,
  Edit3,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
  FileWarning,
  ChevronDown,
  Plus,
  Trash2,
  GripVertical,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Page } from '@/types';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { aiClient, type ExtractedRubric, type ExtractionResult } from '@/lib/services/ai-client';
import { rubricsApi } from '@/lib/api/rubrics';

interface CreateRubricPageProps {
  onNavigate: (page: Page, params?: Record<string, string>) => void;
}

interface Exam {
  id: string;
  title: string;
  courseCode?: string;
}

type InputMethod = 'upload' | 'paste' | 'manual' | null;

export default function CreateRubricPage({ onNavigate }: CreateRubricPageProps) {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [selectedMethod, setSelectedMethod] = useState<InputMethod>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [extractedRubric, setExtractedRubric] = useState<ExtractedRubric | null>(null);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([0]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'back' | 'startOver' | null;
  }>({ isOpen: false, type: null });

  const toggleQuestion = (qIndex: number) => {
    setExpandedQuestions(prev =>
      prev.includes(qIndex)
        ? prev.filter(i => i !== qIndex)
        : [...prev, qIndex]
    );
  };

  const addQuestion = () => {
    if (!extractedRubric) return;
    const nextQIndex = extractedRubric.questions.length + 1;
    const newQuestion = {
      questionNumber: `Q${nextQIndex}`,
      questionText: '',
      maxScore: 5,
      parts: [
        { label: 'a', marks: 5, expectedAnswer: '', keyPoints: [] }
      ]
    };
    const updatedQuestions = [...extractedRubric.questions, newQuestion];

    // Recalculate total marks
    const totalMarks = updatedQuestions.reduce((acc, q) => acc + q.maxScore, 0);

    setExtractedRubric({
      ...extractedRubric,
      questions: updatedQuestions,
      totalMarks
    });

    // Expand the newly added question
    setExpandedQuestions(prev => [...prev, updatedQuestions.length - 1]);
  };

  const removeQuestion = (qIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!extractedRubric) return;

    const updatedQuestions = extractedRubric.questions.filter((_, idx) => idx !== qIndex);

    // Recalculate total marks
    const totalMarks = updatedQuestions.reduce((acc, q) => acc + q.maxScore, 0);

    setExtractedRubric({
      ...extractedRubric,
      questions: updatedQuestions,
      totalMarks
    });

    // Adjust expandedQuestions indices
    setExpandedQuestions(prev =>
      prev
        .filter(i => i !== qIndex)
        .map(i => i > qIndex ? i - 1 : i)
    );
  };

  const addPart = (qIndex: number) => {
    if (!extractedRubric) return;
    const question = extractedRubric.questions[qIndex];
    const labels = 'abcdefghijklmnopqrstuvwxyz';
    const nextLabel = labels[question.parts.length] || String(question.parts.length + 1);

    const newPart = {
      label: nextLabel,
      marks: 5,
      expectedAnswer: '',
      keyPoints: []
    };

    const updatedParts = [...question.parts, newPart];
    const updatedQuestions = [...extractedRubric.questions];

    const qMaxScore = updatedParts.reduce((acc, p) => acc + p.marks, 0);
    updatedQuestions[qIndex] = {
      ...question,
      parts: updatedParts,
      maxScore: qMaxScore
    };

    const totalMarks = updatedQuestions.reduce((acc, q) => acc + q.maxScore, 0);
    setExtractedRubric({
      ...extractedRubric,
      questions: updatedQuestions,
      totalMarks
    });
  };

  const removePart = (qIndex: number, pIndex: number) => {
    if (!extractedRubric) return;
    const question = extractedRubric.questions[qIndex];
    const updatedParts = question.parts.filter((_, idx) => idx !== pIndex);

    // Re-label remaining parts in alphabetical order
    const labels = 'abcdefghijklmnopqrstuvwxyz';
    const reLabeledParts = updatedParts.map((part, idx) => ({
      ...part,
      label: labels[idx] || String(idx + 1)
    }));

    const qMaxScore = reLabeledParts.reduce((acc, p) => acc + p.marks, 0);
    const updatedQuestions = [...extractedRubric.questions];
    updatedQuestions[qIndex] = {
      ...question,
      parts: reLabeledParts,
      maxScore: qMaxScore
    };

    const totalMarks = updatedQuestions.reduce((acc, q) => acc + q.maxScore, 0);
    setExtractedRubric({
      ...extractedRubric,
      questions: updatedQuestions,
      totalMarks
    });
  };

  useEffect(() => {
    fetchExams();
    if (editId) {
      fetchRubricForEditing(editId);
    }
  }, [editId]);

  const fetchRubricForEditing = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await rubricsApi.getById(id);
      if (result.success && result.data) {
        const rubric = result.data;
        setSelectedExamId(rubric.examId || '');

        // Map to ExtractedRubric format
        const mappedQuestions = rubric.questions.map((q) => ({
          questionNumber: q.questionId,
          questionText: q.question,
          maxScore: q.maxScore,
          parts: q.points.map((p, index) => {
            const label = p.id.includes('-') ? p.id.split('-').pop() || '' : String.fromCharCode(97 + index);
            return {
              label,
              marks: p.maxScore,
              expectedAnswer: p.point,
              keyPoints: [],
            };
          }),
        }));

        setExtractedRubric({
          title: rubric.title,
          description: rubric.description || '',
          courseCode: rubric.exam?.courseCode || '',
          totalMarks: rubric.totalMarks,
          questions: mappedQuestions,
        });

        setIsEditing(true);
      } else {
        setError(result.error || 'Failed to load rubric for editing');
      }
    } catch (err) {
      console.error('Error fetching rubric for editing:', err);
      setError('An error occurred while loading the rubric');
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      setExamsLoading(true);
      const response = await fetch('/api/exams');
      if (!response.ok) throw new Error('Failed to fetch exams');
      const data = await response.json();
      setExams(data.exams || []);
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setExamsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploadedFile(file);
    setError(null);
    setLoading(true);

    try {
      const result = await aiClient.extractRubricFromDocument(file);
      setExtractionResult(result);

      if (result.success && result.rubric) {
        setExtractedRubric(result.rubric);
        setIsEditing(true);
      } else {
        setError(result.error || 'Failed to extract rubric from document');
      }
    } catch (err) {
      setError('An unexpected error occurred while extracting rubric');
    } finally {
      setLoading(false);
    }
  };

  const handleTextExtraction = async () => {
    if (!pastedText.trim()) {
      setError('Please paste some text to extract rubric from');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await aiClient.extractRubricFromText(pastedText);
      setExtractionResult(result);

      if (result.success && result.rubric) {
        setExtractedRubric(result.rubric);
        setIsEditing(true);
      } else {
        setError(result.error || 'Failed to extract rubric from text');
      }
    } catch (err) {
      setError('An unexpected error occurred while extracting rubric');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRubric = async () => {
    if (!extractedRubric) return;

    setLoading(true);
    setError(null);

    try {
      // Convert to API format
      const questionsData = extractedRubric.questions.map((q) => ({
        questionId: q.questionNumber,
        question: q.questionText,
        maxScore: q.maxScore,
        points: q.parts.map((part) => ({
          id: `${q.questionNumber}-${part.label}`,
          point: part.expectedAnswer,
          weight: part.marks / q.maxScore,
          maxScore: part.marks,
        })),
      }));

      const createData = {
        title: extractedRubric.title,
        description: extractedRubric.description,
        examId: selectedExamId || undefined,
        questions: questionsData,
      };

      // Validate rubric
      const validation = rubricsApi.validateRubric(createData);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      let result;
      if (editId) {
        result = await rubricsApi.update({
          id: editId,
          ...createData,
        });
      } else {
        result = await rubricsApi.create(createData);
      }

      if (result.success) {
        // Navigate to rubrics page with success message
        onNavigate('rubrics');
      } else {
        setError(result.error || 'Failed to save rubric');
      }
    } catch {
      setError('An unexpected error occurred while saving rubric');
    } finally {
      setLoading(false);
    }
  };

  const handleManualCreate = () => {
    setExtractedRubric({
      title: 'New Rubric',
      description: '',
      courseCode: '',
      totalMarks: 5,
      questions: [
        {
          questionNumber: 'Q1',
          questionText: '',
          maxScore: 5,
          parts: [
            { label: 'a', marks: 5, expectedAnswer: '', keyPoints: [] }
          ]
        }
      ]
    });
    setExpandedQuestions([0]);
    setIsEditing(true);
  };

  const inputMethods = [
    {
      id: 'upload' as InputMethod,
      title: 'Upload Existing Document',
      description: 'Upload your model answer sheet (PDF, Word, or image)',
      icon: Upload,
      subtitle: 'Best UX • 2-minute setup',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      id: 'paste' as InputMethod,
      title: 'Paste Text',
      description: 'Copy and paste your marking scheme from any document',
      icon: Type,
      subtitle: 'Fast • 2-minute setup',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      id: 'manual' as InputMethod,
      title: 'Manual Entry',
      description: 'Build rubric step-by-step using our form builder',
      icon: Edit3,
      subtitle: 'Fallback option',
      color: 'bg-slate-50 border-slate-200 hover:bg-slate-100',
      iconColor: 'text-slate-600',
    },
  ];

  if (isEditing && extractedRubric) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                setConfirmDialog({ isOpen: true, type: 'back' });
              }}
              className="flex w-fit items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mb-2 transition-colors"
            >
              <ChevronRight size={14} className="rotate-180" />
              Back to {selectedMethod === 'upload' ? 'Upload' : selectedMethod === 'paste' ? 'Paste Text' : 'Method Selection'}
            </button>
            <h2 className="text-base font-semibold text-slate-800">
              {selectedMethod === 'manual' ? 'Build Rubric' : 'Review Extracted Rubric'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {selectedMethod === 'manual' 
                ? 'Create your marking scheme step-by-step' 
                : 'Review and edit the automatically extracted rubric before saving'}
            </p>
          </div>
          <button
            onClick={() => {
              setConfirmDialog({ isOpen: true, type: 'startOver' });
            }}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 self-start sm:self-auto"
          >
            <X size={14} />
            Start Over
          </button>
        </div>

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.type === 'back' ? 'Go Back?' : 'Start Over?'}
          description={
            confirmDialog.type === 'back'
              ? 'Are you sure you want to go back? Unsaved changes will be lost.'
              : 'Are you sure you want to start over? All progress will be lost.'
          }
          isDestructive={true}
          confirmText="Yes, discard changes"
          onClose={() => setConfirmDialog({ isOpen: false, type: null })}
          onConfirm={() => {
            if (confirmDialog.type === 'back') {
              setIsEditing(false);
            } else if (confirmDialog.type === 'startOver') {
              setIsEditing(false);
              setExtractedRubric(null);
              setExtractionResult(null);
              setSelectedMethod(null);
            }
          }}
        />

        {/* Confidence Indicator */}
        {extractionResult?.confidence && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <FileWarning size={15} className="text-amber-500" />
            <div>
              <p className="text-xs font-semibold text-amber-800">
                AI Confidence: {Math.round(extractionResult.confidence * 100)}%
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Please review the extracted content for accuracy before saving
              </p>
            </div>
          </div>
        )}

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

        {/* Rubric Details */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                Rubric Title
              </label>
              <input
                value={extractedRubric.title}
                onChange={(e) => setExtractedRubric({ ...extractedRubric, title: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                Associate with Exam
              </label>
              <div className="relative">
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  disabled={examsLoading}
                  className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 pr-10 text-sm text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all disabled:opacity-50"
                >
                  <option value="">Save as Template</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} {exam.courseCode ? `(${exam.courseCode})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                Course Code
              </label>
              <input
                value={extractedRubric.courseCode || ''}
                onChange={(e) => setExtractedRubric({ ...extractedRubric, courseCode: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:col-span-2">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                  Total Marks
                </label>
                <div className="flex h-9 items-center rounded-lg border border-teal-200 bg-teal-50 px-3">
                  <span className="text-sm font-bold text-teal-700">{extractedRubric.totalMarks} marks</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                  Questions
                </label>
                <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
                  <span className="text-sm font-semibold text-slate-700">{extractedRubric.questions.length} items</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="flex flex-col gap-4">
          {extractedRubric.questions.map((question, qIndex) => {
            const isExpanded = expandedQuestions.includes(qIndex);
            const qTotal = question.parts.reduce((a, p) => a + p.marks, 0);

            return (
              <div key={qIndex} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300">
                {/* Question Header */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
                  onClick={() => toggleQuestion(qIndex)}
                >
                  <GripVertical size={14} className="text-slate-300 shrink-0 cursor-grab" />
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0f1f3d] text-xs font-bold text-white">
                    {qIndex + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    {isExpanded ? (
                      <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          value={question.questionNumber}
                          onChange={(e) => {
                            const updatedQuestions = [...extractedRubric.questions];
                            updatedQuestions[qIndex] = { ...question, questionNumber: e.target.value };
                            setExtractedRubric({ ...extractedRubric, questions: updatedQuestions });
                          }}
                          placeholder="Q1"
                          className="w-16 font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-sm outline-none focus:border-teal-400 focus:bg-white"
                        />
                        <input
                          value={question.questionText}
                          onChange={(e) => {
                            const updatedQuestions = [...extractedRubric.questions];
                            updatedQuestions[qIndex] = { ...question, questionText: e.target.value };
                            setExtractedRubric({ ...extractedRubric, questions: updatedQuestions });
                          }}
                          placeholder="Enter question text…"
                          className="flex-1 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 outline-none focus:border-teal-400 focus:bg-white"
                        />
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <span className="text-sm font-bold text-slate-800 shrink-0">{question.questionNumber || `Q${qIndex + 1}`}:</span>
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {question.questionText || <span className="text-slate-400 italic">No question text yet</span>}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-200">
                      {qTotal} marks
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {question.parts.length} part{question.parts.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => removeQuestion(qIndex, e)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-450 transition-colors"
                      title="Delete Question"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleQuestion(qIndex)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                    >
                      {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </button>
                  </div>
                </div>

                {/* Parts */}
                {isExpanded && (
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {question.parts.map((part, pIndex) => (
                      <div key={pIndex} className="px-5 py-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-50 ring-1 ring-teal-200 text-[11px] font-bold text-teal-600">
                            {part.label || String.fromCharCode(97 + pIndex)}
                          </div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Part {(part.label || String.fromCharCode(97 + pIndex)).toUpperCase()}
                          </p>
                          <div className="ml-auto flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <label className="text-[11px] text-slate-500 font-medium">Label:</label>
                              <input
                                type="text"
                                value={part.label}
                                onChange={(e) => {
                                  const updatedQuestions = [...extractedRubric.questions];
                                  updatedQuestions[qIndex].parts[pIndex] = { ...part, label: e.target.value };
                                  setExtractedRubric({ ...extractedRubric, questions: updatedQuestions });
                                }}
                                className="h-7 w-10 rounded-lg border border-slate-200 bg-slate-50 px-1 text-center text-xs font-semibold text-slate-700 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <label className="text-[11px] text-slate-500 font-medium">Marks:</label>
                              <input
                                type="number"
                                value={part.marks}
                                onChange={(e) => {
                                  const newMarks = parseInt(e.target.value) || 0;
                                  const updatedQuestions = [...extractedRubric.questions];
                                  const q = updatedQuestions[qIndex];
                                  const parts = [...q.parts];
                                  parts[pIndex] = { ...part, marks: newMarks };

                                  const qMaxScore = parts.reduce((acc, p) => acc + p.marks, 0);
                                  updatedQuestions[qIndex] = {
                                    ...q,
                                    parts,
                                    maxScore: qMaxScore
                                  };

                                  const totalMarks = updatedQuestions.reduce((acc, q) => acc + q.maxScore, 0);
                                  setExtractedRubric({
                                    ...extractedRubric,
                                    questions: updatedQuestions,
                                    totalMarks
                                  });
                                }}
                                className="h-7 w-14 rounded-lg border border-slate-200 bg-slate-50 px-2 text-center text-xs font-semibold text-slate-700 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removePart(qIndex, pIndex)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-400 transition-colors"
                              title="Delete Part"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mb-1.5">
                            <BookOpen size={11} className="text-slate-400" /> Expected Answer / Model Answer
                          </label>
                          <textarea
                            value={part.expectedAnswer}
                            onChange={(e) => {
                              const updatedQuestions = [...extractedRubric.questions];
                              updatedQuestions[qIndex].parts[pIndex] = { ...part, expectedAnswer: e.target.value };
                              setExtractedRubric({ ...extractedRubric, questions: updatedQuestions });
                            }}
                            placeholder="Enter the model answer or key explanation…"
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all resize-none placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Add Part */}
                    <div className="px-5 py-3.5 bg-slate-50/50">
                      <button
                        type="button"
                        onClick={() => addPart(qIndex)}
                        className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                      >
                        <Plus size={13} />
                        Add Sub-Part
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Question */}
        <button
          type="button"
          onClick={addQuestion}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white py-4 text-sm font-medium text-slate-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50/30 transition-all w-full animate-fadeIn"
        >
          <Plus size={15} />
          Add Question
        </button>

        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <HelpCircle size={15} className="mt-0.5 shrink-0 text-blue-500" />
          <div>
            <p className="text-xs font-semibold text-blue-800">How the rubric is used</p>
            <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
              The expected answers are fed into the Sentence-BERT model for semantic similarity analysis.
              Similarity scores are computed per sub-part, weighted by the mark allocation defined here.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => {
              setIsEditing(false);
              setExtractedRubric(null);
              setExtractionResult(null);
            }}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveRubric}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[#0f1f3d] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#162b52] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            {loading ? 'Saving...' : 'Save Rubric'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-slate-800">Create New Rubric</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Choose how you&apos;d like to create your rubric. We recommend uploading an existing document for the fastest setup.
        </p>
      </div>

      {/* Input Method Selection */}
      {!selectedMethod ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {inputMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={cn(
                  'flex flex-col items-start gap-4 rounded-xl border-2 p-5 text-left transition-all',
                  method.color
                )}
              >
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', method.iconColor === 'text-blue-600' ? 'bg-blue-100' : method.iconColor === 'text-green-600' ? 'bg-green-100' : 'bg-slate-100')}>
                  <Icon size={20} className={method.iconColor} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-800">{method.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{method.description}</p>
                  <p className="text-[11px] font-medium text-slate-500 mt-2">{method.subtitle}</p>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            );
          })}
        </div>
      ) : (
        <>
          {/* Back Button */}
          <button
            onClick={() => setSelectedMethod(null)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
          >
            <ChevronRight size={14} className="rotate-180" />
            Back to options
          </button>

          {/* Upload Method */}
          {selectedMethod === 'upload' && (
            <div className="flex flex-col gap-6">
              <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                    <Upload size={28} className="text-blue-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-semibold text-slate-800">Upload Your Marking Scheme</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Upload your model answer sheet (PDF, Word, or image)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {loading ? 'Extracting...' : 'Choose File'}
                  </button>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <FileText size={11} /> PDF
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={11} /> Word
                    </span>
                    <span className="flex items-center gap-1">
                      <ImageIcon size={11} /> Image
                    </span>
                    <span>Max 10MB</span>
                  </div>
                </div>
              </div>

              {uploadedFile && (
                <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <FileText size={15} className="text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">{uploadedFile.name}</p>
                    <p className="text-xs text-blue-600">
                      {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paste Method */}
          {selectedMethod === 'paste' && (
            <div className="flex flex-col gap-6">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <label className="block text-sm font-semibold text-slate-800 mb-3">
                  Paste Your Marking Scheme
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Copy and paste your marking scheme from any document (Word, PDF, email, etc.)..."
                  rows={12}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-green-400 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all resize-none"
                />
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-slate-400">
                    {pastedText.length} characters
                  </p>
                  <button
                    onClick={handleTextExtraction}
                    disabled={loading || !pastedText.trim()}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Type size={14} />
                    )}
                    {loading ? 'Extracting...' : 'Extract Rubric'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manual Method */}
          {selectedMethod === 'manual' && (
            <div className="flex flex-col gap-6">
              <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mx-auto mb-4">
                  <Edit3 size={28} className="text-slate-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Manual Rubric Builder</h3>
                <p className="text-xs text-slate-500 mb-6">
                  Build your rubric step-by-step using our form builder
                </p>
                <button
                  onClick={handleManualCreate}
                  className="flex items-center gap-2 rounded-lg bg-[#0f1f3d] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#162b52] transition-all mx-auto"
                >
                  <Edit3 size={14} />
                  Open Rubric Builder
                </button>
              </div>
            </div>
          )}

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
        </>
      )}
    </div>
  );
}
