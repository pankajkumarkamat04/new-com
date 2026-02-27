"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { productApi, categoryApi, getMediaUrl } from "@/lib/api";
import type { Product, Category } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import { PageLayout, LoadingState, EmptyState } from "@/components/ui";
import { ProductCard } from "@/components/shared";

function ShopContent() {
  const searchParams = useSearchParams();
  const { formatCurrency } = useSettings();
  const categoryParam = searchParams.get("category");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    categoryApi.list({ isActive: true }).then((res) => {
      if (res.data?.data) setCategories(res.data.data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    productApi
      .list({
        isActive: true,
        category: categoryParam || undefined,
        search: searchQuery || undefined,
        limit: 24,
      })
      .then((res) => {
        setLoading(false);
        if (res.data?.data) setProducts(res.data.data);
      });
  }, [categoryParam, searchQuery]);

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row">
          {categories.length > 0 && (
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
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-bold text-slate-900">
                {categoryParam ? `${categoryParam} Products` : "All Products"}
              </h1>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearchQuery(search);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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

            {loading ? (
              <LoadingState variant="skeleton-grid" skeletonCount={8} />
            ) : products.length === 0 ? (
              <EmptyState message="No products found." />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    formatCurrency={formatCurrency}
                    showCta
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
