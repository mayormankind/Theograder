"use client";

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Loader2,
  ChevronRight,
  FileText,
  Cpu,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Page } from '@/types';

interface Batch {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalScripts: number;
  processedScripts: number;
  failedScripts: number;
  createdAt: string;
  completedAt?: string;
}

interface ProcessingPageProps {
  onNavigate: (page: Page) => void;
}

export default function ProcessingPage({ onNavigate }: ProcessingPageProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBatches();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchBatches, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/batches');
      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }
      const data = await response.json();
      setBatches(data.batches || []);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-teal-600 bg-teal-50 border-teal-200';
      case 'PROCESSING': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'FAILED': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  if (loading && batches.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-xs font-semibold text-red-800">Processing Error</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Batch Processing</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor script processing batches and their status
          </p>
        </div>
        <button
          onClick={fetchBatches}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Batches List */}
      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Cpu size={32} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">No processing batches</p>
          <p className="text-xs mt-1">Upload scripts to start processing</p>
          <button
            onClick={() => onNavigate('upload')}
            className="mt-4 rounded-lg bg-[#0f1f3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#162b52] transition-colors"
          >
            Upload Scripts
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {batches.map((batch) => {
            const progress = batch.totalScripts > 0 
              ? Math.round((batch.processedScripts / batch.totalScripts) * 100) 
              : 0;
            return (
              <div key={batch.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-200">
                      <Cpu size={18} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Batch {batch.id.slice(0, 8)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Created {new Date(batch.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-semibold border', getStatusColor(batch.status))}>
                    {batch.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Total Scripts</p>
                    <p className="text-lg font-bold text-slate-800">{batch.totalScripts}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Processed</p>
                    <p className="text-lg font-bold text-teal-600">{batch.processedScripts}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Failed</p>
                    <p className="text-lg font-bold text-red-600">{batch.failedScripts}</p>
                  </div>
                </div>

                {batch.status === 'PROCESSING' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs text-slate-500">Processing progress</p>
                      <p className="text-xs font-semibold text-slate-700">{progress}%</p>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {batch.status === 'COMPLETED' && (
                  <button
                    onClick={() => onNavigate('scripts')}
                    className="mt-4 flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
                  >
                    <CheckCircle2 size={14} />
                    View Results
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
