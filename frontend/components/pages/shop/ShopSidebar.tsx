"use client";

import Link from "next/link";
import { getMediaUrl } from "@/lib/api";
import type { Category } from "@/lib/types";

type ShopSidebarProps = {
  categories: Category[];
  categoryParam: string | null;
};

export function ShopSidebar({ categories, categoryParam }: ShopSidebarProps) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-shrink-0 flex-wrap gap-2 lg:flex-col lg:gap-2">
      <Link
        href="/shop"
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
          !categoryParam ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat._id}
          href={`/shop?category=${encodeURIComponent(cat.name)}`}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            categoryParam === cat.name ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {cat.image ? (
            <span className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md border border-slate-200">
              <img src={getMediaUrl(cat.image)} alt={cat.name} className="h-full w-full object-cover" />
            </span>
          ) : null}
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
