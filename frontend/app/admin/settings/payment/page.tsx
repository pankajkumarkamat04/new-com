"use client";

import { useEffect, useState } from "react";
import { settingsApi } from "@/lib/api";
import type { PaymentSettings } from "@/lib/types";
import { Card, Label, Button, LoadingState } from "@/components/ui";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "CAD", "AUD", "JPY"] as const;

const defaultForm: PaymentSettings = {
  currency: "INR",
  cod: { enabled: true },
  razorpay: { enabled: false, keyId: "", keySecret: "" },
  cashfree: { enabled: false, appId: "", secretKey: "", env: "sandbox" },
};

export default function AdminPaymentSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<PaymentSettings>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    settingsApi.getPayment().then((res) => {
      setLoading(false);
      if (res.data?.data) {
        const d = res.data.data;
        setForm({
          currency: d.currency || "INR",
          cod: { enabled: d.cod?.enabled !== false },
          razorpay: {
            enabled: !!d.razorpay?.enabled,
            keyId: d.razorpay?.keyId ?? "",
            keySecret: d.razorpay?.keySecret ?? "",
          },
          cashfree: {
            enabled: !!d.cashfree?.enabled,
            appId: d.cashfree?.appId ?? "",
            secretKey: d.cashfree?.secretKey ?? "",
            env: d.cashfree?.env === "production" ? "production" : "sandbox",
          },
        });
      }
    });
  }, [mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    const res = await settingsApi.updatePayment(form);
    setSubmitting(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setMessage({ type: "success", text: "Payment settings saved." });
  };

  if (!mounted) return null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Payment Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Set default currency and enable or disable payment options. These options are shown at checkout.
        </p>
      </div>

      {loading ? (
        <LoadingState message="Loading payment settings..." />
      ) : (
      <Card>
      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div>
          <Label className="text-slate-700">Default currency</Label>
          <select
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            All prices and order totals will be displayed in this currency across the website.
          </p>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Payment options</h2>
          <p className="mb-4 text-sm text-slate-600">
            Enable or disable each payment method. At least one method should be enabled for checkout.
          </p>

          <div className="space-y-3">
            {/* COD */}
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Cash on Delivery (COD)</p>
                <p className="text-xs text-slate-500">Customer pays when the order is delivered.</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={form.cod.enabled}
                  onChange={(e) => setForm({ ...form, cod: { enabled: e.target.checked } })}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-amber-600 peer-checked:after:translate-x-full" />
              </label>
            </div>

            {/* Razorpay */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Razorpay</p>
                  <p className="text-xs text-slate-500">Online payment via Razorpay (card, UPI, netbanking, etc.).</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={form.razorpay.enabled}
                    onChange={(e) => setForm({ ...form, razorpay: { ...form.razorpay, enabled: e.target.checked } })}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-amber-600 peer-checked:after:translate-x-full" />
                </label>
              </div>
              {form.razorpay.enabled && (
                <div className="grid gap-3 sm:grid-cols-2 pl-0 pt-2 border-t border-slate-100">
                  <div>
                    <Label className="text-slate-600">Key ID</Label>
                    <input
                      type="text"
                      value={form.razorpay.keyId ?? ""}
                      onChange={(e) => setForm({ ...form, razorpay: { ...form.razorpay, keyId: e.target.value } })}
                      placeholder="rzp_test_xxxx"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-600">Key Secret</Label>
                    <input
                      type="password"
                      value={form.razorpay.keySecret ?? ""}
                      onChange={(e) => setForm({ ...form, razorpay: { ...form.razorpay, keySecret: e.target.value } })}
                      placeholder="Leave blank to keep current"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <p className="mt-0.5 text-xs text-slate-500">From Dashboard → API Keys. Leave blank to keep existing secret.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Cashfree */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Cashfree</p>
                  <p className="text-xs text-slate-500">Online payment via Cashfree.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={form.cashfree.enabled}
                    onChange={(e) => setForm({ ...form, cashfree: { ...form.cashfree, enabled: e.target.checked } })}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-amber-600 peer-checked:after:translate-x-full" />
                </label>
              </div>
              {form.cashfree.enabled && (
                <div className="grid gap-3 sm:grid-cols-2 pl-0 pt-2 border-t border-slate-100">
                  <div>
                    <Label className="text-slate-600">App ID</Label>
                    <input
                      type="text"
                      value={form.cashfree.appId ?? ""}
                      onChange={(e) => setForm({ ...form, cashfree: { ...form.cashfree, appId: e.target.value } })}
                      placeholder="Your Cashfree App ID"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-600">Secret Key</Label>
                    <input
                      type="password"
                      value={form.cashfree.secretKey ?? ""}
                      onChange={(e) => setForm({ ...form, cashfree: { ...form.cashfree, secretKey: e.target.value } })}
                      placeholder="Leave blank to keep current"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <p className="mt-0.5 text-xs text-slate-500">Leave blank to keep existing secret.</p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-slate-600">Environment</Label>
                    <select
                      value={form.cashfree.env ?? "sandbox"}
                      onChange={(e) => setForm({ ...form, cashfree: { ...form.cashfree, env: e.target.value as "sandbox" | "production" } })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="sandbox">Sandbox (test)</option>
                      <option value="production">Production</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {message && (
          <p className={message.type === "success" ? "text-sm text-emerald-600" : "text-sm text-red-600"}>
            {message.text}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" variant="primaryAmber" disabled={submitting}>
            {submitting ? "Saving..." : "Save payment settings"}
          </Button>
        </div>
      </form>
      </Card>
      )}
    </div>
  );
}
