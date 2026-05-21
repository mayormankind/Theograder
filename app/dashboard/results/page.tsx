// src/app/dashboard/results/page.tsx
"use client";

import { Suspense } from "react";
import ResultsPage from "@/components/dashboard/pages/ResultsPage";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";
import ResultsPageTwo from "@/components/dashboard/pages/ResultsPageTwo";

function ResultsPageWrapper({
  onNavigate,
}: {
  onNavigate: (page: Page, params?: Record<string, string>) => void;
}) {
  return <ResultsPageTwo onNavigate={onNavigate} />;
  // return <ResultsPage onNavigate={onNavigate} />;
}

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

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-100">
          Loading...
        </div>
      }
    >
      <ResultsPageWrapper onNavigate={handleNavigate} />
    </Suspense>
  );
}
