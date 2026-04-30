"use client";

import ProcessingPage from "@/components/dashboard/pages/ProcessingPage";
import { useRouter } from "next/navigation";
import { Page } from "@/types";

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page) => {
    router.push("/" + page);
  };

  return <ProcessingPage onNavigate={handleNavigate} />;
}
