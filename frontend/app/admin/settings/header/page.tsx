"use client";

import { useEffect, useState } from "react";
import { settingsApi, getMediaUrl } from "@/lib/api";
import type { HeaderSettings, HeaderNavLink } from "@/lib/types";
import MediaPickerModal from "@/components/admin/MediaPickerModal";

const defaultNavLink: HeaderNavLink = { label: "", href: "" };

export default function AdminHeaderSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<HeaderSettings>({
    logoSource: "general",
    logoImageUrl: "",
    navLinks: [
      { label: "Shop", href: "/shop" },
      { label: "Electronics", href: "/shop?category=Electronics" },
      { label: "Fashion", href: "/shop?category=Fashion" },
    ],
    showBrowseButton: true,
    showCartIcon: true,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const logoSource = form.logoSource || "general";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    settingsApi.getHeader().then((res) => {
      setLoading(false);
      if (res.data?.data) {
        const d = res.data.data;
        const defaultLinks = [
          { label: "Shop", href: "/shop" },
          { label: "Electronics", href: "/shop?category=Electronics" },
          { label: "Fashion", href: "/shop?category=Fashion" },
        ];
        setForm({
          logoSource: d.logoSource === "custom" ? "custom" : "general",
          logoImageUrl: d.logoImageUrl || "",
          navLinks: Array.isArray(d.navLinks) && d.navLinks.length > 0 ? d.navLinks : defaultLinks,
          showBrowseButton: d.showBrowseButton !== false,
          showCartIcon: d.showCartIcon !== false,
        });
      }
    });
  }, [mounted]);

  const updateNavLink = (index: number, field: "label" | "href", value: string) => {
    setForm((prev) => {
      const links = [...(prev.navLinks || [])];
      if (!links[index]) links[index] = { ...defaultNavLink };
      links[index] = { ...links[index], [field]: value };
      return { ...prev, navLinks: links };
    });
    setMessage(null);
  };

  const addNavLink = () => {
    setForm((prev) => ({
      ...prev,
      navLinks: [...(prev.navLinks || []), { ...defaultNavLink }],
    }));
  };

  const removeNavLink = (index: number) => {
    setForm((prev) => ({
      ...prev,
      navLinks: prev.navLinks?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const res = await settingsApi.updateHeader(form);
    setSubmitting(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setMessage({ type: "success", text: "Header settings saved successfully" });
  };

  if (!mounted) return null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Header Settings</h1>
      <p className="mb-8 text-sm text-slate-600">
        Control logo, navigation links, and visibility of header elements. Site name comes from General settings.
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
        <div className="py-12 text-center text-slate-600">Loading...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Logo</h2>
            <p className="mb-4 text-sm text-slate-500">
              Choose where the header logo comes from. If no image is selected, the site name from General settings is shown as text.
            </p>
            <div className="mb-4 space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="logoSource"
                  checked={logoSource === "general"}
                  onChange={() => setForm((prev) => ({ ...prev, logoSource: "general" }))}
                  className="h-4 w-4 border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">Use logo from General Settings</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="logoSource"
                  checked={logoSource === "custom"}
                  onChange={() => setForm((prev) => ({ ...prev, logoSource: "custom" }))}
                  className="h-4 w-4 border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">Use custom logo (select below)</span>
              </label>
            </div>
            {logoSource === "custom" && (
              <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                {form.logoImageUrl ? (
                  <div className="h-16 w-32 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <img src={getMediaUrl(form.logoImageUrl)} alt="Custom Logo" className="h-full w-full object-contain" />
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(true)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {form.logoImageUrl ? "Change" : "Select"} Custom Logo
                  </button>
                  {form.logoImageUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, logoImageUrl: "" }))}
                      className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Navigation Links</h2>
              <button
                type="button"
                onClick={addNavLink}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
              >
                Add Link
              </button>
            </div>
            <div className="space-y-3">
              {(form.navLinks || []).map((link, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateNavLink(i, "label", e.target.value)}
                    placeholder="Label"
                    className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                  <input
                    type="text"
                    value={link.href}
                    onChange={(e) => updateNavLink(i, "href", e.target.value)}
                    placeholder="URL (e.g. /shop or /shop?category=Electronics)"
                    className="min-w-[200px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => removeNavLink(i)}
                    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Visibility</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.showBrowseButton !== false}
                  onChange={(e) => setForm((prev) => ({ ...prev, showBrowseButton: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">Show &quot;Browse&quot; button</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.showCartIcon !== false}
                  onChange={(e) => setForm((prev) => ({ ...prev, showCartIcon: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">Show cart icon</span>
              </label>
            </div>
          </div>

          <MediaPickerModal
            open={showMediaPicker}
            onClose={() => setShowMediaPicker(false)}
            onSelect={(url) => {
              setForm((prev) => ({ ...prev, logoImageUrl: url }));
              setShowMediaPicker(false);
            }}
            title="Select custom logo"
            type="image"
          />

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-amber-600 px-6 py-2.5 font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Header Settings"}
          </button>
        </form>
      )}
    </div>
  );
}
