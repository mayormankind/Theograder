"use client";

import Link from "next/link";
import { Home, LayoutDashboard, FileX, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-slate-800">
      {/* Content Container */}
      <div className="flex flex-col items-center text-center max-w-xl">
        {/* Icon */}
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm">
          <FileX size={40} className="text-slate-400" />
        </div>

        {/* 404 Text */}
        <h1 className="text-[80px] font-bold leading-none tracking-tight mb-4 text-slate-200">
          404
        </h1>

        <h2 className="text-xl md:text-2xl font-semibold mb-3 text-slate-800">
          Page Not Found
        </h2>

        <p className="text-slate-500 text-sm md:text-base mb-10 leading-relaxed max-w-md">
          The page you're looking for doesn't exist or has been moved.
          Please check the URL or navigate to another section.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <Home size={16} />
            Return Home
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors"
          >
            <LayoutDashboard size={16} />
            Go to Dashboard
          </Link>
        </div>

        {/* Back Link */}
        <button
          onClick={() => window.history.back()}
          className="mt-8 flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={14} />
          Go back to previous page
        </button>
      </div>

      {/* Footer Brand */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-sm font-medium">
            TheoGrader
          </span>
        </div>
      </div>
    </div>
  );
}
