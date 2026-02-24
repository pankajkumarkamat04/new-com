import Link from "next/link";
import type { Category, HomeCategorySettings } from "@/lib/api";
import { getMediaUrl } from "@/lib/api";

const CATEGORY_ICON = "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z";

type Props = {
  categories: Category[];
  homeCategorySettings: HomeCategorySettings;
};

export function CategoriesSection({ categories, homeCategorySettings }: Props) {
  const homepageCategories = categories.filter((cat) => cat.showOnHomepage);
  const visibleCategoriesBase = homepageCategories;

  const limit = homeCategorySettings.limit || 8;
  const visibleCategories = visibleCategoriesBase.slice(0, limit);

  const cols = homeCategorySettings.columns || 4;
  const gridColsClass =
    cols === 1
      ? "grid-cols-1 sm:grid-cols-1"
      : cols === 2
        ? "grid-cols-2 sm:grid-cols-2"
        : cols === 3
          ? "grid-cols-2 sm:grid-cols-3"
          : cols === 5
            ? "grid-cols-2 sm:grid-cols-5"
            : cols === 6
              ? "grid-cols-2 sm:grid-cols-6"
              : "grid-cols-2 sm:grid-cols-4";

  const showImages = homeCategorySettings.showImage !== false;

  return (
    <section className="border-b border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-2 text-center text-2xl font-bold text-slate-900">
          {homeCategorySettings.title || "Shop by Category"}
        </h2>
        {homeCategorySettings.description && (
          <p className="mb-8 text-center text-sm text-slate-600">
            {homeCategorySettings.description}
          </p>
        )}
        {visibleCategories.length > 0 ? (
          <div className={`grid gap-4 ${gridColsClass}`}>
            {visibleCategories.map((cat) => (
              <Link
                key={cat._id}
                href={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
              >
                {showImages && cat.image ? (
                  <div className="mb-4 h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <img src={getMediaUrl(cat.image)} alt={cat.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition group-hover:bg-emerald-200">
                    <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={CATEGORY_ICON} />
                    </svg>
                  </div>
                )}
                <span className="font-medium text-slate-900">{cat.name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-500">No categories yet.</div>
        )}
      </div>
    </section>
  );
}

