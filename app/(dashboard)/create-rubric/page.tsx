"use client";

import CreateRubricPage from "@/components/dashboard/pages/CreateRubricPage";
import { Page } from "@/types";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page) => {
    router.push("/" + page);
  };

  return <CreateRubricPage onNavigate={handleNavigate} />;
}
