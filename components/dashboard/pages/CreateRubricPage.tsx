"use client";

import { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Page } from '@/types';
import { aiClient, type ExtractedRubric, type ExtractionResult } from '@/lib/services/ai-client';
import { rubricsApi } from '@/lib/api/rubrics';

interface CreateRubricPageProps {
  onNavigate: (page: Page) => void;
}

interface Exam {
  id: string;
  title: string;
  courseCode?: string;
}

type InputMethod = 'upload' | 'paste' | 'manual' | null;

export default function CreateRubricPage({ onNavigate }: CreateRubricPageProps) {
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

  useEffect(() => {
    fetchExams();
  }, []);

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

      const result = await rubricsApi.create(createData);

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
    onNavigate('rubrics');
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Review Extracted Rubric</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Review and edit the automatically extracted rubric before saving
            </p>
          </div>
          <button
            onClick={() => {
              setIsEditing(false);
              setExtractedRubric(null);
              setExtractionResult(null);
            }}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 self-start sm:self-auto"
          >
            <X size={14} />
            Start Over
          </button>
        </div>

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
          {extractedRubric.questions.map((question, qIndex) => (
            <div key={qIndex} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0f1f3d] text-xs font-bold text-white">
                      {qIndex + 1}
                    </div>
                    <input
                      value={question.questionNumber}
                      onChange={(e) => {
                        const updatedQuestions = [...extractedRubric.questions];
                        updatedQuestions[qIndex] = { ...question, questionNumber: e.target.value };
                        setExtractedRubric({ ...extractedRubric, questions: updatedQuestions });
                      }}
                      className="w-full text-sm font-bold text-slate-800 bg-transparent outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <input
                      type="number"
                      value={question.maxScore}
                      onChange={(e) => {
                        const newMaxScore = parseInt(e.target.value) || 0;
                        const updatedQuestions = [...extractedRubric.questions];
                        updatedQuestions[qIndex] = { ...question, maxScore: newMaxScore };
                        setExtractedRubric({ ...extractedRubric, questions: updatedQuestions });
                      }}
                      className="h-8 w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 text-center text-xs font-bold text-slate-700 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100"
                    />
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">marks</span>
                  </div>
                </div>
                <textarea
                  value={question.questionText}
                  onChange={(e) => {
                    const updatedQuestions = [...extractedRubric.questions];
                    updatedQuestions[qIndex] = { ...question, questionText: e.target.value };
                    setExtractedRubric({ ...extractedRubric, questions: updatedQuestions });
                  }}
                  rows={2}
                  className="w-full mt-2 text-sm text-slate-700 bg-transparent outline-none resize-none"
                />
              </div>
              <div className="divide-y divide-slate-50">
                {question.parts.map((part, pIndex) => (
                  <div key={pIndex} className="px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-50 ring-1 ring-teal-200 text-[11px] font-bold text-teal-600">
                          {part.label || String.fromCharCode(97 + pIndex)}
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Part {(part.label || String.fromCharCode(97 + pIndex)).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Weight:</label>
                        <input
                          type="number"
                          value={part.marks}
                          onChange={(e) => {
                            const newMarks = parseInt(e.target.value) || 0;
                            const updatedQuestions = [...extractedRubric.questions];
                            updatedQuestions[qIndex].parts[pIndex] = { ...part, marks: newMarks };
                            setExtractedRubric({ ...extractedRubric, questions: updatedQuestions });
                          }}
                          className="h-7 w-14 rounded-lg border border-slate-200 bg-slate-50 px-2 text-center text-xs font-bold text-slate-700 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100"
                        />
                      </div>
                    </div>
                    <textarea
                      value={part.expectedAnswer}
                      onChange={(e) => {
                        const updatedQuestions = [...extractedRubric.questions];
                        updatedQuestions[qIndex].parts[pIndex] = { ...part, expectedAnswer: e.target.value };
                        setExtractedRubric({ ...extractedRubric, questions: updatedQuestions });
                      }}
                      placeholder="Expected answer..."
                      rows={2}
                      className="w-full text-xs text-slate-700 bg-slate-50 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all resize-none"
                    />
                    <div className="mt-2">
                      <label className="text-[11px] font-semibold text-slate-500">Key Points:</label>
                      <textarea
                        value={part.keyPoints.join(', ')}
                        onChange={(e) => {
                          const keyPoints = e.target.value.split(',').map(k => k.trim()).filter(Boolean);
                          const updatedQuestions = [...extractedRubric.questions];
                          updatedQuestions[qIndex].parts[pIndex] = { ...part, keyPoints };
                          setExtractedRubric({ ...extractedRubric, questions: updatedQuestions });
                        }}
                        placeholder="e.g. atomicity, consistency, isolation, durability"
                        rows={1}
                        className="w-full mt-1 text-xs text-slate-700 bg-slate-50 rounded-lg border border-slate-200 px-3 py-1.5 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
