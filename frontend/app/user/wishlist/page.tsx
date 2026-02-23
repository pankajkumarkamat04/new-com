"use client";

import Link from "next/link";

export default function UserWishlistPage() {
  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-slate-900">Wishlist</h1>
      <p className="mt-2 text-slate-500">Your saved items.</p>
      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-16">
        <p className="text-slate-500">Your wishlist is empty</p>
        <Link href="/shop" className="mt-4 text-red-500 hover:underline">
          Browse Shop
        </Link>
      </div>
    </div>
  );
}
