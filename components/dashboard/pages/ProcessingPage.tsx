"use client";

import { useState, useEffect } from 'react';
import {
  Scan,
  CheckCircle2,
  Loader2,
  Circle,
  ChevronRight,
  FileText,
  Cpu,
  Layers,
  AlignLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Page } from '@/types';

interface ProcessingPageProps {
  onNavigate: (page: Page) => void;
}

const ocrText = `Q1. (a) Atomicity means that a transaction is treated as a single unit. Either all operations succeed or none of them are applied to the database. For example, if a bank transfer fails midway, the debit is rolled back.

(b) Consistency ensures the database stays valid after a transaction. It must obey all constraints and integrity rules defined in the schema.

(c) Isolation means transactions run independently from each other. Multiple transactions happening at once should not interfere.

(d) Durability guarantees that once committed, a transaction is permanently saved. Even if the system crashes, the data is not lost because of logs.

Q2. (a) Relational databases use tables with rows and columns. They use SQL for querying and foreign keys to link tables together.

(b) NoSQL document stores like MongoDB use JSON documents. They are flexible and can scale horizontally across many servers.

(c) Relational databases are more consistent but harder to scale. NoSQL is more flexible and scalable for big data.`;

const segments = [
  { label: 'Q1a', start: 0, end: 185, color: 'bg-teal-100 border-l-2 border-teal-400' },
  { label: 'Q1b', start: 187, end: 340, color: 'bg-blue-50 border-l-2 border-blue-400' },
  { label: 'Q1c', start: 342, end: 470, color: 'bg-violet-50 border-l-2 border-violet-400' },
  { label: 'Q1d', start: 472, end: 608, color: 'bg-teal-100 border-l-2 border-teal-400' },
  { label: 'Q2a', start: 610, end: 750, color: 'bg-blue-50 border-l-2 border-blue-400' },
  { label: 'Q2b', start: 752, end: 886, color: 'bg-violet-50 border-l-2 border-violet-400' },
  { label: 'Q2c', start: 888, end: 999, color: 'bg-amber-50 border-l-2 border-amber-400' },
];

const pipelineSteps = [
  { id: 'ocr', label: 'OCR Text Extraction', description: 'Deskewing, binarization, character recognition', icon: Scan },
  { id: 'segment', label: 'Answer Segmentation', description: 'Identifying question boundaries', icon: Layers },
  { id: 'embed', label: 'Sentence Embedding', description: 'Sentence-BERT encoding of answers', icon: Cpu },
  { id: 'similarity', label: 'Semantic Similarity', description: 'Cosine similarity against rubric model', icon: AlignLeft },
  { id: 'grade', label: 'Grade Assignment', description: 'Weighted mark computation per question', icon: CheckCircle2 },
];

export default function ProcessingPage({ onNavigate }: ProcessingPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCharCount((prev) => {
        if (prev >= ocrText.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.floor(Math.random() * 8) + 3;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timers = pipelineSteps.map((_, i) =>
      setTimeout(() => setCurrentStep(i + 1), i * 2000 + 500)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const displayedText = ocrText.slice(0, charCount);
  const isComplete = currentStep >= pipelineSteps.length;

  const getHighlightedText = () => {
    if (!isComplete) {
      return <span className="text-slate-700 font-mono text-xs leading-relaxed whitespace-pre-wrap">{displayedText}</span>;
    }
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    segments.forEach((seg, i) => {
      const end = Math.min(seg.end, ocrText.length);
      if (seg.start > lastIdx) {
        parts.push(<span key={`gap-${i}`}>{ocrText.slice(lastIdx, seg.start)}</span>);
      }
      const text = ocrText.slice(seg.start, end);
      parts.push(
        <span key={seg.label} className={cn('relative rounded px-1 py-0.5 transition-all', seg.color)}>
          <span className="absolute -top-4 left-0 rounded bg-slate-700 px-1 py-0.5 text-[9px] font-bold text-white opacity-80">
            {seg.label}
          </span>
          {text}
        </span>
      );
      lastIdx = end;
    });
    if (lastIdx < ocrText.length) {
      parts.push(<span key="tail">{ocrText.slice(lastIdx)}</span>);
    }
    return <span className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-700">{parts}</span>;
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Script Processing</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Adaeze Okonkwo — STU-2021-0044 · Database Systems Final
          </p>
        </div>
        {isComplete && (
          <button
            onClick={() => onNavigate('results')}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            View Grading Results <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pipeline */}
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Cpu size={15} className="text-teal-500" />
              <p className="text-sm font-semibold text-slate-800">Processing Pipeline</p>
            </div>
            <div className="flex flex-col gap-0">
              {pipelineSteps.map((step, i) => {
                const done = currentStep > i;
                const active = currentStep === i;
                const pending = currentStep < i;
                return (
                  <div key={step.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                          done && 'border-teal-400 bg-teal-400',
                          active && 'border-blue-400 bg-blue-50',
                          pending && 'border-slate-200 bg-slate-50'
                        )}
                      >
                        {done ? (
                          <CheckCircle2 size={14} className="text-white" />
                        ) : active ? (
                          <Loader2 size={14} className="text-blue-500 animate-spin" />
                        ) : (
                          <Circle size={14} className="text-slate-300" />
                        )}
                      </div>
                      {i < pipelineSteps.length - 1 && (
                        <div className={cn('w-0.5 flex-1 my-1', done ? 'bg-teal-300' : 'bg-slate-100')} style={{ minHeight: 20 }} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className={cn('text-xs font-semibold', done ? 'text-teal-700' : active ? 'text-blue-700' : 'text-slate-400')}>
                        {step.label}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {isComplete && (
              <div className="mt-3 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-teal-600" />
                  <p className="text-xs font-semibold text-teal-700">Processing Complete</p>
                </div>
                <p className="text-[11px] text-teal-600 mt-0.5">All 7 answer segments analysed.</p>
              </div>
            )}
          </div>

          {/* Script Meta */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Script Details</p>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Student ID', value: 'STU-2021-0044' },
                { label: 'File', value: 'STU2021_0044_Okonkwo.pdf' },
                { label: 'Pages', value: '6' },
                { label: 'Words (OCR)', value: '~847' },
                { label: 'Segments Found', value: isComplete ? '7' : '—' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-500">{item.label}</span>
                  <span className="text-[12px] font-medium text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* OCR Output */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <FileText size={14} className="text-slate-500" />
            <p className="text-sm font-semibold text-slate-800">OCR Extracted Text</p>
            {!isComplete && (
              <div className="ml-auto flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin text-blue-500" />
                <span className="text-[11px] text-blue-600 font-medium">Extracting…</span>
              </div>
            )}
            {isComplete && (
              <div className="ml-auto flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                <span className="text-[11px] text-teal-600 font-medium">Segmentation complete</span>
              </div>
            )}
          </div>

          {isComplete && (
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-2.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Segments:</span>
              {segments.map((s) => (
                <span
                  key={s.label}
                  className={cn('rounded px-2 py-0.5 text-[10px] font-semibold', s.color.split(' ')[0])}
                >
                  {s.label}
                </span>
              ))}
            </div>
          )}

          <div className="p-5 overflow-auto" style={{ maxHeight: 480, minHeight: 300 }}>
            <div className="relative leading-7">
              {getHighlightedText()}
              {!isComplete && charCount < ocrText.length && (
                <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
