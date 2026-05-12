"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNavbar from "@/components/dashboard/TopNavbar";
import type { Page } from "@/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Derive active page from pathname
  const getActivePage = (path: string): Page => {
    const segments = path.split("/");
    const last = segments[segments.length - 1];
    if (last === "dashboard" || last === "") return "dashboard";
    return last as Page;
  };

  const [activePage, setActivePage] = useState<Page>(getActivePage(pathname));

  useEffect(() => {
    setActivePage(getActivePage(pathname));
    // Close mobile sidebar on route change
    setMobileOpen(false);
  }, [pathname]);

  const handleNavigate = (page: Page, params?: Record<string, string>) => {
    let url = page === "dashboard" ? "/dashboard" : `/dashboard/${page}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    router.push(url);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        activePage={activePage} 
        onNavigate={handleNavigate} 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNavbar 
          activePage={activePage} 
          onNavigate={handleNavigate} 
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
