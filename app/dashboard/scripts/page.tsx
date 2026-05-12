"use client";

import ScriptsPage from "@/components/dashboard/pages/ScriptsPage";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page, params?: Record<string, string>) => {
    let url = `/dashboard/${page}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    router.push(url);
  };

  return <ScriptsPage onNavigate={handleNavigate} />;
}
