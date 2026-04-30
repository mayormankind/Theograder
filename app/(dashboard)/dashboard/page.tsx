"use client";

import DashboardPage from "@/components/dashboard/pages/DashboardPage";
import { useRouter } from "next/navigation";
import { Page } from "@/types";

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page) => {
    router.push(`/${page}`);
  };

  return <DashboardPage onNavigate={handleNavigate} />;
}
