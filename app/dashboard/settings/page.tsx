"use client";

import { Suspense } from "react";
import SettingsPage from "@/components/dashboard/pages/SettingsPage";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";
import { Loader2 } from "lucide-react";

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page) => {
    router.push(`/dashboard/${page}`);
  };

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    }>
      <SettingsPage onNavigate={handleNavigate} />
    </Suspense>
  );
}
