"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { categoryApi } from "@/lib/api";
import type { Category } from "@/lib/types";
import ProductForm from "@/components/admin/ProductForm";
import { BackLink, LoadingState } from "@/components/ui";

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
        <LoadingState message="Loading..." />
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <BackLink href="/admin/products" label="Back to Products" />
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Add Product</h1>
      <ProductForm
        product={null}
        categories={categories}
        onSuccess={() => router.push("/admin/products")}
        onCancel={() => router.push("/admin/products")}
      />
    </div>
  );
}
