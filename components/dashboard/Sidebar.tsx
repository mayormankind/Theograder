"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  ClipboardList,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Cpu,
  X,
  Menu,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

interface NavItem {
  id: Page;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "exams", label: "Exams", icon: BookOpen, badge: 3 },
  { id: "scripts", label: "Scripts", icon: FileText, badge: 15 },
  { id: "rubrics", label: "Rubrics", icon: ClipboardList },
  { id: "results", label: "Results", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "??";

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [activePage, isMobile]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-[#0f1f3d] text-white shadow-lg"
        >
          <Menu size={20} />
        </button>
      )}

      <aside
        className={cn(
          "fixed lg:relative flex flex-col bg-[#0f1f3d] text-white transition-all duration-300 ease-in-out z-50 lg:z-0",
          collapsed ? "lg:w-17 w-60" : "w-60",
          isMobile
            ? mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
            : "translate-x-0",
        )}
        style={{ minHeight: "100vh" }}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center border-b border-white/10 px-4 py-5",
            collapsed ? "justify-center" : "gap-3",
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/20 ring-1 ring-teal-400/30">
            <Cpu size={18} className="text-teal-400" />
          </div>
          {!collapsed && (
            <div className="flex flex-1 overflow-hidden">
              <span className="block truncate text-sm font-bold tracking-tight text-white">
                AutoGrade <span className="text-teal-400">AI</span>
              </span>
              <span className="block truncate text-[10px] font-medium uppercase tracking-widest text-white/40">
                Academic System
              </span>
            </div>
          )}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-2 text-white/60 hover:text-white lg:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Nav Label */}
        {!collapsed && (
          <p className="px-4 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Navigation
          </p>
        )}

        {/* Nav Items */}
        <nav className="flex flex-col gap-0.5 px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-teal-500/15 text-teal-300 ring-1 ring-teal-400/20"
                    : "text-white/60 hover:bg-white/5 hover:text-white/90",
                )}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-teal-400" />
                )}
                <Icon
                  size={17}
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive
                      ? "text-teal-400"
                      : "text-white/50 group-hover:text-white/80",
                  )}
                />
                {!collapsed && (
                  <span className="flex-1 truncate text-left">
                    {item.label}
                  </span>
                )}
                {!collapsed && item.badge !== undefined && (
                  <span
                    className={cn(
                      "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      isActive
                        ? "bg-teal-400/20 text-teal-300"
                        : "bg-white/10 text-white/50",
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge !== undefined && (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-teal-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-4 mt-auto mb-4 border-t border-white/10 pt-4">
          {/* Avatar */}
          <div
            className={cn(
              "flex items-center gap-2.5",
              collapsed && "justify-center",
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-teal-400 to-blue-500 text-xs font-bold text-white uppercase">
              {userInitials}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="truncate text-[12px] font-semibold text-white/80">
                  {user?.name || "Loading..."}
                </p>
                <p className="truncate text-[10px] text-white/40 capitalize">
                  {user?.role?.toLowerCase() || "Lecturer"}
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
            >
              <LogOut size={17} />
              <span>Logout</span>
            </button>
          )}
          {collapsed && (
            <button
              onClick={handleLogout}
              className="mt-4 flex w-full justify-center rounded-lg py-2 text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
              title="Logout"
            >
              <LogOut size={17} />
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-18 h-6 w-6 items-center justify-center rounded-full bg-[#0f1f3d] ring-1 ring-white/20 text-white/60 hover:text-white transition-colors z-10"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
    </>
  );
}
