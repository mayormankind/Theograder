"use client";

import ExamsPage from "@/components/dashboard/pages/ExamsPage";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page) => {
    router.push(`/dashboard/${page}`);
  };

  return <ExamsPage onNavigate={handleNavigate} />;
}
