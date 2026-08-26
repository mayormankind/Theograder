"use client";

import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  FolderOpen,
  Zap,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Page } from '@/types';

interface UploadPageProps {
  onNavigate: (page: Page) => void;
}

interface Exam {
  id: string;
  title: string;
  courseCode?: string;
  courseName?: string;
  hasRubric?: boolean;
  rubricTitle?: string;
}

type FileStatus =
  | 'queued'      // selected locally, nothing sent yet
  | 'uploading'   // PUT to storage in progress
  | 'uploaded'    // stored + DB record created
  | 'grading'     // OCR + segmentation + scoring running
  | 'graded'      // processed
  | 'error';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  status: FileStatus;
  progress: number;
  file?: File;
  scriptId?: string;
  stage?: 'upload' | 'grade';   // which phase failed (for retry messaging)
  errorMessage?: string;
}

const UPLOAD_CONCURRENCY = 3;

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const statusConfig: Record<
  FileStatus,
  { label: string; color: string; bg: string; ring: string; icon: React.ComponentType<{ size?: number; className?: string }>; spin?: boolean }
> = {
  queued:    { label: 'Queued',      color: 'text-slate-600',  bg: 'bg-slate-50',  ring: 'ring-slate-200',  icon: FolderOpen },
  uploading: { label: 'Uploading…',  color: 'text-blue-600',   bg: 'bg-blue-50',   ring: 'ring-blue-200',   icon: Loader2, spin: true },
  uploaded:  { label: 'Uploaded',    color: 'text-teal-600',   bg: 'bg-teal-50',   ring: 'ring-teal-200',   icon: CheckCircle2 },
  grading:   { label: 'Grading…',    color: 'text-amber-600',  bg: 'bg-amber-50',  ring: 'ring-amber-200',  icon: Loader2, spin: true },
  graded:    { label: 'Graded',      color: 'text-teal-700',   bg: 'bg-teal-50',   ring: 'ring-teal-300',   icon: CheckCircle2 },
  error:     { label: 'Failed',      color: 'text-red-600',    bg: 'bg-red-50',    ring: 'ring-red-200',    icon: AlertCircle },
};

// Upload a file straight to storage with a real progress signal (fetch can't
// report upload progress, so we use XHR for an honest percentage).
function putWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Storage upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

// Run async workers with a bounded concurrency.
async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];
  const runners = Array.from(
    { length: Math.min(limit, queue.length) },
    async () => {
      while (queue.length) {
        const next = queue.shift();
        if (next !== undefined) await worker(next);
      }
    },
  );
  await Promise.all(runners);
}

