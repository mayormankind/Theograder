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
  }, [pathname]);

  const handleNavigate = (page: Page) => {
    router.push(`/${page}`);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNavbar activePage={activePage} onNavigate={handleNavigate} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
