"use client";

import React, { Suspense } from "react";
import CreateRubricPage from "@/components/dashboard/pages/CreateRubricPage";
import type { Page } from "@/types";
import { useRouter } from "next/navigation";

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
    <Suspense fallback={
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0f1f3d] border-t-transparent" />
      </div>
    }>
      <CreateRubricPage onNavigate={handleNavigate} />
    </Suspense>
  );
}
