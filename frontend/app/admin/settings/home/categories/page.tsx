"use client";

import { useEffect, useState } from "react";
import { settingsApi } from "@/lib/api";
import type { HomeCategorySettings } from "@/lib/types";
import { BackLink, Card, Button, Input, Label, LoadingState } from "@/components/ui";

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
      <BackLink href="/admin/settings/home" label="Back to Home Settings" />
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Homepage Categories</h1>

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
        <LoadingState message="Loading..." />
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

          <Button type="submit" variant="primaryAmber" disabled={saving}>
            {saving ? "Saving..." : "Save section"}
          </Button>
        </form>
      )}
    </div>
  );
}

