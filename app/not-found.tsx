"use client";

import Link from "next/link";
import { Home, LayoutDashboard, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050b18] px-6 text-white overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
        {/* Animated Icon */}
        <div className="mb-8 relative group">
          <div className="absolute inset-0 bg-teal-400/20 rounded-full blur-2xl scale-150 group-hover:scale-200 transition-transform duration-700" />
          <div className="relative h-24 w-24 flex items-center justify-center rounded-2xl bg-linear-to-br from-teal-400/20 to-blue-500/20 border border-white/10 backdrop-blur-xl">
            <Search size={48} className="text-teal-400 animate-bounce" />
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-[120px] font-black leading-none tracking-tighter mb-4 bg-linear-to-b from-white to-white/40 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(20,184,166,0.3)]">
          404
        </h1>

        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-teal-400">
          Page Not Found
        </h2>

        <p className="text-slate-400 text-lg mb-10 leading-relaxed max-w-md">
          The script or page you are looking for seems to have been misplaced.
          Even our AI grader couldn't find it in the current assessment.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-[#050b18] font-bold hover:bg-teal-50 transition-all active:scale-95"
          >
            <Home size={18} />
            Return Home
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md font-bold text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <LayoutDashboard size={18} />
            Go to Dashboard
          </Link>
        </div>

        {/* Back Link */}
        <button
          onClick={() => window.history.back()}
          className="mt-12 flex items-center gap-2 text-slate-500 hover:text-teal-400 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={14} />
          Go back to previous page
        </button>
      </div>

      {/* Footer Brand */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center opacity-30">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-teal-400" />
          </div>
          <span className="text-sm font-bold tracking-widest uppercase">
            TheoGrader
          </span>
        </div>
      </div>
    </div>
  );
}
