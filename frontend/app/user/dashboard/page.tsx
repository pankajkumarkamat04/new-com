"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { userApi } from "@/lib/api";
import { Card, Button, EmptyState } from "@/components/ui";

export default function UserDashboardPage() {
  const [user, setUser] = useState<{ name: string; email?: string; phone?: string } | null>(null);

  useEffect(() => {
    userApi.getMe().then((res) => {
      if (res.data?.user) setUser(res.data.user);
    });
  }, []);

  return (
    <div className="px-6 py-8 lg:px-10">
      {/* Title & Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-500">Welcome back, {user?.name || "User"}!</p>
      </div>

      {/* Order Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-900">0</p>
              <p className="text-sm text-slate-500">Total Orders</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">0</p>
              <p className="text-sm text-slate-500">Completed</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-amber-600">0</p>
              <p className="text-sm text-slate-500">Pending</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Two columns: Account Info + Recent Orders */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Account Information */}
        <Card>
          <h2 className="mb-4 text-lg font-bold text-slate-900">Account Information</h2>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900">{user?.name || "User"}</p>
              <p className="text-sm text-slate-500">{user?.email || "—"}</p>
              <p className="mt-2 text-sm text-slate-600">Phone: {user?.phone || "—"}</p>
              <p className="mt-1 text-sm text-slate-600">
                Role: <span className="inline-block rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white">user</span>
              </p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button as="link" href="/user/profile" variant="secondary">
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Profile
              </span>
            </Button>
            <Button as="link" href="/user/profile?tab=password" variant="secondary">
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Change Password
              </span>
            </Button>
          </div>
        </Card>

        {/* Recent Orders */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
            <Button as="link" href="/user/orders" variant="primary" className="bg-red-500 hover:bg-red-600">
              View All
            </Button>
          </div>
          <EmptyState
            message="No orders yet"
            action={
              <Button as="link" href="/shop" variant="primary" className="bg-slate-900 hover:bg-slate-800">
                Start Shopping
              </Button>
            }
          />
        </Card>
      </div>
    </div>
  );
}
