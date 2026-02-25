"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { settingsApi } from "@/lib/api";
import type { LoginSettings } from "@/lib/types";

const defaultForm: LoginSettings = {
  loginIdentifier: "email",
  loginMethod: "password",
};

export default function AdminLoginSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<LoginSettings>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    settingsApi.getLogin().then((res) => {
      setLoading(false);
      if (res.data?.data) {
        const d = res.data.data;
        setForm({
          loginIdentifier: d.loginIdentifier === "phone" ? "phone" : "email",
          loginMethod: d.loginMethod === "otp" ? "otp" : "password",
        });
      }
    });
  }, [mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    const res = await settingsApi.updateLogin(form);
    setSubmitting(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setMessage({ type: "success", text: "Login settings saved." });
  };

  if (!mounted) return null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Login Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Choose one identifier and one authentication method for customer login.
        </p>
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
        <div className="py-12 text-center text-slate-600">Loading login settings...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Login identifier</h2>
            <p className="mb-4 text-sm text-slate-600">
              Choose one: customers sign in with either Email OR Phone.
            </p>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50">
                <input
                  type="radio"
                  name="loginIdentifier"
                  value="email"
                  checked={form.loginIdentifier === "email"}
                  onChange={() => setForm((prev) => ({ ...prev, loginIdentifier: "email" }))}
                  className="h-4 w-4 border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-medium text-slate-900">Email</span>
                  <p className="text-sm text-slate-500">Users sign in with their email address.</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50">
                <input
                  type="radio"
                  name="loginIdentifier"
                  value="phone"
                  checked={form.loginIdentifier === "phone"}
                  onChange={() => setForm((prev) => ({ ...prev, loginIdentifier: "phone" }))}
                  className="h-4 w-4 border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-medium text-slate-900">Phone</span>
                  <p className="text-sm text-slate-500">Users sign in with their phone number.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Authentication method</h2>
            <p className="mb-4 text-sm text-slate-600">
              Choose one: customers sign in with either Password OR OTP.
            </p>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50">
                <input
                  type="radio"
                  name="loginMethod"
                  value="password"
                  checked={form.loginMethod === "password"}
                  onChange={() => setForm((prev) => ({ ...prev, loginMethod: "password" }))}
                  className="h-4 w-4 border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-medium text-slate-900">Password</span>
                  <p className="text-sm text-slate-500">Traditional password sign in.</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50">
                <input
                  type="radio"
                  name="loginMethod"
                  value="otp"
                  checked={form.loginMethod === "otp"}
                  onChange={() => setForm((prev) => ({ ...prev, loginMethod: "otp" }))}
                  className="h-4 w-4 border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-medium text-slate-900">OTP</span>
                  <p className="text-sm text-slate-500">One-time code sent to email or phone for passwordless login.</p>
                </div>
              </label>
            </div>

            {form.loginMethod === "otp" && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800">OTP login selected</p>
                <p className="mt-1 text-sm text-amber-700">
                  To send OTPs, configure Notification Settings. Enable Email, SMS, or WhatsApp and add your credentials.
                </p>
                <Link
                  href="/admin/settings/notifications"
                  className="mt-2 inline-block text-sm font-medium text-amber-700 underline hover:text-amber-800"
                >
                  Configure Notification Settings →
                </Link>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-amber-600 px-6 py-2.5 font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Login Settings"}
          </button>
        </form>
      )}
    </div>
  );
}
