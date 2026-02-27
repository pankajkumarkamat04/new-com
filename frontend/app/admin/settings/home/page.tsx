"use client";

import SettingsLinkCard from "@/components/admin/SettingsLinkCard";
import { Card } from "@/components/ui";

const HeroIcon = (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CategoriesIcon = (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h4l2 10h10M16 7l-2 10M5 11h14" />
  </svg>
);

export default function AdminHomePageSettingsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Home Page Settings</h1>
      <p className="mb-6 text-slate-600">Configure homepage sections and content.</p>

      <Card className="space-y-4">
        <SettingsLinkCard
          href="/admin/settings/home/hero"
          title="Hero Section"
          description="Manage hero layout, slides, and content."
          icon={HeroIcon}
          iconBgClassName="bg-amber-100 text-amber-600"
        />
        <SettingsLinkCard
          href="/admin/settings/home/categories"
          title="Homepage Categories"
          description="Choose which categories show on the homepage."
          icon={CategoriesIcon}
          iconBgClassName="bg-emerald-100 text-emerald-600"
        />
      </Card>
    </div>
  );
}
