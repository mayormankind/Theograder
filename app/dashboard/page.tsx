"use client";

import DashboardPage from "@/components/dashboard/pages/DashboardPage";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page) => {
    if (page === "dashboard") {
      router.push("/dashboard");
    } else {
      router.push(`/dashboard/${page}`);
    }
  };

  return <DashboardPage onNavigate={handleNavigate} />;
}
