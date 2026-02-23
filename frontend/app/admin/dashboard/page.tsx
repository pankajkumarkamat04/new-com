"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";

export default function AdminDashboardPage() {
  const [admin, setAdmin] = useState<{ name: string; email: string; phone?: string } | null>(null);

  useEffect(() => {
    adminApi.getMe().then((res) => {
      if (res.data?.admin) setAdmin(res.data.admin);
    });
  }, []);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {admin?.name || "Admin"}!
          </h1>
          <p className="mt-1 text-slate-600">
            Manage your platform from here.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Users</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
            <p className="mt-1 text-xs text-slate-500">Coming soon</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Active Today</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
            <p className="mt-1 text-xs text-slate-500">Coming soon</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Admin Email</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 truncate">
              {admin?.email || "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Role</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">Admin</p>
          </div>
        </div>

        {/* Management Sections */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Management</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/products"
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-amber-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">Product Management</p>
                <p className="text-sm text-slate-500">Add, edit, and delete products</p>
              </div>
            </Link>
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm opacity-75">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">Analytics</p>
                <p className="text-sm text-slate-500">Coming soon</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm opacity-75">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">Settings</p>
                <p className="text-sm text-slate-500">Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick Links</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="text-amber-600 hover:underline">
              Home
            </Link>
            <Link href="/admin/dashboard" className="text-amber-600 hover:underline">
              Dashboard
            </Link>
            <Link href="/admin/products" className="text-amber-600 hover:underline">
              Products
            </Link>
          </div>
        </div>
      </div>
  );
}
