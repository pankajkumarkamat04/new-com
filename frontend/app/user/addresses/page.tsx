"use client";

export default function UserAddressesPage() {
  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-slate-900">Addresses</h1>
      <p className="mt-2 text-slate-500">Manage your delivery addresses.</p>
      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-16">
        <p className="text-slate-500">No addresses saved yet</p>
      </div>
    </div>
  );
}
