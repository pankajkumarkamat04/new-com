"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { productApi, categoryApi, type Product, type Category } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import { useSettings } from "@/contexts/SettingsContext";

const CATEGORY_ICON = "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { homeCategorySettings, formatCurrency } = useSettings();

  useEffect(() => {
    Promise.all([
      productApi.list({ isActive: true, limit: 8 }),
      categoryApi.list({ isActive: true }),
    ]).then(([productRes, categoryRes]) => {
      setLoading(false);
      if (productRes.data?.data) setProducts(productRes.data.data);
      if (categoryRes.data?.data) setCategories(categoryRes.data.data);
    });
  }, []);

  const homepageCategories = categories.filter((cat) => cat.showOnHomepage);
  const visibleCategoriesBase = homepageCategories;

  const limit = homeCategorySettings.limit || 8;
  const visibleCategories = visibleCategoriesBase.slice(0, limit);

  const cols = homeCategorySettings.columns || 4;
  const gridColsClass =
    cols === 1
      ? "grid-cols-1 sm:grid-cols-1"
      : cols === 2
      ? "grid-cols-2 sm:grid-cols-2"
      : cols === 3
      ? "grid-cols-2 sm:grid-cols-3"
      : cols === 5
      ? "grid-cols-2 sm:grid-cols-5"
      : cols === 6
      ? "grid-cols-2 sm:grid-cols-6"
      : "grid-cols-2 sm:grid-cols-4";

  const showImages = homeCategorySettings.showImage !== false;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <Hero />

      {/* Categories */}
      <section className="border-b border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-2 text-center text-2xl font-bold text-slate-900">
            {homeCategorySettings.title || "Shop by Category"}
          </h2>
          {homeCategorySettings.description && (
            <p className="mb-8 text-center text-sm text-slate-600">
              {homeCategorySettings.description}
            </p>
          )}
          {visibleCategories.length > 0 ? (
            <div className={`grid gap-4 ${gridColsClass}`}>
              {visibleCategories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/shop?category=${encodeURIComponent(cat.name)}`}
                  className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                >
                  {showImages && cat.image ? (
                    <div className="mb-4 h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition group-hover:bg-emerald-200">
                      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={CATEGORY_ICON} />
                      </svg>
                    </div>
                  )}
                  <span className="font-medium text-slate-900">{cat.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-500">No categories yet.</div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Featured Products</h2>
            <Link href="/shop" className="text-sm font-medium text-emerald-600 hover:text-emerald-500">
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-500">
              No products yet. Check back soon!
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                    <h3 className="mt-1 font-semibold text-slate-900 group-hover:text-emerald-600">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-lg font-bold text-slate-900">{formatCurrency(product.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-600 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to start shopping?</h2>
          <p className="mx-auto mt-4 max-w-xl text-emerald-100">
            Join thousands of happy customers. Create your free account today.
          </p>
          <Link
            href="/user/signup"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-4 font-semibold text-emerald-600 transition hover:bg-emerald-50"
          >
            Get Started
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
