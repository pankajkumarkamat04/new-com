"use client";

import Link from "next/link";

export default function UserCartPage() {
  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-slate-900">Cart</h1>
      <p className="mt-2 text-slate-500">Your shopping cart.</p>
      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-16">
        <p className="text-slate-500">Your cart is empty</p>
        <Link href="/shop" className="mt-4 text-red-500 hover:underline">
          Start Shopping
        </Link>
      </div>
    </div>
  );
}
