"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { settingsApi } from "@/lib/api";
import type { HomeCategorySettings } from "@/lib/types";

export default function AdminHomeCategoriesSettingsPage() {
  const [title, setTitle] = useState<string>("Shop by Category");
  const [description, setDescription] = useState<string>("");
  const [columns, setColumns] = useState<number>(4);
  const [limit, setLimit] = useState<number>(8);
  const [showImage, setShowImage] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const homeRes = await settingsApi.getHomeCategories();
      if (homeRes.data?.data) {
        const cfg = homeRes.data.data as HomeCategorySettings;
        setTitle(cfg.title || "Shop by Category");
        setDescription(cfg.description || "");
        setColumns(cfg.columns || 4);
        setLimit(cfg.limit || 8);
        setShowImage(cfg.showImage !== false);
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await settingsApi.updateHomeCategories({
      title,
      description,
      columns,
      limit,
      showImage,
    });
    setSaving(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ type: "success", text: "Homepage category section saved" });
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/settings/home" className="text-slate-500 hover:text-slate-700">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Homepage Categories</h1>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-600">Loading...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <p className="text-sm text-slate-600">
            Control how the "Shop by Category" section looks. To choose which categories appear, edit each category and
            use the "Show on homepage" option.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Section title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Shop by Category"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Section description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Optional short description"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Categories per row</label>
              <select
                value={columns}
                onChange={(e) => setColumns(Number(e.target.value) || 4)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Total categories to show</label>
              <input
                type="number"
                min={1}
                max={24}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value) || 8)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="showImage"
                type="checkbox"
                checked={showImage}
                onChange={(e) => setShowImage(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="showImage" className="text-sm text-slate-700">
                Show category image (fallback to icon when missing)
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-amber-600 px-6 py-2.5 font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save section"}
          </button>
        </form>
      )}
    </div>
  );
}

