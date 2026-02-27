"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { productApi } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";

export default function AdminProductsPage() {
  const { formatCurrency } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchProducts();
  }, [mounted]);

  const fetchProducts = () => {
    setLoading(true);
    productApi.list({ limit: 50 }).then((res) => {
      setLoading(false);
      if (res.data?.data) setProducts(res.data.data);
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const res = await productApi.delete(id);
    if (!res.error) fetchProducts();
  };

  if (!mounted) return null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <Link
          href="/admin/products/add"
          className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-500"
        >
          Add Product
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-600">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          No products yet. Click &quot;Add Product&quot; to create one.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {products.map((product) => (
                <tr key={product._id}>
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                    {product.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-500">
                    {product.sku || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                    {product.category || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">{product.stock}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        product.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link
                      href={`/admin/products/edit/${product._id}`}
                      className="mr-2 text-amber-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
