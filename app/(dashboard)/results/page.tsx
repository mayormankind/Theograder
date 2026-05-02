"use client";

import ResultsPage from "@/components/dashboard/pages/ResultsPage";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page) => {
    router.push("/" + page);
  };

  return <ResultsPage onNavigate={handleNavigate} />;
}
