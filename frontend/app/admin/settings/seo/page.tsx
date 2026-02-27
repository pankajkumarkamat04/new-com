"use client";

import { useEffect, useState } from "react";
import { settingsApi, getMediaUrl } from "@/lib/api";
import type { SeoSettings } from "@/lib/types";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import { Card, Input, Label, Button, LoadingState, Textarea } from "@/components/ui";

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
        <LoadingState message="Loading SEO settings..." />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Basic Meta Tags</h2>
            <div className="space-y-4">
              <div>
                <Label>Meta Title</Label>
                <Input variant="amber" name="metaTitle" value={form.metaTitle || ""} onChange={handleChange} placeholder="Site title for search results" maxLength={70} />
                <p className="mt-1 text-xs text-slate-500">Recommended: 50–70 characters</p>
              </div>
              <div>
                <Label>Meta Description</Label>
                <Textarea variant="amber" name="metaDescription" value={form.metaDescription || ""} onChange={handleChange} rows={3} placeholder="Brief description for search results" maxLength={160} />
                <p className="mt-1 text-xs text-slate-500">Recommended: 150–160 characters</p>
              </div>
              <div>
                <Label>Meta Keywords</Label>
                <Input variant="amber" name="metaKeywords" value={form.metaKeywords || ""} onChange={handleChange} placeholder="keyword1, keyword2, keyword3" />
              </div>
              <div>
                <Label>Canonical URL</Label>
                <Input variant="amber" type="url" name="canonicalUrl" value={form.canonicalUrl || ""} onChange={handleChange} placeholder="https://example.com" />
              </div>
              <div>
                <Label>Robots</Label>
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
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Open Graph (Facebook, LinkedIn)</h2>
            <div className="space-y-4">
              <div>
                <Label>OG Title</Label>
                <Input variant="amber" name="ogTitle" value={form.ogTitle || ""} onChange={handleChange} placeholder="Defaults to meta title if empty" />
              </div>
              <div>
                <Label>OG Description</Label>
                <Textarea variant="amber" name="ogDescription" value={form.ogDescription || ""} onChange={handleChange} rows={2} placeholder="Defaults to meta description if empty" />
              </div>
              <div>
                <Label>OG Image</Label>
                <div className="flex items-center gap-3">
                  {form.ogImage ? (
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200">
                      <img src={getMediaUrl(form.ogImage)} alt="OG" className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => setMediaModalFor("ogImage")} className="text-sm">
                      {form.ogImage ? "Change" : "Select"} Image
                    </Button>
                    {form.ogImage && (
                      <Button type="button" variant="secondary" onClick={() => setForm((prev) => ({ ...prev, ogImage: "" }))} className="text-sm border-red-200 text-red-600 hover:bg-red-50">
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">Recommended: 1200×630px</p>
              </div>
              <div>
                <Label>OG Type</Label>
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
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">X Card</h2>
            <div className="space-y-4">
              <div>
                <Label>X Card Type</Label>
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
                <Label>X Title</Label>
                <Input variant="amber" name="twitterTitle" value={form.twitterTitle || ""} onChange={handleChange} placeholder="Defaults to meta title if empty" />
              </div>
              <div>
                <Label>X Description</Label>
                <Textarea variant="amber" name="twitterDescription" value={form.twitterDescription || ""} onChange={handleChange} rows={2} placeholder="Defaults to meta description if empty" />
              </div>
              <div>
                <Label>X Image</Label>
                <div className="flex items-center gap-3">
                  {form.twitterImage ? (
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200">
                      <img src={getMediaUrl(form.twitterImage)} alt="X" className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => setMediaModalFor("twitterImage")} className="text-sm">
                      {form.twitterImage ? "Change" : "Select"} Image
                    </Button>
                    {form.twitterImage && (
                      <Button type="button" variant="secondary" onClick={() => setForm((prev) => ({ ...prev, twitterImage: "" }))} className="text-sm border-red-200 text-red-600 hover:bg-red-50">
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Button type="submit" variant="primaryAmber" disabled={submitting}>
            {submitting ? "Saving..." : "Save SEO Settings"}
          </Button>
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
