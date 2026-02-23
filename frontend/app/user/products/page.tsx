"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productApi, type Product } from "@/lib/api";

export default function UserProductsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");
    if (!token || userType !== "user") {
      router.replace("/user/login");
      return;
    }
    fetchProducts();
  }, [mounted, router]);

  const fetchProducts = (params?: { search?: string; page?: number }) => {
    setLoading(true);
    productApi
      .list({ isActive: true, search: params?.search || search, page: params?.page, limit: 12 })
      .then((res) => {
        setLoading(false);
        if (res.data?.data) setProducts(res.data.data);
      });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts({ search });
  };

  if (!mounted) return null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Products</h1>

        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-500"
          >
            Search
          </button>
        </form>

        {loading ? (
          <div className="py-12 text-center text-slate-600">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            No products found.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <div
                key={product._id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="mb-4 h-40 w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="mb-4 flex h-40 w-full items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                    No image
                  </div>
                )}
                <h3 className="font-semibold text-slate-900">{product.name}</h3>
                {product.category && (
                  <p className="mt-1 text-sm text-slate-500">{product.category}</p>
                )}
                <p className="mt-2 text-lg font-bold text-emerald-600">
                  ${product.price.toFixed(2)}
                </p>
                {product.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {product.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500">Stock: {product.stock}</p>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
