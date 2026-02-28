"use client";

import type { Product, Category } from "@/lib/types";
import { PageLayout } from "@/components/ui";
import { ShopSidebar } from "./ShopSidebar";
import { ShopSearchBar } from "./ShopSearchBar";
import { ShopProductGrid } from "./ShopProductGrid";

type ShopViewProps = {
  initialProducts: Product[];
  initialCategories: Category[];
  categoryParam: string | null;
  searchQuery: string | null;
};

export function ShopView({
  initialProducts,
  initialCategories,
  categoryParam,
  searchQuery,
}: ShopViewProps) {
  return (
    <PageLayout withLayout={false}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row">
          <ShopSidebar categories={initialCategories} categoryParam={categoryParam} />
          <div className="min-w-0 flex-1">
            <ShopSearchBar categoryParam={categoryParam} searchQuery={searchQuery} />
            <ShopProductGrid products={initialProducts} />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
