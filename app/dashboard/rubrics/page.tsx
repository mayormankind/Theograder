"use client";

import { useEffect } from "react";
import RubricsPage from "@/components/dashboard/pages/RubricsPage";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";

export default function Page() {
  const router = useRouter();
  useEffect(() => { document.title = "Rubrics | TheoGrader"; }, []);
  const handleNavigate = (page: Page, params?: Record<string, string>) => {
    let url = `/dashboard/${page}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    router.push(url);
  };

  return <RubricsPage onNavigate={handleNavigate} />;
}
