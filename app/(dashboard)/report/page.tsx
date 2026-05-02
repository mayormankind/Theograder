"use client";

import ReportPage from "@/components/dashboard/pages/ReportPage";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page) => {
    router.push("/" + page);
  };

  return <ReportPage onNavigate={handleNavigate} />;
}