export default function UploadPage({ onNavigate }: UploadPageProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [running, setRunning] = useState(false);
  const [gradeNow, setGradeNow] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ref mirror so async workers always read the latest toggle value.
  const gradeNowRef = useRef(gradeNow);
  useEffect(() => { gradeNowRef.current = gradeNow; }, [gradeNow]);

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const rubricMissing = !!selectedExam && selectedExam.hasRubric === false;
  const canGradeNow = gradeNow && !rubricMissing;

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setExamsLoading(true);
      const response = await fetch('/api/exams');
      if (!response.ok) throw new Error('Failed to fetch exams');
      const data = await response.json();

      // Enrich each exam with rubric readiness so we can warn before grading.
      const enriched: Exam[] = await Promise.all(
        (data.exams || []).map(async (exam: Exam) => {
          try {
            const r = await fetch(`/api/rubrics?examId=${exam.id}`);
            if (r.ok) {
              const rd = await r.json();
              const has = !!(rd.rubrics && rd.rubrics.length > 0);
              return { ...exam, hasRubric: has, rubricTitle: has ? rd.rubrics[0].title : undefined };
            }
          } catch { /* ignore */ }
          return { ...exam, hasRubric: false };
        }),
      );

      setExams(enriched);
      if (enriched.length > 0) setSelectedExamId(enriched[0].id);
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError('Failed to load exams');
    } finally {
      setExamsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 20 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) {
      setError('Invalid file type or size. Please upload images or PDFs under 20MB.');
      return;
    }

    const existingKeys = new Set(files.map((f) => `${f.name}-${f.size}`));
    const deduped = validFiles.filter((f) => !existingKeys.has(`${f.name}-${f.size}`));

    if (deduped.length === 0) {
      setError('All selected files are already in the queue.');
      return;
    }

    const skipped = validFiles.length - deduped.length;
    const mapped: FileItem[] = deduped.map((f, i) => ({
      id: `new-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      type: f.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
      status: 'queued',
      progress: 0,
      file: f,
    }));

    setFiles((prev) => [...prev, ...mapped]);
    setShowSummary(false);
    setError(skipped > 0 ? `${skipped} duplicate file${skipped > 1 ? 's' : ''} skipped.` : null);
  };

  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  const updateFile = (id: string, patch: Partial<FileItem>) =>
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  // Upload (and optionally grade) a single file. Idempotent on retry: if it
  // already has a scriptId the upload phase is skipped.
  const processOne = async (item: FileItem) => {
    let scriptId = item.scriptId;

    if (!scriptId) {
      try {
        updateFile(item.id, { status: 'uploading', progress: 0, errorMessage: undefined, stage: undefined });

        const presignRes = await fetch('/api/upload/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examId: selectedExamId,
            files: [{ name: item.name, size: item.size, type: item.file!.type }],
          }),
        });
        if (!presignRes.ok) {
          const e = await presignRes.json().catch(() => ({}));
          throw new Error(e.error || 'Failed to initialize upload');
        }
        const { presignedFiles } = await presignRes.json();
        const presigned = presignedFiles[0];

        await putWithProgress(presigned.signedUrl, item.file!, (pct) =>
          updateFile(item.id, { progress: pct }),
        );

        const confirmRes = await fetch('/api/upload/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examId: selectedExamId,
            originalName: presigned.originalName,
            fileSize: presigned.fileSize,
            mimeType: presigned.mimeType,
            storagePath: presigned.storagePath,
          }),
        });
        if (!confirmRes.ok) {
          const e = await confirmRes.json().catch(() => ({}));
          throw new Error(e.error || 'Failed to confirm upload');
        }
        const data = await confirmRes.json();
        scriptId = data.script.id as string;
        updateFile(item.id, { status: 'uploaded', progress: 100, scriptId });
      } catch (err) {
        updateFile(item.id, {
          status: 'error',
          stage: 'upload',
          errorMessage: err instanceof Error ? err.message : 'Upload failed',
        });
        return;
      }
    }

    if (gradeNowRef.current && !rubricMissing && scriptId) {
      try {
        updateFile(item.id, { status: 'grading', errorMessage: undefined, stage: undefined });
        const res = await fetch(`/api/scripts/${scriptId}/process`, { method: 'POST' });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.error || 'Grading failed');
        }
        updateFile(item.id, { status: 'graded', file: undefined });
      } catch (err) {
        updateFile(item.id, {
          status: 'error',
          stage: 'grade',
          errorMessage: err instanceof Error ? err.message : 'Grading failed',
        });
      }
    } else {
      // Upload-only path: free the in-memory blob but keep the scriptId.
      updateFile(item.id, { file: undefined });
    }
  };

  const handleRun = async () => {
    if (!selectedExamId) {
      setError('Please select an exam');
      return;
    }
    const pending = files.filter(
      (f) =>
        f.status === 'queued' ||
        f.status === 'error' ||
        (f.status === 'uploaded' && canGradeNow),
    );
    if (pending.length === 0) {
      setError('No files to process');
      return;
    }

    setError(null);
    setShowSummary(false);
    setRunning(true);
    try {
      await runWithConcurrency(pending, UPLOAD_CONCURRENCY, processOne);
    } finally {
      setRunning(false);
      setShowSummary(true);
    }
  };

  const retryFile = (item: FileItem) => {
    if (running) return;
    void processOne(item);
  };

  // ── Derived counts ────────────────────────────────────
  const counts = {
    total: files.length,
    pending: files.filter((f) => f.status === 'queued').length,
    uploaded: files.filter((f) => f.status === 'uploaded').length,
    graded: files.filter((f) => f.status === 'graded').length,
    error: files.filter((f) => f.status === 'error').length,
    done: files.filter((f) => f.status === 'graded' || f.status === 'uploaded').length,
  };
  const actionable = files.filter(
    (f) =>
      f.status === 'queued' ||
      f.status === 'error' ||
      (f.status === 'uploaded' && canGradeNow),
  ).length;

  const primaryLabel = running
    ? 'Working…'
    : canGradeNow
      ? `Upload & Grade (${actionable})`
      : `Upload (${actionable})`;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">
      {/* Error / notice */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-xs font-semibold text-red-800">Notice</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-slate-800">Upload Examination Scripts</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Drop scripts, upload straight to secure storage, and (optionally) grade them in one step.
        </p>
      </div>

      {/* Exam selector + rubric readiness */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Associate with Examination
        </label>
        <div className="relative">
          <select
            value={selectedExamId}
            onChange={(e) => { setSelectedExamId(e.target.value); setShowSummary(false); }}
            disabled={examsLoading || exams.length === 0 || running}
            className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {examsLoading ? (
              <option value="">Loading exams...</option>
            ) : exams.length === 0 ? (
              <option value="">No exams available</option>
            ) : (
              exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} {exam.courseCode ? `(${exam.courseCode})` : ''}
                </option>
              ))
            )}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Rubric readiness line */}
        {selectedExam && (
          <div className="mt-3">
            {selectedExam.hasRubric ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-teal-700">
                <CheckCircle2 size={12} /> Rubric ready{selectedExam.rubricTitle ? `: ${selectedExam.rubricTitle}` : ''}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
                <AlertTriangle size={12} /> No rubric yet — scripts can be uploaded, but grading is disabled until you create one.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !running && fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-white px-6 py-10 sm:px-8 sm:py-14 text-center transition-all',
          running ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
          isDragging
            ? 'border-teal-400 bg-teal-50/50 scale-[1.01]'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          disabled={running}
          onChange={(e) => addFiles(Array.from(e.target.files || []))}
        />
        <div className={cn(
          'flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl transition-colors',
          isDragging ? 'bg-teal-100' : 'bg-slate-100',
        )}>
          <Upload size={isDragging ? 24 : 28} className={isDragging ? 'text-teal-500' : 'text-slate-400'} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">
            {isDragging ? 'Drop files here' : 'Drag & drop script files here'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            or <span className="text-teal-600 font-medium underline underline-offset-2">browse files</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] sm:text-[11px] font-medium text-slate-600">
            <FileText size={11} /> PDF
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] sm:text-[11px] font-medium text-slate-600">
            <ImageIcon size={11} /> JPG / PNG
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] sm:text-[11px] font-medium text-slate-600">
            Max 20MB
          </span>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <FolderOpen size={14} className="text-slate-500" />
              <p className="text-sm font-semibold text-slate-800">Files</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {files.length}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {counts.done} done{counts.error > 0 ? ` · ${counts.error} failed` : ''}
            </p>
          </div>

          <div className="divide-y divide-slate-50">
            {files.map((file) => {
              const cfg = statusConfig[file.status];
              const Icon = cfg.icon;
              const isImg = file.type === 'image';
              return (
                <div key={file.id} className="flex flex-col xs:flex-row xs:items-center gap-3 px-5 py-4 xs:gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      isImg ? 'bg-violet-50 ring-1 ring-violet-200' : 'bg-blue-50 ring-1 ring-blue-200',
                    )}>
                      {isImg ? (
                        <ImageIcon size={15} className="text-violet-600" />
                      ) : (
                        <FileText size={15} className="text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-800 truncate">{file.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-slate-400">{formatSize(file.size)}</span>
                        {file.status === 'uploading' && (
                          <div className="flex items-center gap-2 flex-1 max-w-[140px]">
                            <div className="h-1 w-full rounded-full bg-slate-100">
                              <div
                                className="h-1 rounded-full bg-blue-400 transition-all"
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 tabular-nums">{file.progress}%</span>
                          </div>
                        )}
                        {file.status === 'error' && file.errorMessage && (
                          <span className="text-[11px] text-red-500 truncate max-w-[220px]" title={file.errorMessage}>
                            {file.stage === 'grade' ? 'Grading: ' : 'Upload: '}{file.errorMessage}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between xs:justify-end gap-2 xs:ml-auto">
                    <span className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1', cfg.bg, cfg.color, cfg.ring)}>
                      <Icon size={11} className={cfg.spin ? 'animate-spin' : ''} />
                      {cfg.label}
                    </span>
                    {file.status === 'error' && (
                      <button
                        onClick={() => retryFile(file)}
                        disabled={running}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-teal-700 bg-teal-50 ring-1 ring-teal-200 hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Retry this file"
                      >
                        <RefreshCw size={11} /> Retry
                      </button>
                    )}
                    {(file.status === 'queued' || file.status === 'error') && !running && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Post-run summary (no auto-navigation, so failures stay visible) */}
      {showSummary && !running && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="text-sm text-slate-700">
            <span className="font-semibold">Done.</span>{' '}
            {counts.graded > 0 && `${counts.graded} graded. `}
            {counts.uploaded > 0 && `${counts.uploaded} uploaded (not graded). `}
            {counts.error > 0 && (
              <span className="text-red-600">{counts.error} failed — retry above.</span>
            )}
          </div>
          <button
            onClick={() => onNavigate('scripts')}
            className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            <Eye size={14} /> View scripts
          </button>
        </div>
      )}

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-teal-100 bg-teal-50 p-5">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-teal-800">
            {actionable} file(s) ready to {canGradeNow ? 'upload & grade' : 'upload'}
          </p>
          <label className={cn(
            'inline-flex items-center gap-2 text-xs',
            rubricMissing ? 'text-slate-400 cursor-not-allowed' : 'text-teal-700 cursor-pointer',
          )}>
            <input
              type="checkbox"
              checked={canGradeNow}
              disabled={rubricMissing || running}
              onChange={(e) => setGradeNow(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5 disabled:opacity-50"
            />
            <span className="inline-flex items-center gap-1">
              <Zap size={12} /> Grade immediately after upload
            </span>
          </label>
        </div>
        <button
          onClick={handleRun}
          disabled={actionable === 0 || running || !selectedExamId}
          className="flex items-center gap-2 rounded-lg bg-[#0f1f3d] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#162b52] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {running ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Zap size={14} />
          )}
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
