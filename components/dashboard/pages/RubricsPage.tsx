"use client";

import { useState } from 'react';
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
} from 'lucide-react';
import { mockRubric } from '@/lib/mockData';
import type { RubricQuestion, RubricPart } from '@/types';
import { cn } from '@/lib/utils';

export default function RubricPage() {
  const [questions, setQuestions] = useState<RubricQuestion[]>(mockRubric);
  const [expandedQ, setExpandedQ] = useState<string[]>(['q1', 'q2']);
  const [saved, setSaved] = useState(false);

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

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Rubric Builder</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Define questions, sub-parts, expected answers, and mark allocations.
          </p>
        </div>
        <button
          onClick={handleSave}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
            saved
              ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-200'
              : 'bg-[#0f1f3d] text-white hover:bg-[#162b52]'
          )}
        >
          {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
          {saved ? 'Saved!' : 'Save Rubric'}
        </button>
      </div>

      {/* Exam Meta */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
            Examination Title
          </label>
          <input
            defaultValue="Database Systems — Final Examination"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
            Course Code
          </label>
          <input
            defaultValue="CSC 401"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
            Total Marks
          </label>
          <div className="flex h-9 items-center rounded-lg border border-teal-200 bg-teal-50 px-3">
            <span className="text-sm font-bold text-teal-700">{totalMarks} marks</span>
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
            Number of Questions
          </label>
          <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
            <span className="text-sm font-semibold text-slate-700">{questions.length} questions</span>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-4">
        {questions.map((question, qIdx) => {
          const isExpanded = expandedQ.includes(question.id);
          const qTotal = question.parts.reduce((a, p) => a + p.marks, 0);
          return (
            <div key={question.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Question Header */}
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => toggleQ(question.id)}
              >
                <GripVertical size={14} className="text-slate-300 shrink-0" />
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0f1f3d] text-xs font-bold text-white">
                  {qIdx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {isExpanded ? (
                    <input
                      value={question.questionText}
                      onChange={(e) => updateQuestion(question.id, 'questionText', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Enter question text…"
                      className="w-full text-sm font-medium text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {question.questionText || <span className="text-slate-400 italic">No question text yet</span>}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-200">
                    {qTotal} marks
                  </span>
                  <span className="text-[11px] text-slate-400">{question.parts.length} part{question.parts.length !== 1 ? 's' : ''}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeQuestion(question.id); }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                  {isExpanded ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
                </div>
              </div>

              {/* Parts */}
              {isExpanded && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {question.parts.map((part) => (
                    <div key={part.id} className="px-5 py-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-50 ring-1 ring-teal-200 text-[11px] font-bold text-teal-600">
                          {part.label}
                        </div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Part {part.label.toUpperCase()}
                        </p>
                        <div className="ml-auto flex items-center gap-2">
                          <label className="text-[11px] text-slate-500">Marks:</label>
                          <input
                            type="number"
                            value={part.marks}
                            onChange={(e) => updatePart(question.id, part.id, 'marks', parseInt(e.target.value) || 0)}
                            className="h-7 w-14 rounded-lg border border-slate-200 bg-slate-50 px-2 text-center text-xs font-semibold text-slate-700 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100"
                          />
                          <button
                            onClick={() => removePart(question.id, part.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mb-1.5">
                            <BookOpen size={11} /> Expected Answer / Model Answer
                          </label>
                          <textarea
                            value={part.expectedAnswer}
                            onChange={(e) => updatePart(question.id, part.id, 'expectedAnswer', e.target.value)}
                            placeholder="Enter the model answer or key explanation…"
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all resize-none placeholder:text-slate-400"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mb-1.5">
                            <Tag size={11} /> Key Concepts / Points (comma-separated)
                          </label>
                          <textarea
                            value={part.keyPoints.join(', ')}
                            onChange={(e) =>
                              updatePart(question.id, part.id, 'keyPoints',
                                e.target.value.split(',').map((k) => k.trim()).filter(Boolean)
                              )
                            }
                            placeholder="e.g. atomicity, rollback, commit, bank example…"
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all resize-none placeholder:text-slate-400"
                          />
                          <div className="mt-2 flex flex-wrap gap-1">
                            {part.keyPoints.map((kp, i) => (
                              <span key={i} className="rounded-full bg-[#0f1f3d]/5 px-2 py-0.5 text-[10px] font-medium text-[#0f1f3d]/70">
                                {kp}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Part */}
                  <div className="px-5 py-3.5 bg-slate-50/50">
                    <button
                      onClick={() => addPart(question.id)}
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
        onClick={addQuestion}
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white py-4 text-sm font-medium text-slate-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50/30 transition-all"
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
            The expected answers and key concepts are fed into the Sentence-BERT model for semantic similarity analysis.
            Similarity scores are computed per sub-part, weighted by the mark allocation defined here.
          </p>
        </div>
      </div>
    </div>
  );
}
