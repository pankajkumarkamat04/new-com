"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { adminApi, settingsApi } from "@/lib/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const settingsIcon = "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/admin/users", label: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { href: "/admin/categories", label: "Categories", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" },
  { href: "/admin/products", label: "Products", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
  { href: "/admin/orders", label: "Orders", icon: "M9 17v-6h6v6m-9 4h12a2 2 0 002-2V9a2 2 0 00-.8-1.6l-6-4.5a2 2 0 00-2.4 0l-6 4.5A2 2 0 003 9v10a2 2 0 002 2z" },
  { href: "/admin/inventory", label: "Inventory", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { href: "/admin/media", label: "Media", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
];

const settingsSubItems = [
  { href: "/admin/settings/general", label: "General" },
  {
    label: "Homepage",
    children: [
      { href: "/admin/settings/home", label: "Homepage" },
      { href: "/admin/settings/home/hero", label: "Hero" },
    ],
  },
];

function SettingsNav({ pathname }: { pathname: string }) {
  const isSettingsActive = pathname.startsWith("/admin/settings");
  const isHomePageActive = pathname.startsWith("/admin/settings/home");
  const isGeneralGroupActive =
    pathname === "/admin/settings/general" ||
    pathname === "/admin/settings/seo" ||
    pathname === "/admin/settings/header" ||
    pathname === "/admin/settings/footer" ||
    pathname === "/admin/settings/payment" ||
    pathname === "/admin/settings/notifications" ||
    pathname === "/admin/settings/login";
  const isOrderGroupActive = pathname.startsWith("/admin/settings/checkout");
  const [expanded, setExpanded] = useState(isSettingsActive);
  const [homeExpanded, setHomeExpanded] = useState(isHomePageActive);
  const [generalExpanded, setGeneralExpanded] = useState(isGeneralGroupActive);
  const [orderExpanded, setOrderExpanded] = useState(isOrderGroupActive);

  useEffect(() => {
    if (pathname.startsWith("/admin/settings")) setExpanded(true);
    if (pathname.startsWith("/admin/settings/home")) setHomeExpanded(true);
    if (
      pathname === "/admin/settings/general" ||
      pathname === "/admin/settings/seo" ||
      pathname === "/admin/settings/header" ||
      pathname === "/admin/settings/footer" ||
      pathname === "/admin/settings/payment" ||
      pathname === "/admin/settings/notifications" ||
      pathname === "/admin/settings/login"
    ) {
      setGeneralExpanded(true);
    }
    if (pathname.startsWith("/admin/settings/checkout")) {
      setOrderExpanded(true);
    }
  }, [pathname]);

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <button
        onClick={() => setExpanded((e) => !e)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isSettingsActive ? "bg-amber-50 text-amber-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
      >
        <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={settingsIcon} />
        </svg>
        Settings
        <svg
          className={`ml-auto h-4 w-4 transition ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
          <div>
            <button
              onClick={() => setGeneralExpanded((e) => !e)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm ${isGeneralGroupActive ? "font-medium text-amber-700" : "text-slate-600 hover:text-slate-900"
                }`}
            >
              General
              <svg
                className={`h-3.5 w-3.5 transition ${generalExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {generalExpanded && (
              <div className="ml-3 space-y-0.5 border-l border-slate-200 pl-2">
                <Link
                  href="/admin/settings/general"
                  className={`block rounded px-2 py-1.5 text-sm ${pathname === "/admin/settings/general"
                      ? "font-medium text-amber-700"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  General
                </Link>
                <Link
                  href="/admin/settings/seo"
                  className={`block rounded px-2 py-1.5 text-sm ${pathname === "/admin/settings/seo"
                      ? "font-medium text-amber-700"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  SEO
                </Link>
                <Link
                  href="/admin/settings/header"
                  className={`block rounded px-2 py-1.5 text-sm ${pathname === "/admin/settings/header"
                      ? "font-medium text-amber-700"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Header
                </Link>
                <Link
                  href="/admin/settings/footer"
                  className={`block rounded px-2 py-1.5 text-sm ${pathname === "/admin/settings/footer"
                      ? "font-medium text-amber-700"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Footer
                </Link>
                <Link
                  href="/admin/settings/payment"
                  className={`block rounded px-2 py-1.5 text-sm ${pathname === "/admin/settings/payment"
                      ? "font-medium text-amber-700"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Payment
                </Link>
                <Link
                  href="/admin/settings/notifications"
                  className={`block rounded px-2 py-1.5 text-sm ${pathname === "/admin/settings/notifications"
                      ? "font-medium text-amber-700"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Notifications
                </Link>
                <Link
                  href="/admin/settings/login"
                  className={`block rounded px-2 py-1.5 text-sm ${pathname === "/admin/settings/login"
                      ? "font-medium text-amber-700"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Login
                </Link>
              </div>
            )}
          </div>
          <div>
            <button
              onClick={() => setHomeExpanded((e) => !e)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm ${isHomePageActive ? "font-medium text-amber-700" : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Homepage
              <svg
                className={`h-3.5 w-3.5 transition ${homeExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {homeExpanded && (
              <div className="ml-3 space-y-0.5 border-l border-slate-200 pl-2">
                <Link
                  href="/admin/settings/home"
                  className={`block rounded px-2 py-1.5 text-sm ${pathname === "/admin/settings/home"
                      ? "font-medium text-amber-700"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Homepage
                </Link>
                <Link
                  href="/admin/settings/home/hero"
                  className={`block rounded px-2 py-1.5 text-sm ${pathname === "/admin/settings/home/hero"
                      ? "font-medium text-amber-700"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Hero
                </Link>
                <Link
                  href="/admin/settings/home/categories"
                  className={`block rounded px-2 py-1.5 text-sm ${pathname === "/admin/settings/home/categories"
                      ? "font-medium text-amber-700"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Categories
                </Link>
              </div>
            )}
          </div>
          <div>
            <button
              onClick={() => setOrderExpanded((e) => !e)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm ${isOrderGroupActive ? "font-medium text-amber-700" : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Orders
              <svg
                className={`h-3.5 w-3.5 transition ${orderExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {orderExpanded && (
              <div className="ml-3 space-y-0.5 border-l border-slate-200 pl-2">
                <Link
                  href="/admin/settings/checkout"
                  className={`block rounded px-2 py-1.5 text-sm ${pathname === "/admin/settings/checkout"
                      ? "font-medium text-amber-700"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Checkout
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [admin, setAdmin] = useState<{ name: string; email: string; phone?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [couponEnabled, setCouponEnabled] = useState(false);
  const [blogEnabled, setBlogEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/signup";

  useEffect(() => {
    if (!mounted) return;
    if (isAuthPage) {
      setLoading(false);
      return;
    }
    adminApi.getMe().then((res) => {
      setLoading(false);
      if (res.data?.admin) setAdmin(res.data.admin);
      else if (res.error) router.replace("/admin/login");
    });
    settingsApi.get().then((res) => {
      if (res.data?.data) {
        const data = res.data.data as any;
        setCouponEnabled(!!data.couponEnabled);
        setBlogEnabled(!!data.blogEnabled);
      }
    });
  }, [mounted, router, isAuthPage]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    router.replace("/admin/login");
  };

  if (!mounted) return null;

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute role="admin">
      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-slate-600">Loading...</div>
        </div>
      ) : (
        <div className="flex min-h-screen bg-slate-50">
          {/* Sidebar */}
          <aside className="fixed left-0 top-0 z-20 flex h-full w-64 flex-col border-r border-slate-200 bg-white shadow-sm">
            <div className="flex h-16 items-center border-b border-slate-200 px-6">
              <Link href="/admin/dashboard" className="text-xl font-bold text-amber-600">
                Admin Portal
              </Link>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${pathname === item.href
                        ? "bg-amber-50 text-amber-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                  >
                    <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.label}
                  </Link>
                );
              })}

              {couponEnabled && (
                <Link
                  href="/admin/coupons"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    pathname === "/admin/coupons"
                      ? "bg-amber-50 text-amber-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4zM21 12l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Coupons
                </Link>
              )}

              {blogEnabled && (
                <Link
                  href="/admin/blogs"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    pathname === "/admin/blogs"
                      ? "bg-amber-50 text-amber-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h6" />
                  </svg>
                  Blogs
                </Link>
              )}

              {/* Profile - above Settings */}


              {/* Settings - expandable, at the end */}
              <SettingsNav pathname={pathname} />
              <Link
                href="/admin/profile"
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${pathname === "/admin/profile"
                    ? "bg-amber-50 text-amber-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
              >
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </Link>
            </nav>
            <div className="border-t border-slate-200 p-4">
              <p className="truncate text-sm font-medium text-slate-900">{admin?.name || "Admin"}</p>
              <p className="truncate text-xs text-slate-500">{admin?.email || ""}</p>
              <Link
                href="/"
                className="mt-2 block text-xs text-slate-500 hover:text-slate-700"
              >
                ← Back to Home
              </Link>
              <button
                onClick={handleLogout}
                className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 pl-64">
            {children}
          </main>
        </div>
      )}
    </ProtectedRoute>
  );
}
