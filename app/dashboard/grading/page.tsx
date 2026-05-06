"use client";

import { Suspense } from "react";
import GradingPage from "@/components/dashboard/pages/GradingPage";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";

function GradingPageWrapper({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return <GradingPage onNavigate={onNavigate} />;
}

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page) => {
    router.push(`/dashboard/${page}`);
  };

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <GradingPageWrapper onNavigate={handleNavigate} />
    </Suspense>
  );
}
