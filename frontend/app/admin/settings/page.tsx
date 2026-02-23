"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/settings/general");
  }, [router]);

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <p className="text-slate-500">Redirecting...</p>
    </div>
  );
}
