"use client";

import RubricsPage from "@/components/dashboard/pages/RubricsPage";
import { useRouter } from "next/navigation";
import { Page } from "@/types";

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page) => {
    router.push("/" + page);
  };

  return <RubricsPage onNavigate={handleNavigate} />;
}
