"use client";

import UploadPage from "@/components/dashboard/pages/UploadPage";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page) => {
    router.push(`/dashboard/${page}`);
  };

  return <UploadPage onNavigate={handleNavigate} />;
}
