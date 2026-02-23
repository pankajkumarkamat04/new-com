"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { productApi, categoryApi, type Product, type Category } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function ShopContent() {
  const searchParams = useSearchParams();
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
    <div className="min-h-screen bg-white">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row">
          {categories.length > 0 && (
            <div className="flex flex-shrink-0 flex-wrap gap-2 lg:flex-col lg:gap-2">
              <Link
                href="/shop"
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  !categoryParam
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/shop?category=${encodeURIComponent(cat.name)}`}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    categoryParam === cat.name
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat.image ? (
                    <span className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md border border-slate-200">
                      <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-500">
            No products found.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product._id}
                href={`/product/${product._id}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-48 w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-slate-400">
                    <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs font-medium uppercase text-emerald-600">{product.category || "Product"}</p>
                  <h3 className="mt-1 font-semibold text-slate-900 group-hover:text-emerald-600">{product.name}</h3>
                  {product.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{product.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-lg font-bold text-slate-900">${product.price.toFixed(2)}</p>
                    <span className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white group-hover:bg-emerald-500">
                      View Details
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
          </div>
        </div>
      </div>
      <Footer variant="light" />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
