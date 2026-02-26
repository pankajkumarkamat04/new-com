"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { productApi, categoryApi } from "@/lib/api";
import type { Product, Category } from "@/lib/types";
import ProductForm from "@/components/admin/ProductForm";

export default function AdminProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    Promise.all([
      productApi.get(id),
      categoryApi.list({ isActive: true }),
    ]).then(([productRes, categoriesRes]) => {
      setLoading(false);
      if (productRes.data?.data) setProduct(productRes.data.data);
      else setProduct(null);
      if (categoriesRes.data?.data) setCategories(categoriesRes.data.data);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!id || product === null) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <p className="mb-4 text-red-600">Product not found.</p>
        <Link href="/admin/products" className="text-amber-600 hover:underline">
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/products"
          className="text-sm font-medium text-amber-600 hover:text-amber-700 hover:underline"
        >
          ← Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
      </div>
      <ProductForm
        product={product}
        categories={categories}
        onSuccess={() => router.push("/admin/products")}
        onCancel={() => router.push("/admin/products")}
      />
    </div>
  );
}
