"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categoryApi } from "@/lib/api";
import type { Category } from "@/lib/types";
import ProductForm from "@/components/admin/ProductForm";

export default function AdminProductAddPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi.list({ isActive: true }).then((res) => {
      setLoading(false);
      if (res.data?.data) setCategories(res.data.data);
    });
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-slate-600">Loading...</p>
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
        <h1 className="text-2xl font-bold text-slate-900">Add Product</h1>
      </div>
      <ProductForm
        product={null}
        categories={categories}
        onSuccess={() => router.push("/admin/products")}
        onCancel={() => router.push("/admin/products")}
      />
    </div>
  );
}
