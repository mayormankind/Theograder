"use client";

import { useEffect } from "react";
import ExamsPage from "@/components/dashboard/pages/ExamsPage";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";

export default function Page() {
  const router = useRouter();
  useEffect(() => { document.title = "Exams | TheoGrader"; }, []);
  const handleNavigate = (page: Page, params?: Record<string, string>) => {
    let url = `/dashboard/${page}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    router.push(url);
  };

  return <ExamsPage onNavigate={handleNavigate} />;
}
