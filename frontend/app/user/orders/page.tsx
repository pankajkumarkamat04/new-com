"use client";

import Link from "next/link";

export default function UserOrdersPage() {
  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
      <p className="mt-2 text-slate-500">View and track your orders.</p>
      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-16">
        <p className="text-slate-500">No orders yet</p>
        <Link href="/shop" className="mt-4 text-red-500 hover:underline">
          Start Shopping
        </Link>
      </div>
    </div>
  );
}
