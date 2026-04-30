"use client";

import SettingsPage from "@/components/dashboard/pages/SettingsPage";
import { useRouter } from "next/navigation";
import { Page } from "@/types";

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page) => {
    router.push("/" + page);
  };

  return <SettingsPage onNavigate={handleNavigate} />;
}
