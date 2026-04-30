"use client";

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
import {
  mockActivity,
  mockScripts,
  weeklyProcessingData,
  scoreDistributionData,
} from "@/lib/mockData";
import type { Page } from "@/types";
import { cn } from "@/lib/utils";

interface DashboardPageProps {
  onNavigate: (page: Page) => void;
}

const statCards = [
  {
    label: "Total Scripts Uploaded",
    value: "242",
    delta: "+18 this week",
    positive: true,
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50",
    ring: "ring-blue-100",
  },
  {
    label: "Scripts Processed",
    value: "215",
    delta: "88.8% complete",
    positive: true,
    icon: CheckCircle2,
    color: "text-teal-600",
    bg: "bg-teal-50",
    ring: "ring-teal-100",
  },
  {
    label: "Pending Reviews",
    value: "12",
    delta: "5 flagged low confidence",
    positive: false,
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-100",
  },
  {
    label: "Avg. Confidence Score",
    value: "84.2%",
    delta: "+2.1% vs last batch",
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

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const recentScripts = mockScripts.slice(0, 5);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800">
            Good morning, Dr. Eze 👋
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            You have{" "}
            <span className="font-semibold text-amber-600">12 scripts</span>{" "}
            awaiting review and{" "}
            <span className="font-semibold text-blue-600">3 active exams</span>{" "}
            in progress.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
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
                Weekly Processing Activity
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Scripts uploaded vs. processed — past 7 days
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#0f1f3d]" />
                Uploaded
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                Processed
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={weeklyProcessingData}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="uploaded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f1f3d" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0f1f3d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="processed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
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
                dataKey="uploaded"
                stroke="#0f1f3d"
                strokeWidth={2}
                fill="url(#uploaded)"
              />
              <Area
                type="monotone"
                dataKey="processed"
                stroke="#14b8a6"
                strokeWidth={2}
                fill="url(#processed)"
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
              Database Systems — Final (77 graded)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={scoreDistributionData}
              margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="range"
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
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {scoreDistributionData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === 2 || i === 3 ? "#14b8a6" : "#e2e8f0"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent Scripts Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <p className="text-sm font-semibold text-slate-800">
              Recent Scripts
            </p>
            <button
              onClick={() => onNavigate("scripts")}
              className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Student
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">
                  Exam
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentScripts.map((script) => (
                <tr
                  key={script.id}
                  onClick={() => onNavigate("results")}
                  className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-[10px] font-bold text-slate-600">
                        {script.studentName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-slate-800">
                          {script.studentName}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {script.studentId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <p className="text-[12px] text-slate-600 max-w-[180px] truncate">
                      {script.examTitle}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                        statusStyles[script.status],
                      )}
                    >
                      {statusLabels[script.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {script.score !== undefined ? (
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800">
                          {script.score}/{script.totalMarks}
                        </p>
                        {script.confidence && (
                          <p className="text-[10px] text-slate-400">
                            {script.confidence}% conf.
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-[12px] text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            {mockActivity.slice(0, 5).map((item) => {
              const cfg = activityIcons[item.type];
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
                      {item.description}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <p className="text-[10px] text-slate-400">{item.user}</p>
                      <span className="text-slate-200">·</span>
                      <p className="text-[10px] text-slate-400">
                        {item.timestamp.split(" ")[1]}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
