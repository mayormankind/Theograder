"use client";

import { Suspense } from "react";
import ResultsPage from "@/components/dashboard/pages/ResultsPage";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";

function ResultsPageWrapper({ onNavigate }: { onNavigate: (page: Page, params?: Record<string, string>) => void }) {
  return <ResultsPage onNavigate={onNavigate} />;
}

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page) => {
    router.push(`/dashboard/${page}`);
  };

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <ResultsPageWrapper onNavigate={handleNavigate} />
    </Suspense>
  );
}
