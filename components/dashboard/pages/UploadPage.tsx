"use client";

import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  Image,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Page } from '@/types';

interface UploadPageProps {
  onNavigate: (page: Page) => void;
}

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploaded' | 'processing' | 'done' | 'error';
  progress: number;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const statusConfig = {
  uploaded: { label: 'Uploaded', color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200', icon: CheckCircle2 },
  processing: { label: 'Processing…', color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200', icon: Loader2 },
  done: { label: 'Complete', color: 'text-teal-600', bg: 'bg-teal-50', ring: 'ring-teal-200', icon: CheckCircle2 },
  error: { label: 'Error', color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-200', icon: AlertCircle },
};

const mockFiles: FileItem[] = [
  { id: 'f1', name: 'STU2021_0044_Okonkwo.pdf', size: 2.3 * 1024 * 1024, type: 'pdf', status: 'done', progress: 100 },
  { id: 'f2', name: 'STU2021_0071_Nwosu.pdf', size: 1.8 * 1024 * 1024, type: 'pdf', status: 'done', progress: 100 },
  { id: 'f3', name: 'STU2021_0089_AlHassan.jpg', size: 3.1 * 1024 * 1024, type: 'image', status: 'processing', progress: 63 },
];

export default function UploadPage({ onNavigate }: UploadPageProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [selectedExam, setSelectedExam] = useState('Database Systems — Final Examination (CSC 401)');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const addFiles = (newFiles: File[]) => {
    const mapped: FileItem[] = newFiles.map((f, i) => ({
      id: `new-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      type: f.name.endsWith('.pdf') ? 'pdf' : 'image',
      status: 'uploaded',
      progress: 100,
    }));
    setFiles((prev) => [...prev, ...mapped]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleProcess = () => {
    onNavigate('processing');
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-slate-800">Upload Examination Scripts</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Upload PDF or image files of student answer scripts. OCR will extract text automatically.
        </p>
      </div>

      {/* Exam Selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Associate with Examination
        </label>
        <div className="relative">
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
          >
            <option>Database Systems — Final Examination (CSC 401)</option>
            <option>Software Engineering Principles (CSC 312)</option>
            <option>Algorithms & Complexity — Mid-Semester (CSC 305)</option>
            <option>Computer Networks — Theory Paper (CSC 415)</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Make sure the rubric for this exam is configured before processing.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-white px-8 py-14 text-center cursor-pointer transition-all',
          isDragging
            ? 'border-teal-400 bg-teal-50/50 scale-[1.01]'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => addFiles(Array.from(e.target.files || []))}
        />
        <div className={cn(
          'flex h-16 w-16 items-center justify-center rounded-2xl transition-colors',
          isDragging ? 'bg-teal-100' : 'bg-slate-100'
        )}>
          <Upload size={28} className={isDragging ? 'text-teal-500' : 'text-slate-400'} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">
            {isDragging ? 'Drop files here' : 'Drag & drop script files here'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            or <span className="text-teal-600 font-medium underline underline-offset-2">browse files</span> from your computer
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-600">
            <FileText size={11} /> PDF
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-600">
            <Image size={11} /> JPG / PNG
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-600">
            Max 20 MB per file
          </span>
        </div>
        {isDragging && (
          <div className="absolute inset-0 rounded-xl border-2 border-teal-400 pointer-events-none animate-pulse" />
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <FolderOpen size={14} className="text-slate-500" />
              <p className="text-sm font-semibold text-slate-800">Queued Files</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {files.length}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {files.filter((f) => f.status === 'done').length} of {files.length} ready
            </p>
          </div>

          <div className="divide-y divide-slate-50">
            {files.map((file) => {
              const cfg = statusConfig[file.status];
              const Icon = cfg.icon;
              const isImg = file.type === 'image';
              return (
                <div key={file.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    isImg ? 'bg-violet-50 ring-1 ring-violet-200' : 'bg-blue-50 ring-1 ring-blue-200'
                  )}>
                    {isImg ? (
                      <Image size={15} className="text-violet-600" />
                    ) : (
                      <FileText size={15} className="text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-slate-800 truncate">{file.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-slate-400">{formatSize(file.size)}</span>
                      {file.status === 'processing' && (
                        <div className="flex-1 max-w-[120px]">
                          <div className="h-1 w-full rounded-full bg-slate-100">
                            <div
                              className="h-1 rounded-full bg-amber-400 transition-all"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1', cfg.bg, cfg.color, cfg.ring)}>
                    <Icon size={11} className={file.status === 'processing' ? 'animate-spin' : ''} />
                    {cfg.label}
                  </span>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-teal-100 bg-teal-50 p-5">
        <div>
          <p className="text-sm font-semibold text-teal-800">
            {files.filter((f) => f.status === 'done' || f.status === 'uploaded').length} file(s) ready to process
          </p>
          <p className="text-xs text-teal-600 mt-0.5">
            OCR extraction + semantic analysis will begin upon confirmation.
          </p>
        </div>
        <button
          onClick={handleProcess}
          disabled={files.filter((f) => f.status === 'done' || f.status === 'uploaded').length === 0}
          className="flex items-center gap-2 rounded-lg bg-[#0f1f3d] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#162b52] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          Process Scripts
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
