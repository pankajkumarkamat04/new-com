"use client";

import { useEffect, useState } from "react";
import { settingsApi } from "@/lib/api";
import type { PaymentSettings } from "@/lib/types";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "CAD", "AUD", "JPY"] as const;

const defaultForm: PaymentSettings = {
  currency: "INR",
  cod: { enabled: true },
  razorpay: { enabled: false },
  cashfree: { enabled: false },
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
          razorpay: { enabled: !!d.razorpay?.enabled },
          cashfree: { enabled: !!d.cashfree?.enabled },
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

      <form onSubmit={handleSubmit} className="w-full space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Default currency</label>
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

          <div className="space-y-4">
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50">
              <div>
                <span className="font-medium text-slate-900">Cash on Delivery (COD)</span>
                <p className="text-sm text-slate-500">Customer pays when the order is delivered.</p>
              </div>
              <input
                type="checkbox"
                checked={form.cod.enabled}
                onChange={(e) => setForm({ ...form, cod: { enabled: e.target.checked } })}
                className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50">
              <div>
                <span className="font-medium text-slate-900">Razorpay</span>
                <p className="text-sm text-slate-500">Online payment via Razorpay (card, UPI, netbanking, etc.).</p>
              </div>
              <input
                type="checkbox"
                checked={form.razorpay.enabled}
                onChange={(e) => setForm({ ...form, razorpay: { enabled: e.target.checked } })}
                className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50">
              <div>
                <span className="font-medium text-slate-900">Cashfree</span>
                <p className="text-sm text-slate-500">Online payment via Cashfree.</p>
              </div>
              <input
                type="checkbox"
                checked={form.cashfree.enabled}
                onChange={(e) => setForm({ ...form, cashfree: { enabled: e.target.checked } })}
                className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
            </label>
          </div>
        </div>

        {message && (
          <p className={message.type === "success" ? "text-sm text-emerald-600" : "text-sm text-red-600"}>
            {message.text}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save payment settings"}
          </button>
        </div>
      </form>

      {loading && (
        <div className="mt-4 text-sm text-slate-500">Loading payment settings...</div>
      )}
    </div>
  );
}
