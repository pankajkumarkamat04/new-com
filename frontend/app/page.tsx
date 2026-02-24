"use server";

import { productApi, categoryApi, settingsApi } from "@/lib/api";
import type { Product, Category, HomeCategorySettings, PublicSettings } from "@/lib/types";
import Hero from "@/components/home/Hero";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { FeaturedProductsSection } from "@/components/home/FeaturedProductsSection";
import { HomeCtaSection } from "@/components/home/HomeCtaSection";
import { HeaderSSR } from "@/components/HeaderSSR";
import { FooterSSR } from "@/components/FooterSSR";

function buildHomeCategorySettings(raw?: HomeCategorySettings | null): HomeCategorySettings {
  return {
    title: raw?.title || "Shop by Category",
    description: raw?.description || "",
    columns: raw?.columns || 4,
    limit: raw?.limit || 8,
    showImage: raw?.showImage !== false,
  };
}

export default async function Home() {
  const [productRes, categoryRes, publicRes] = await Promise.all([
    productApi.list({ isActive: true, limit: 8 }),
    categoryApi.list({ isActive: true }),
    settingsApi.getPublic(),
  ]);

  const products: Product[] = productRes.data?.data ?? [];
  const categories: Category[] = categoryRes.data?.data ?? [];
  const publicData = (publicRes.data?.data || null) as PublicSettings | null;
  const rawHomeSettings = (publicData?.homepage?.homeCategorySettings ?? null) as HomeCategorySettings | null;
  const homeCategorySettings = buildHomeCategorySettings(rawHomeSettings);

  return (
    <div className="min-h-screen bg-white">
      <HeaderSSR />

      <Hero />

      <CategoriesSection categories={categories} homeCategorySettings={homeCategorySettings} />

      <FeaturedProductsSection products={products} />

      <HomeCtaSection />

      <FooterSSR />
    </div>
  );
}
