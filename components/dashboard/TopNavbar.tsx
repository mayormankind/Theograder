"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
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

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export default function TopNavbar({ activePage, onNavigate, onMenuClick }: TopNavbarProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?limit=5");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        // Optimistic UI updates
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }

    setShowNotifs(false);
    
    // Redirect to correct dashboard tab/page if link exists
    if (link) {
      if (link.startsWith("/dashboard/results")) {
        const urlParams = new URLSearchParams(link.split("?")[1] || "");
        const examId = urlParams.get("examId") || "";
        onNavigate("results", examId ? { examId } : undefined);
      } else if (link.startsWith("/dashboard/grading")) {
        // Parse scriptId if present
        const urlParams = new URLSearchParams(link.split("?")[1] || "");
        const scriptId = urlParams.get("scriptId") || "";
        onNavigate("grading", scriptId ? { scriptId } : undefined);
      } else {
        router.push(link);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

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

  // Helper mapping notification colors
  const getTypeColor = (type: string) => {
    switch (type) {
      case "GRADING_COMPLETE": return "bg-teal-400";
      case "SCRIPT_FLAGGED": return "bg-amber-400";
      case "SYSTEM_ERROR": return "bg-red-400";
      case "RUBRIC_EXTRACTED": return "bg-blue-400";
      default: return "bg-slate-300";
    }
  };

  // Helper parsing timestamps
  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

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

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifs(!showNotifs)}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
        {showNotifs && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
            <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Notifications</p>
                  <p className="text-[10px] text-slate-400 font-medium">{unreadCount} unread items</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] font-bold text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-75 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                    <p className="text-xs font-semibold text-slate-400">All caught up! 🎉</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id, n.link)}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50",
                        !n.read && "bg-teal-50/20"
                      )}
                    >
                      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", getTypeColor(n.type))} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs text-slate-700 truncate", !n.read ? "font-semibold" : "font-medium")}>
                          {n.title}
                        </p>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                        <p className="text-[9px] text-slate-300 font-semibold mt-1">{formatTime(n.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Profile */}
      <div className="relative">
        <button
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100 transition-colors"
        >
          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-teal-400 to-blue-500 ring-1 ring-slate-200">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white uppercase">
                {userInitials}
              </div>
            )}
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
