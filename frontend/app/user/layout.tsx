"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { userApi } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const navItems = [
  { href: "/user/dashboard", label: "Dashboard", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/user/profile", label: "My Account", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { href: "/user/orders", label: "My Orders", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
  { href: "/user/addresses", label: "Addresses", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" },
];

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name: string; email?: string; phone?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthPage = pathname === "/user/login" || pathname === "/user/signup";

  useEffect(() => {
    if (!mounted) return;
    if (isAuthPage) {
      setLoading(false);
      return;
    }
    userApi.getMe().then((res) => {
      setLoading(false);
      if (res.data?.user) setUser(res.data.user);
      else if (res.error) router.replace("/user/login");
    });
  }, [mounted, router, isAuthPage]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    router.replace("/");
  };

  if (!mounted) return null;

  const initial = (user?.name || "U").charAt(0).toUpperCase();

  const header = <Header isLoggedIn={!isAuthPage} userType={isAuthPage ? null : "user"} />;
  const footer = <Footer variant="dark" />;

  if (isAuthPage) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        {header}
        <main className="flex-1 bg-white">{children}</main>
        {footer}
      </div>
    );
  }

  return (
    <ProtectedRoute role="user">
      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-slate-600">Loading...</div>
        </div>
      ) : (
    <div className="flex min-h-screen flex-col bg-white">
      {header}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-row items-start gap-0 py-4 sm:py-6">
        {/* Sidebar - Compact, height matches its content only */}
        <aside className="w-48 flex-shrink-0 self-center border-r border-slate-200 bg-slate-50 lg:w-52">
          <div className="flex flex-col p-4">
            {/* User Profile - Compact */}
            <div className="mb-6 flex flex-col items-center">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-white text-base font-bold text-red-500 shadow-sm">
                  {initial}
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
              </div>
              <p className="mt-2 truncate max-w-full px-1 text-center text-sm font-bold text-slate-900">{user?.name || "User"}</p>
              <p className="mt-0.5 truncate max-w-full px-1 text-center text-xs text-slate-500">{user?.email || ""}</p>
            </div>

            {/* Nav Links - Compact */}
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "border-l-4 border-green-500 bg-green-50 text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && (
                      <svg className="h-4 w-4 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </Link>
                );
              })}
              <div className="my-3 border-t border-slate-200 pt-3">
                <Link
                  href="/user/products"
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="truncate">Products</span>
                  </div>
                  <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="truncate">Logout</span>
                </div>
                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main content - Takes majority of space */}
        <main className="min-w-0 flex-1 bg-white">
          {children}
        </main>
      </div>
      {footer}
    </div>
      )}
    </ProtectedRoute>
  );
}
