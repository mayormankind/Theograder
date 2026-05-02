"use client";

import ScriptsPage from "@/components/dashboard/pages/ScriptsPage";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page) => {
    router.push("/" + page);
  };

  return <ScriptsPage onNavigate={handleNavigate} />;
}
