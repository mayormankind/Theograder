"use client";

import { useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  Upload,
  Plus,
  LogOut,
  User,
  Settings as SettingsIcon,
  Menu,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const pageTitles: Record<Page, string> = {
  dashboard: "Dashboard",
  exams: "Exams",
  scripts: "Scripts",
  upload: "Upload Script",
  rubrics: "Rubric Builder",
  "create-rubric": "Create Rubric",
  results: "Grading Results",
  report: "Result Report",
  settings: "Settings",
  grading: "Grading",
};

const pageBreadcrumbs: Record<Page, string[]> = {
  dashboard: ["TheoGrader", "Dashboard"],
  exams: ["TheoGrader", "Exams"],
  scripts: ["TheoGrader", "Scripts"],
  upload: ["TheoGrader", "Scripts", "Upload Script"],
  rubrics: ["TheoGrader", "Rubrics"],
  "create-rubric": ["TheoGrader", "Rubrics", "Create Rubric"],
  results: ["TheoGrader", "Results"],
  report: ["TheoGrader", "Results", "Report"],
  settings: ["TheoGrader", "Settings"],
  grading: ["TheoGrader", "Grading"],
};

interface TopNavbarProps {
  activePage: Page;
  onNavigate: (page: Page, params?: Record<string, string>) => void;
  onMenuClick?: () => void;
}

export default function TopNavbar({ activePage, onNavigate, onMenuClick }: TopNavbarProps) {
  const [notifications] = useState(4);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        toast.success("Logged out successfully");
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed");
    }
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "??";

  const breadcrumbs = pageBreadcrumbs[activePage] || ["TheoGrader"];
  const title = pageTitles[activePage] || "Dashboard";

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 md:px-6">
      {/* Mobile Menu Toggle */}
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 lg:hidden"
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb / Title */}
      <div className="flex flex-col justify-center overflow-hidden">
        <h1 className="text-[14px] md:text-[15px] font-semibold text-slate-800 truncate">{title}</h1>
        <nav className="hidden sm:flex items-center gap-1">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-slate-300 text-[10px]">/</span>}
              <span
                className={
                  i === breadcrumbs.length - 1
                    ? "text-[10px] md:text-[11px] font-medium text-teal-600"
                    : "text-[10px] md:text-[11px] text-slate-400"
                }
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden lg:block">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search scripts, exams…"
          className="h-9 w-48 xl:w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
        />
      </div>

      {/* Quick Actions */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={() => onNavigate("upload")}
          className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <Upload size={13} />
          Upload
        </button>
        <button
          onClick={() => onNavigate("rubrics")}
          className="flex items-center gap-1.5 rounded-lg bg-[#0f1f3d] px-3 py-2 text-xs font-medium text-white hover:bg-[#162b52] transition-colors"
        >
          <Plus size={13} />
          New Exam
        </button>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifs(!showNotifs)}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Bell size={15} />
          {notifications > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {notifications}
            </span>
          )}
        </button>
        {showNotifs && (
          <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">
                Notifications
              </p>
              <p className="text-xs text-slate-400">{notifications} unread</p>
            </div>
            {[
              {
                text: "3 scripts processed for CSC 401",
                time: "2 min ago",
                dot: "bg-teal-400",
              },
              {
                text: "Fatima Al-Hassan requires score review",
                time: "18 min ago",
                dot: "bg-amber-400",
              },
              {
                text: "Rubric for CSC 415 saved successfully",
                time: "1 hr ago",
                dot: "bg-blue-400",
              },
              {
                text: "12 scripts graded successfully",
                time: "Yesterday",
                dot: "bg-slate-300",
              },
            ].map((n, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50"
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.dot}`}
                />
                <div>
                  <p className="text-xs font-medium text-slate-700">{n.text}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
            <div className="px-4 py-2.5 text-center">
              <button className="text-xs font-medium text-teal-600 hover:text-teal-700">
                View all notifications
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="relative">
        <button
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-teal-400 to-blue-500 text-[10px] font-bold text-white uppercase">
            {userInitials}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800">
              {user?.name || "Loading..."}
            </p>
            <p className="text-[10px] text-slate-400 capitalize">
              {user?.role?.toLowerCase() || "Lecturer"}
            </p>
          </div>
          <ChevronDown
            size={12}
            className={cn(
              "text-slate-400 transition-transform",
              showProfileDropdown && "rotate-180",
            )}
          />
        </button>

        {showProfileDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowProfileDropdown(false)}
            />
            <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <button
                onClick={() => {
                  onNavigate("settings", { tab: "profile" });
                  setShowProfileDropdown(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <User size={14} />
                Profile Settings
              </button>
              <button
                onClick={() => {
                  onNavigate("settings", { tab: "security" });
                  setShowProfileDropdown(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <SettingsIcon size={14} />
                Account Settings
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
