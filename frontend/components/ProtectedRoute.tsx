"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProtectedRouteProps = {
  role: "admin" | "user";
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

const defaultFallback = (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <div className="text-slate-600">Loading...</div>
  </div>
);

export function ProtectedRoute({ role, children, fallback = defaultFallback }: ProtectedRouteProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");

    if (!token || userType !== role) {
      router.replace(role === "admin" ? "/admin/login" : "/user/login");
      setAllowed(false);
    } else {
      setAllowed(true);
    }
  }, [role, router]);

  if (allowed === null) return <>{fallback}</>;
  if (allowed === false) return null;
  return <>{children}</>;
}
