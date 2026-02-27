"use client";

import { EmptyState, Button } from "@/components/ui";

export default function UserWishlistPage() {
  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-slate-900">Wishlist</h1>
      <p className="mt-2 text-slate-500">Your saved items.</p>
      <EmptyState
        message="Your wishlist is empty"
        action={
          <Button as="link" href="/shop" variant="link" className="text-red-500">
            Browse Shop
          </Button>
        }
        className="mt-8"
      />
    </div>
  );
}
