"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { productApi, categoryApi } from "@/lib/api";
import type { Product, Category } from "@/lib/types";
import ProductForm from "@/components/admin/ProductForm";
import { BackLink, LoadingState, ErrorState } from "@/components/ui";

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
        <LoadingState message="Loading..." />
      </div>
    );
  }

  if (!id || product == null) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState message="Product not found." action={<BackLink href="/admin/products" label="Back to Products" />} />
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <BackLink href="/admin/products" label="Back to Products" />
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Edit Product</h1>
      <ProductForm
        product={product ?? null}
        categories={categories}
        onSuccess={() => router.push("/admin/products")}
        onCancel={() => router.push("/admin/products")}
      />
    </div>
  );
}
