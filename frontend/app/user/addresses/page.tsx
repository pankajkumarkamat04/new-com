"use client";

import { EmptyState } from "@/components/ui";

export default function UserAddressesPage() {
  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-slate-900">Addresses</h1>
      <p className="mt-2 text-slate-500">Manage your delivery addresses.</p>
      <EmptyState message="No addresses saved yet" className="mt-8" />
    </div>
  );
}
