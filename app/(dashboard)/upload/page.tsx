"use client";

import UploadPage from "@/components/dashboard/pages/UploadPage";
import { useRouter } from "next/navigation";
import { Page } from "@/types";

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: Page) => {
    router.push("/" + page);
  };

  return <UploadPage onNavigate={handleNavigate} />;
}
