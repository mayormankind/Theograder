"use client";

import React, { useState, useEffect } from "react";

import {
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  Upload,
  Plus,
  ArrowUpRight,
  Activity,
  BookOpen,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import type { Page } from "@/types";
import { cn } from "@/lib/utils";

interface DashboardPageProps {
  onNavigate: (page: Page) => void;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface DashboardStats {
  overview: {
    totalExams: number;
    totalScriptsGraded: number;
    pendingReview: number;
    avgConfidence: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    resource: string;
    resourceId: string;
    createdAt: string;
  }>;
  gradingTrends: Array<{
    date: string;
    count: number;
    avgConfidence: number;
  }>;
  examStatusCounts: Record<string, number>;
  scoreDistribution: Array<{
    examId: string;
    examTitle: string;
    avgScore: number;
    maxScore: number;
    percentage: number;
  }>;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard stats and user data in parallel
      const [statsResponse, userResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/auth/me')
      ]);
      
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const statsData = await statsResponse.json();
      const userData = await userResponse.json();
      
      setStats(statsData);
      setUser(userData.user);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-slate-600">Failed to load dashboard data</p>
        <button
          onClick={fetchDashboardStats}
          className="rounded-lg bg-[#0f1f3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#162b52] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: "Total Exams",
      value: stats.overview.totalExams.toString(),
      delta: "",
      positive: true,
      icon: BookOpen,
      color: "text-blue-600",
      bg: "bg-blue-50",
      ring: "ring-blue-100",
    },
    {
      label: "Scripts Graded",
      value: stats.overview.totalScriptsGraded.toString(),
      delta: "",
      positive: true,
      icon: CheckCircle2,
      color: "text-teal-600",
      bg: "bg-teal-50",
      ring: "ring-teal-100",
    },
    {
      label: "Pending Reviews",
      value: stats.overview.pendingReview.toString(),
      delta: "",
      positive: false,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      ring: "ring-amber-100",
    },
    {
      label: "Avg. Confidence Score",
      value: `${(stats.overview.avgConfidence * 100).toFixed(1)}%`,
      delta: "",
      positive: true,
      icon: TrendingUp,
      color: "text-violet-600",
      bg: "bg-violet-50",
      ring: "ring-violet-100",
    },
  ];

const activityIcons: Record<
  string,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
    bg: string;
  }
> = {
  upload: { icon: Upload, color: "text-blue-600", bg: "bg-blue-50" },
  processed: { icon: CheckCircle2, color: "text-teal-600", bg: "bg-teal-50" },
  reviewed: { icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
  exam_created: {
    icon: BookOpen,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
};

const statusStyles: Record<string, string> = {
  done: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  processing: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  pending_review: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  uploaded: "bg-slate-50 text-slate-600 ring-1 ring-slate-200",
};

const statusLabels: Record<string, string> = {
  done: "Graded",
  processing: "Processing",
  pending_review: "Review Needed",
  uploaded: "Queued",
};

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Welcome Banner */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 bg-white px-6 py-4 gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800 text-center sm:text-left">
            Welcome back, {user?.name || 'User'}! 👋
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 text-center sm:text-left">
            You have{" "}
            <span className="font-semibold text-amber-600">{stats.overview.pendingReview} scripts</span>{" "}
            awaiting review and{" "}
            <span className="font-semibold text-blue-600">{stats.overview.totalExams} total exams</span>{" "}
            created.
          </p>
        </div>
        <div className="flex sm:hidden md:flex items-center justify-center gap-2">
          <button
            onClick={() => onNavigate("upload")}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Upload size={14} />
            Upload Script
          </button>
          <button
            onClick={() => onNavigate("exams")}
            className="flex items-center gap-2 rounded-lg bg-[#0f1f3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#162b52] transition-colors"
          >
            <Plus size={14} />
            Create Exam
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg ring-1",
                    card.bg,
                    card.ring,
                  )}
                >
                  <Icon size={18} className={card.color} />
                </div>
                <ArrowUpRight
                  size={15}
                  className="text-slate-300 group-hover:text-slate-400 transition-colors"
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 tracking-tight">
                  {card.value}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
              </div>
              <div
                className={cn(
                  "text-[11px] font-medium",
                  card.positive ? "text-teal-600" : "text-amber-600",
                )}
              >
                {card.delta}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Area Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Grading Trends
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Scripts graded — past 30 days
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#0f1f3d]" />
                Graded
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                Confidence
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={stats.gradingTrends}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="graded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f1f3d" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0f1f3d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="confidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#0f1f3d"
                strokeWidth={2}
                fill="url(#graded)"
              />
              <Area
                type="monotone"
                dataKey="avgConfidence"
                stroke="#14b8a6"
                strokeWidth={2}
                fill="url(#confidence)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart — Score Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-800">
              Score Distribution
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Average scores by exam
            </p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={stats.scoreDistribution}
              margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="examTitle"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                {stats.scoreDistribution.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i % 2 === 0 ? "#14b8a6" : "#e2e8f0"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-slate-800">
            Recent Activity
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            System & lecturer actions
          </p>
        </div>
        <div className="divide-y divide-slate-50">
          {stats.recentActivity.map((item) => {
            const actionType = item.action.toLowerCase();
            const cfg = activityIcons[actionType] || activityIcons.upload;
            const Icon = cfg.icon;
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 px-5 py-3.5"
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    cfg.bg,
                  )}
                >
                  <Icon size={13} className={cfg.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-slate-700 leading-snug">
                    {item.action}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <p className="text-[10px] text-slate-400">You</p>
                    <span className="text-slate-200">·</span>
                    <p className="text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
