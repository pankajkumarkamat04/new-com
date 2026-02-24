"use client";

import { useEffect, useState } from "react";
import { settingsApi, getMediaUrl } from "@/lib/api";
import type { SeoSettings } from "@/lib/types";
import MediaPickerModal from "@/components/admin/MediaPickerModal";

const defaultForm: SeoSettings = {
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "",
  twitterDescription: "",
  twitterImage: "",
  canonicalUrl: "",
  robots: "index, follow",
};

export default function AdminSeoSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<SeoSettings>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [mediaModalFor, setMediaModalFor] = useState<"ogImage" | "twitterImage" | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    settingsApi.getSeo().then((res) => {
      setLoading(false);
      if (res.data?.data) {
        setForm({ ...defaultForm, ...res.data.data });
      }
    });
  }, [mounted]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const res = await settingsApi.updateSeo(form);
    setSubmitting(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setMessage({ type: "success", text: "SEO settings saved successfully" });
  };

  if (!mounted) return null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">SEO Settings</h1>
      <p className="mb-8 text-sm text-slate-600">
        Configure meta tags and Open Graph data for search engines and social sharing.
      </p>

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
        <div className="py-12 text-center text-slate-600">Loading SEO settings...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Basic Meta Tags</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Meta Title</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={form.metaTitle || ""}
                  onChange={handleChange}
                  placeholder="Site title for search results"
                  maxLength={70}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <p className="mt-1 text-xs text-slate-500">Recommended: 50–70 characters</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Meta Description</label>
                <textarea
                  name="metaDescription"
                  value={form.metaDescription || ""}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief description for search results"
                  maxLength={160}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <p className="mt-1 text-xs text-slate-500">Recommended: 150–160 characters</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Meta Keywords</label>
                <input
                  type="text"
                  name="metaKeywords"
                  value={form.metaKeywords || ""}
                  onChange={handleChange}
                  placeholder="keyword1, keyword2, keyword3"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Canonical URL</label>
                <input
                  type="url"
                  name="canonicalUrl"
                  value={form.canonicalUrl || ""}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Robots</label>
                <select
                  name="robots"
                  value={form.robots || "index, follow"}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="index, follow">Index, Follow</option>
                  <option value="index, nofollow">Index, No Follow</option>
                  <option value="noindex, follow">No Index, Follow</option>
                  <option value="noindex, nofollow">No Index, No Follow</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Open Graph (Facebook, LinkedIn)</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">OG Title</label>
                <input
                  type="text"
                  name="ogTitle"
                  value={form.ogTitle || ""}
                  onChange={handleChange}
                  placeholder="Defaults to meta title if empty"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">OG Description</label>
                <textarea
                  name="ogDescription"
                  value={form.ogDescription || ""}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Defaults to meta description if empty"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">OG Image</label>
                <div className="flex items-center gap-3">
                  {form.ogImage ? (
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200">
                      <img src={getMediaUrl(form.ogImage)} alt="OG" className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMediaModalFor("ogImage")}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {form.ogImage ? "Change" : "Select"} Image
                    </button>
                    {form.ogImage && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, ogImage: "" }))}
                        className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">Recommended: 1200×630px</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">OG Type</label>
                <select
                  name="ogType"
                  value={form.ogType || "website"}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="website">Website</option>
                  <option value="article">Article</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">X Card</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">X Card Type</label>
                <select
                  name="twitterCard"
                  value={form.twitterCard || "summary_large_image"}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="summary_large_image">Summary Large Image</option>
                  <option value="summary">Summary</option>
                  <option value="app">App</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">X Title</label>
                <input
                  type="text"
                  name="twitterTitle"
                  value={form.twitterTitle || ""}
                  onChange={handleChange}
                  placeholder="Defaults to meta title if empty"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">X Description</label>
                <textarea
                  name="twitterDescription"
                  value={form.twitterDescription || ""}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Defaults to meta description if empty"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">X Image</label>
                <div className="flex items-center gap-3">
                  {form.twitterImage ? (
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200">
                      <img src={getMediaUrl(form.twitterImage)} alt="X" className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMediaModalFor("twitterImage")}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {form.twitterImage ? "Change" : "Select"} Image
                    </button>
                    {form.twitterImage && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, twitterImage: "" }))}
                        className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-amber-600 px-6 py-2.5 font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save SEO Settings"}
          </button>
        </form>
      )}

      <MediaPickerModal
        open={mediaModalFor !== null}
        onClose={() => setMediaModalFor(null)}
        onSelect={(url) => {
          if (mediaModalFor) {
            setForm((prev) => ({ ...prev, [mediaModalFor]: url }));
            setMediaModalFor(null);
          }
        }}
        title={mediaModalFor === "ogImage" ? "Select OG Image" : "Select X Image"}
        type="image"
      />
    </div>
  );
}
