"use client";

import { useEffect, useState } from "react";
import { settingsApi } from "@/lib/api";
import { useSettings } from "@/contexts/SettingsContext";
import type { ModuleSettings } from "@/lib/types";

const defaultForm: Partial<ModuleSettings> = {
    couponEnabled: false,
    blogEnabled: false,
    abandonedCartEnabled: false,
    googleAnalyticsEnabled: false,
    googleAnalyticsId: "",
    facebookPixelEnabled: false,
    facebookPixelId: "",
    taxEnabled: false,
    defaultTaxPercentage: 0,
    whatsappChat: {
        enabled: false,
        position: "right" as const,
        phoneNumber: "",
    },
};

export default function AdminModuleSettingsPage() {
    const { refresh } = useSettings();
    const [mounted, setMounted] = useState(false);
    const [form, setForm] = useState<Partial<ModuleSettings>>(defaultForm);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        settingsApi.getModules().then((res) => {
            setLoading(false);
            if (res.data?.data) {
                const d = res.data.data;
                setForm({
                    couponEnabled: !!d.couponEnabled,
                    blogEnabled: !!d.blogEnabled,
                    abandonedCartEnabled: !!d.abandonedCartEnabled,
                    googleAnalyticsEnabled: !!d.googleAnalyticsEnabled,
                    googleAnalyticsId: d.googleAnalyticsId || "",
                    facebookPixelEnabled: !!d.facebookPixelEnabled,
                    facebookPixelId: d.facebookPixelId || "",
                    taxEnabled: !!d.taxEnabled,
                    defaultTaxPercentage: d.defaultTaxPercentage ?? 0,
                    whatsappChat: {
                        enabled: !!d.whatsappChat?.enabled,
                        position: d.whatsappChat?.position === "left" ? "left" : "right",
                        phoneNumber: d.whatsappChat?.phoneNumber || "",
                    },
                });
            }
        });
    }, [mounted]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);
        const res = await settingsApi.updateModules(form);
        setSubmitting(false);
        if (res.error) {
            setMessage({ type: "error", text: res.error });
            return;
        }
        await refresh();
        setMessage({ type: "success", text: "Module settings saved successfully" });
    };

    if (!mounted) return null;

    return (
        <div className="px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="mb-6 text-2xl font-bold text-slate-900">Module Settings</h1>
            <p className="mb-8 text-sm text-slate-500">
                Enable or disable features for your store. Changes take effect immediately after saving.
            </p>

            {message && (
                <div
                    className={`mb-6 rounded-lg px-4 py-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                        }`}
                >
                    {message.text}
                </div>
            )}

            {loading ? (
                <div className="py-12 text-center text-slate-600">Loading settings...</div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Commerce */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-1 text-lg font-semibold text-slate-900">Commerce</h2>
                        <p className="mb-4 text-xs text-slate-500">Core store features that affect checkout and order management.</p>
                        <div className="space-y-3">
                            {/* Coupon Management */}
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

                            {/* Abandoned Cart Recovery */}
                            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Abandoned Cart Recovery</p>
                                    <p className="text-xs text-slate-500">
                                        Send recovery emails to users who left items in their cart. Requires email notifications
                                        to be configured. Run a cron job to trigger recovery (e.g. every hour).
                                    </p>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={!!form.abandonedCartEnabled}
                                        onChange={(e) => {
                                            setForm((prev) => ({ ...prev, abandonedCartEnabled: e.target.checked }));
                                            setMessage(null);
                                        }}
                                        className="peer sr-only"
                                    />
                                    <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-amber-600 peer-checked:after:translate-x-full" />
                                </label>
                            </div>

                            {/* Tax */}
                            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Tax</p>
                                        <p className="text-xs text-slate-500">
                                            Enable tax on products and orders. Set a default tax percentage used when products
                                            have no custom tax.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            checked={!!form.taxEnabled}
                                            onChange={(e) => {
                                                setForm((prev) => ({ ...prev, taxEnabled: e.target.checked }));
                                                setMessage(null);
                                            }}
                                            className="peer sr-only"
                                        />
                                        <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-amber-600 peer-checked:after:translate-x-full" />
                                    </label>
                                </div>
                                {form.taxEnabled && (
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-600">Default Tax Percentage (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            name="defaultTaxPercentage"
                                            value={form.defaultTaxPercentage ?? 0}
                                            onChange={(e) => {
                                                const v = parseFloat(e.target.value);
                                                setForm((prev) => ({
                                                    ...prev,
                                                    defaultTaxPercentage: isNaN(v) ? 0 : Math.max(0, Math.min(100, v)),
                                                }));
                                                setMessage(null);
                                            }}
                                            placeholder="0"
                                            className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-1 text-lg font-semibold text-slate-900">Content</h2>
                        <p className="mb-4 text-xs text-slate-500">Content and publishing features for your store.</p>
                        <div className="space-y-3">
                            {/* Blog Module */}
                            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Blog Module</p>
                                    <p className="text-xs text-slate-500">
                                        Enable a blog section for publishing articles. When enabled, the Blogs page appears
                                        in admin and the public blog pages are accessible.
                                    </p>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={!!form.blogEnabled}
                                        onChange={(e) => {
                                            setForm((prev) => ({ ...prev, blogEnabled: e.target.checked }));
                                            setMessage(null);
                                        }}
                                        className="peer sr-only"
                                    />
                                    <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-600 peer-checked:after:translate-x-full" />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Analytics & Marketing */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-1 text-lg font-semibold text-slate-900">Analytics & Marketing</h2>
                        <p className="mb-4 text-xs text-slate-500">Track and analyse visitors, and power your marketing campaigns.</p>
                        <div className="space-y-3">
                            {/* Google Analytics */}
                            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Google Analytics</p>
                                        <p className="text-xs text-slate-500">
                                            Track page views and user behavior. Enter your GA4 Measurement ID (e.g. G-XXXXXXXXXX).
                                        </p>
                                    </div>
                                    <label className="relative inline-flex cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            checked={!!form.googleAnalyticsEnabled}
                                            onChange={(e) => {
                                                setForm((prev) => ({ ...prev, googleAnalyticsEnabled: e.target.checked }));
                                                setMessage(null);
                                            }}
                                            className="peer sr-only"
                                        />
                                        <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-amber-600 peer-checked:after:translate-x-full" />
                                    </label>
                                </div>
                                {form.googleAnalyticsEnabled && (
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-600">Measurement ID</label>
                                        <input
                                            type="text"
                                            name="googleAnalyticsId"
                                            value={form.googleAnalyticsId || ""}
                                            onChange={(e) => {
                                                setForm((prev) => ({ ...prev, googleAnalyticsId: e.target.value }));
                                                setMessage(null);
                                            }}
                                            placeholder="G-XXXXXXXXXX"
                                            className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Facebook Pixel */}
                            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Facebook Pixel</p>
                                        <p className="text-xs text-slate-500">
                                            Track conversions and build audiences for Meta ads. Enter your Pixel ID (e.g. 1234567890123456).
                                        </p>
                                    </div>
                                    <label className="relative inline-flex cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            checked={!!form.facebookPixelEnabled}
                                            onChange={(e) => {
                                                setForm((prev) => ({ ...prev, facebookPixelEnabled: e.target.checked }));
                                                setMessage(null);
                                            }}
                                            className="peer sr-only"
                                        />
                                        <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-amber-600 peer-checked:after:translate-x-full" />
                                    </label>
                                </div>
                                {form.facebookPixelEnabled && (
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-600">Pixel ID</label>
                                        <input
                                            type="text"
                                            name="facebookPixelId"
                                            value={form.facebookPixelId || ""}
                                            onChange={(e) => {
                                                setForm((prev) => ({ ...prev, facebookPixelId: e.target.value }));
                                                setMessage(null);
                                            }}
                                            placeholder="1234567890123456"
                                            className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Communication */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-1 text-lg font-semibold text-slate-900">Communication</h2>
                        <p className="mb-4 text-xs text-slate-500">Customer-facing communication and support tools.</p>
                        <div className="space-y-3">
                            {/* WhatsApp Chat Button */}
                            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">WhatsApp Chat Button</p>
                                        <p className="text-xs text-slate-500">
                                            Show a floating WhatsApp chat button so customers can contact you. Choose position (left or right) and enter your WhatsApp number.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            checked={!!form.whatsappChat?.enabled}
                                            onChange={(e) => {
                                                setForm((prev) => ({
                                                    ...prev,
                                                    whatsappChat: {
                                                        ...prev.whatsappChat,
                                                        enabled: e.target.checked,
                                                        position: prev.whatsappChat?.position ?? "right",
                                                        phoneNumber: prev.whatsappChat?.phoneNumber ?? "",
                                                    },
                                                }));
                                                setMessage(null);
                                            }}
                                            className="peer sr-only"
                                        />
                                        <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-600 peer-checked:after:translate-x-full" />
                                    </label>
                                </div>
                                {form.whatsappChat?.enabled && (
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                                        <div className="flex-1">
                                            <label className="mb-1 block text-xs font-medium text-slate-600">Position</label>
                                            <select
                                                value={form.whatsappChat?.position ?? "right"}
                                                onChange={(e) => {
                                                    const v = e.target.value as "left" | "right";
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        whatsappChat: {
                                                            ...prev.whatsappChat,
                                                            position: v,
                                                            enabled: prev.whatsappChat?.enabled ?? false,
                                                            phoneNumber: prev.whatsappChat?.phoneNumber ?? "",
                                                        },
                                                    }));
                                                    setMessage(null);
                                                }}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                            >
                                                <option value="left">Left</option>
                                                <option value="right">Right</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="mb-1 block text-xs font-medium text-slate-600">WhatsApp Number</label>
                                            <input
                                                type="tel"
                                                value={form.whatsappChat?.phoneNumber ?? ""}
                                                onChange={(e) => {
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        whatsappChat: {
                                                            ...prev.whatsappChat,
                                                            phoneNumber: e.target.value,
                                                            enabled: prev.whatsappChat?.enabled ?? false,
                                                            position: prev.whatsappChat?.position ?? "right",
                                                        },
                                                    }));
                                                    setMessage(null);
                                                }}
                                                placeholder="919876543210"
                                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                            />
                                            <p className="mt-0.5 text-xs text-slate-500">Country code + number, no spaces (e.g. 919876543210)</p>
                                        </div>
                                    </div>
                                )}
                            </div>
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
