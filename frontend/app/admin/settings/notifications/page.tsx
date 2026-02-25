"use client";

import { useEffect, useState } from "react";
import { settingsApi } from "@/lib/api";
import type { NotificationSettings } from "@/lib/types";

const defaultForm: NotificationSettings = {
  email: {
    enabled: false,
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "",
    smtpPass: "",
    fromEmail: "",
    fromName: "",
  },
  sms: {
    enabled: false,
    provider: "twilio",
    apiKey: "",
    apiSecret: "",
    fromNumber: "",
  },
  whatsapp: {
    enabled: false,
    provider: "twilio",
    apiKey: "",
    apiSecret: "",
    phoneNumberId: "",
    fromNumber: "",
  },
};

export default function AdminNotificationSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<NotificationSettings>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    settingsApi.getNotifications().then((res) => {
      setLoading(false);
      if (res.data?.data) {
        const d = res.data.data;
        setForm({
          email: {
            enabled: d.email?.enabled ?? false,
            smtpHost: d.email?.smtpHost ?? "",
            smtpPort: d.email?.smtpPort ?? 587,
            smtpSecure: d.email?.smtpSecure ?? false,
            smtpUser: d.email?.smtpUser ?? "",
            smtpPass: d.email?.smtpPass ?? "",
            fromEmail: d.email?.fromEmail ?? "",
            fromName: d.email?.fromName ?? "",
          },
          sms: {
            enabled: d.sms?.enabled ?? false,
            provider: d.sms?.provider ?? "twilio",
            apiKey: d.sms?.apiKey ?? "",
            apiSecret: d.sms?.apiSecret ?? "",
            fromNumber: d.sms?.fromNumber ?? "",
          },
          whatsapp: {
            enabled: d.whatsapp?.enabled ?? false,
            provider: d.whatsapp?.provider ?? "twilio",
            apiKey: d.whatsapp?.apiKey ?? "",
            apiSecret: d.whatsapp?.apiSecret ?? "",
            phoneNumberId: d.whatsapp?.phoneNumberId ?? "",
            fromNumber: d.whatsapp?.fromNumber ?? "",
          },
        });
      }
    });
  }, [mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    const res = await settingsApi.updateNotifications(form);
    setSubmitting(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setMessage({ type: "success", text: "Notification settings saved." });
  };

  if (!mounted) return null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Notification Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Configure Email, SMS, and WhatsApp notification channels. Each channel can be enabled or disabled independently.
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
        <div className="py-12 text-center text-slate-600">Loading notification settings...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Settings */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Email Settings</h2>
                <p className="text-sm text-slate-500">Send order confirmations and notifications via email.</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={form.email.enabled}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      email: { ...prev.email, enabled: e.target.checked },
                    }))
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-amber-600 peer-checked:after:translate-x-full" />
              </label>
            </div>
            {form.email.enabled && (
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">SMTP Host</label>
                    <input
                      type="text"
                      value={form.email.smtpHost}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, email: { ...prev.email, smtpHost: e.target.value } }))
                      }
                      placeholder="smtp.gmail.com"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">SMTP Port</label>
                    <input
                      type="number"
                      value={form.email.smtpPort}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          email: { ...prev.email, smtpPort: parseInt(e.target.value, 10) || 587 },
                        }))
                      }
                      placeholder="587"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="smtpSecure"
                    checked={form.email.smtpSecure}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: { ...prev.email, smtpSecure: e.target.checked } }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="smtpSecure" className="text-sm text-slate-600">
                    Use TLS/SSL
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">SMTP Username</label>
                    <input
                      type="text"
                      value={form.email.smtpUser}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, email: { ...prev.email, smtpUser: e.target.value } }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">SMTP Password</label>
                    <input
                      type="password"
                      value={form.email.smtpPass}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, email: { ...prev.email, smtpPass: e.target.value } }))
                      }
                      placeholder="Leave blank to keep existing"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">From Email</label>
                    <input
                      type="email"
                      value={form.email.fromEmail}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, email: { ...prev.email, fromEmail: e.target.value } }))
                      }
                      placeholder="noreply@example.com"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">From Name</label>
                    <input
                      type="text"
                      value={form.email.fromName}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, email: { ...prev.email, fromName: e.target.value } }))
                      }
                      placeholder="Your Store"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SMS Settings */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">SMS Settings</h2>
                <p className="text-sm text-slate-500">Send order updates and OTP via SMS (e.g. Twilio, MSG91).</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={form.sms.enabled}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sms: { ...prev.sms, enabled: e.target.checked } }))
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-600 peer-checked:after:translate-x-full" />
              </label>
            </div>
            {form.sms.enabled && (
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">Provider</label>
                  <select
                    value={form.sms.provider}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, sms: { ...prev.sms, provider: e.target.value } }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="twilio">Twilio</option>
                    <option value="msg91">MSG91</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">API Key / Account SID</label>
                    <input
                      type="text"
                      value={form.sms.apiKey}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, sms: { ...prev.sms, apiKey: e.target.value } }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">API Secret / Auth Token</label>
                    <input
                      type="password"
                      value={form.sms.apiSecret}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, sms: { ...prev.sms, apiSecret: e.target.value } }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">From Number</label>
                  <input
                    type="text"
                    value={form.sms.fromNumber}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, sms: { ...prev.sms, fromNumber: e.target.value } }))
                    }
                    placeholder="+1234567890"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Settings */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">WhatsApp Settings</h2>
                <p className="text-sm text-slate-500">Send order notifications via WhatsApp Business API.</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={form.whatsapp.enabled}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, whatsapp: { ...prev.whatsapp, enabled: e.target.checked } }))
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-green-600 peer-checked:after:translate-x-full" />
              </label>
            </div>
            {form.whatsapp.enabled && (
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">Provider</label>
                  <select
                    value={form.whatsapp.provider}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, whatsapp: { ...prev.whatsapp, provider: e.target.value } }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="twilio">Twilio</option>
                    <option value="meta">Meta WhatsApp Business</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">API Key / Access Token</label>
                    <input
                      type="text"
                      value={form.whatsapp.apiKey}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, whatsapp: { ...prev.whatsapp, apiKey: e.target.value } }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">API Secret</label>
                    <input
                      type="password"
                      value={form.whatsapp.apiSecret}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, whatsapp: { ...prev.whatsapp, apiSecret: e.target.value } }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">Phone Number ID</label>
                    <input
                      type="text"
                      value={form.whatsapp.phoneNumberId}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          whatsapp: { ...prev.whatsapp, phoneNumberId: e.target.value },
                        }))
                      }
                      placeholder="For Meta WhatsApp"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">From Number</label>
                    <input
                      type="text"
                      value={form.whatsapp.fromNumber}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          whatsapp: { ...prev.whatsapp, fromNumber: e.target.value },
                        }))
                      }
                      placeholder="+1234567890"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-amber-600 px-6 py-2.5 font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Notification Settings"}
          </button>
        </form>
      )}
    </div>
  );
}
