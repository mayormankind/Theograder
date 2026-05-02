"use client";

import GradingPage from "@/components/dashboard/pages/GradingPage";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page) => {
    router.push("/" + page);
  };

  return <GradingPage onNavigate={handleNavigate} />;
}
