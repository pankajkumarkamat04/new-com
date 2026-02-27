"use client";

import { useEffect, useState } from "react";
import { productApi } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import { Input, Button, LoadingState, EmptyState } from "@/components/ui";
import { ProductCard } from "@/components/shared";

export default function UserProductsPage() {
  const { formatCurrency } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchProducts();
  }, [mounted]);

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
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="flex-1"
        />
        <Button type="submit" variant="primary">
          Search
        </Button>
      </form>

      {loading ? (
        <LoadingState message="Loading products..." />
      ) : products.length === 0 ? (
        <EmptyState message="No products found." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              formatCurrency={formatCurrency}
              showCta={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
