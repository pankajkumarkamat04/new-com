"use client";

import type { Product } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import { EmptyState } from "@/components/ui";
import { ProductCard } from "@/components/shared";

type ShopProductGridProps = {
  products: Product[];
};

export function ShopProductGrid({ products }: ShopProductGridProps) {
  const { formatCurrency } = useSettings();

  if (products.length === 0) {
    return <EmptyState message="No products found." />;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          formatCurrency={formatCurrency}
          showCta
        />
      ))}
    </div>
  );
}
