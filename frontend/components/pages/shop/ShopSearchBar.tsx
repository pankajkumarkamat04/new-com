"use client";

import { useRouter } from "next/navigation";

type ShopSearchBarProps = {
  categoryParam: string | null;
  searchQuery: string | null;
};

export function ShopSearchBar({ categoryParam, searchQuery }: ShopSearchBarProps) {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector<HTMLInputElement>('input[name="search"]');
    const q = input?.value?.trim() || "";
    const params = new URLSearchParams();
    if (categoryParam) params.set("category", categoryParam);
    if (q) params.set("search", q);
    router.push(`/shop${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-bold text-slate-900">
        {categoryParam ? `${categoryParam} Products` : "All Products"}
      </h1>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          name="search"
          defaultValue={searchQuery ?? ""}
          placeholder="Search products..."
          className="w-64 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Search
        </button>
      </form>
    </div>
  );
}
