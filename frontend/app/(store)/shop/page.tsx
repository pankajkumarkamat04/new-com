import { productApi, categoryApi } from "@/lib/api";
import type { Product, Category } from "@/lib/types";
import { ShopView } from "@/components/pages/shop";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ category?: string; search?: string }>;
};

export default async function ShopPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const categoryParam = typeof searchParams.category === "string" ? searchParams.category : null;
  const searchQuery = typeof searchParams.search === "string" ? searchParams.search : null;

  const [productRes, categoryRes] = await Promise.all([
    productApi.list({
      isActive: true,
      category: categoryParam || undefined,
      search: searchQuery || undefined,
      limit: 24,
    }),
    categoryApi.list({ isActive: true }),
  ]);

  const products: Product[] = productRes.data?.data ?? [];
  const categories: Category[] = categoryRes.data?.data ?? [];

  return (
    <ShopView
      initialProducts={products}
      initialCategories={categories}
      categoryParam={categoryParam}
      searchQuery={searchQuery}
    />
  );
}
