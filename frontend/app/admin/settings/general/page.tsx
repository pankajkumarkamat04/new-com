"use client";

import { useEffect, useState } from "react";
import { settingsApi, type Settings } from "@/lib/api";

const defaultForm: Partial<Settings> = {
  siteName: "",
  siteUrl: "",
  siteTagline: "",
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  facebookUrl: "",
  instagramUrl: "",
  twitterUrl: "",
  linkedinUrl: "",
  couponEnabled: false,
};

export default function AdminGeneralSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<Partial<Settings>>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    settingsApi.get().then((res) => {
      setLoading(false);
      if (res.data?.data) {
        setForm({
          siteName: res.data.data.siteName || "",
          siteUrl: res.data.data.siteUrl || "",
          siteTagline: res.data.data.siteTagline || "",
          contactEmail: res.data.data.contactEmail || "",
          contactPhone: res.data.data.contactPhone || "",
          contactAddress: res.data.data.contactAddress || "",
          facebookUrl: res.data.data.facebookUrl || "",
          instagramUrl: res.data.data.instagramUrl || "",
          twitterUrl: res.data.data.twitterUrl || "",
          linkedinUrl: res.data.data.linkedinUrl || "",
          couponEnabled: !!res.data.data.couponEnabled,
        });
      }
    });
  }, [mounted]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const res = await settingsApi.update(form);
    setSubmitting(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setMessage({ type: "success", text: "Settings saved successfully" });
  };

  if (!mounted) return null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">General Settings</h1>

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
        <div className="py-12 text-center text-slate-600">Loading settings...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">General</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Site Name</label>
                <input
                  type="text"
                  name="siteName"
                  value={form.siteName || ""}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Site URL</label>
                <input
                  type="url"
                  name="siteUrl"
                  value={form.siteUrl || ""}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Site Tagline</label>
                <input
                  type="text"
                  name="siteTagline"
                  value={form.siteTagline || ""}
                  onChange={handleChange}
                  placeholder="Your trusted online shopping destination."
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Contact Details</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={form.contactEmail || ""}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Contact Phone</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={form.contactPhone || ""}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Contact Address</label>
                <textarea
                  name="contactAddress"
                  value={form.contactAddress || ""}
                  onChange={handleChange}
                  rows={3}
                  placeholder="123 Main St, City, Country"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Social Media</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Facebook URL</label>
                <input
                  type="url"
                  name="facebookUrl"
                  value={form.facebookUrl || ""}
                  onChange={handleChange}
                  placeholder="https://facebook.com/yourpage"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Instagram URL</label>
                <input
                  type="url"
                  name="instagramUrl"
                  value={form.instagramUrl || ""}
                  onChange={handleChange}
                  placeholder="https://instagram.com/yourpage"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Twitter / X URL</label>
                <input
                  type="url"
                  name="twitterUrl"
                  value={form.twitterUrl || ""}
                  onChange={handleChange}
                  placeholder="https://twitter.com/yourpage"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">LinkedIn URL</label>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={form.linkedinUrl || ""}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/company/yourpage"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Features</h2>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Coupon Management</p>
                <p className="text-xs text-slate-500">
                  Enable coupon codes for discounts at checkout. When enabled, the Coupons page
                  appears in admin and customers can apply coupon codes.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={!!form.couponEnabled}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, couponEnabled: e.target.checked }));
                    setMessage(null);
                  }}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-amber-600 peer-checked:after:translate-x-full" />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-amber-600 px-6 py-2.5 font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Settings"}
          </button>
        </form>
      )}
    </div>
  );
}
