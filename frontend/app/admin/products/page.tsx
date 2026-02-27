"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { productApi } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import { Button, Badge, LoadingState, EmptyState } from "@/components/ui";

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
        <Button as="link" href="/admin/products/add" variant="primaryAmber">
          Add Product
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Loading products..." />
      ) : products.length === 0 ? (
        <EmptyState message='No products yet. Click "Add Product" to create one.' />
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
                    <Badge variant={product.isActive ? "success" : "neutral"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link
                      href={`/admin/products/edit/${product._id}`}
                      className="mr-2 text-amber-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <Button as="button" type="button" variant="linkRed" onClick={() => handleDelete(product._id)}>
                      Delete
                    </Button>
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
