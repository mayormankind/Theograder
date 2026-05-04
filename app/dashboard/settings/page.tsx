"use client";

import SettingsPage from "@/components/dashboard/pages/SettingsPage";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page) => {
    router.push(`/dashboard/${page}`);
  };

  return <SettingsPage onNavigate={handleNavigate} />;
}
