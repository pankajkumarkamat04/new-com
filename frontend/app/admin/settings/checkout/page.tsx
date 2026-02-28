"use client";

import { useEffect, useState } from "react";
import { settingsApi } from "@/lib/api";
import type { CheckoutSettings } from "@/lib/types";
import { Card, Button, Input, Label, LoadingState } from "@/components/ui";
import { COUNTRY_OPTIONS } from "@/lib/addressConstants";

const defaultForm: CheckoutSettings = {
  name: { enabled: true, required: true, label: "Full Name" },
  address: { enabled: true, required: true, label: "Address" },
  city: { enabled: true, required: true, label: "City" },
  state: { enabled: true, required: false, label: "State / Province" },
  zip: { enabled: true, required: true, label: "ZIP / Postal Code" },
  phone: { enabled: true, required: true, label: "Phone" },
  customFields: [],
  internationalShippingEnabled: false,
  defaultCountry: "IN",
};

export default function AdminCheckoutSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<CheckoutSettings>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    settingsApi.getCheckout().then((res) => {
      setLoading(false);
      if (res.data?.data) {
        const data = res.data.data;
        setForm({
          name: {
            enabled: data.name?.enabled !== false,
            required: data.name?.required !== false,
            label: data.name?.label || defaultForm.name.label,
          },
          address: {
            enabled: data.address?.enabled !== false,
            required: data.address?.required !== false,
            label: data.address?.label || defaultForm.address.label,
          },
          city: {
            enabled: data.city?.enabled !== false,
            required: data.city?.required !== false,
            label: data.city?.label || defaultForm.city.label,
          },
          state: {
            enabled: data.state?.enabled !== false,
            required: !!data.state?.required,
            label: data.state?.label || defaultForm.state.label,
          },
          zip: {
            enabled: data.zip?.enabled !== false,
            required: data.zip?.required !== false,
            label: data.zip?.label || defaultForm.zip.label,
          },
          phone: {
            enabled: data.phone?.enabled !== false,
            required: data.phone?.required !== false,
            label: data.phone?.label || defaultForm.phone.label,
          },
          customFields: Array.isArray(data.customFields)
            ? data.customFields.map((f) => ({
                key: f.key || f.label || "",
                label: f.label || f.key || "",
                enabled: f.enabled !== false,
                required: !!f.required,
              }))
            : [],
          internationalShippingEnabled: data.internationalShippingEnabled === true,
          defaultCountry: (data.defaultCountry && String(data.defaultCountry).trim()) || "IN",
        });
      }
    });
  }, [mounted]);

  const updateField = (
    field: "name" | "address" | "city" | "state" | "zip" | "phone",
    patch: Partial<CheckoutSettings["name"]>
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        ...patch,
      },
    }));
    setMessage(null);
  };

  const addCustomField = () => {
    setForm((prev) => ({
      ...prev,
      customFields: [...(prev.customFields || []), { key: "", label: "", enabled: true, required: false }],
    }));
    setMessage(null);
  };

  const updateCustomField = (
    index: number,
    patch: Partial<NonNullable<CheckoutSettings["customFields"]>[number]>
  ) => {
    setForm((prev) => {
      const list = [...(prev.customFields || [])];
      list[index] = { ...list[index], ...patch };
      return { ...prev, customFields: list };
    });
    setMessage(null);
  };

  const removeCustomField = (index: number) => {
    setForm((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).filter((_, i) => i !== index),
    }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const res = await settingsApi.updateCheckout(form);
    setSubmitting(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setMessage({ type: "success", text: "Checkout settings saved successfully" });
  };

  if (!mounted) return null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Checkout Settings</h1>
      <p className="mb-8 text-sm text-slate-600">
        Control which fields appear on the checkout page and which ones are required.
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
        <LoadingState message="Loading..." />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Shipping &amp; Country</h2>
            <p className="mb-4 text-xs text-slate-500">
              When international shipping is disabled, only the default country is shown on checkout. When enabled, customers can choose from the full country list.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.internationalShippingEnabled === true}
                  onChange={(e) => setForm((prev) => ({ ...prev, internationalShippingEnabled: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-slate-900">Enable international shipping</span>
              </label>
              <div className="flex items-center gap-2">
                <Label className="text-slate-700">Default country</Label>
                <select
                  value={form.defaultCountry ?? "IN"}
                  onChange={(e) => setForm((prev) => ({ ...prev, defaultCountry: e.target.value }))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500">
                  {form.internationalShippingEnabled ? "Used as default selection." : "Only country shown on checkout."}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {(
              [
                ["name", "Customer name used for shipping and orders"],
                ["address", "Primary street address for delivery"],
                ["city", "City or locality for shipping"],
                ["state", "State / province / region, if needed"],
                ["zip", "Postal / ZIP code used by the carrier"],
                ["phone", "Phone number used for delivery updates"],
              ] as const
            ).map(([key, helper]) => {
              const field = form[key];
              return (
                <div
                  key={key}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900">
                        {field.label || defaultForm[key].label}
                      </label>
                      <p className="mt-0.5 text-xs text-slate-500">{helper}</p>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={field.enabled !== false}
                        onChange={(e) => updateField(key, { enabled: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      Enable
                    </label>
                  </div>

                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Label</label>
                      <input
                        type="text"
                        value={field.label || ""}
                        onChange={(e) => updateField(key, { label: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={field.required !== false}
                        onChange={(e) => updateField(key, { required: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      Required
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Custom Fields</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Add extra fields to collect additional information during checkout (e.g. GST number, delivery notes).
                </p>
              </div>
              <button
                type="button"
                onClick={addCustomField}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
              >
                Add Custom Field
              </button>
            </div>

            {(form.customFields || []).length === 0 ? (
              <p className="text-sm text-slate-500">No custom fields added yet.</p>
            ) : (
              <div className="space-y-3">
                {(form.customFields || []).map((field, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Key (unique ID)</label>
                          <input
                            type="text"
                            value={field.key}
                            onChange={(e) => updateCustomField(index, { key: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            placeholder="e.g. gstNumber"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Label</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateCustomField(index, { label: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            placeholder="e.g. GST Number"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={field.enabled !== false}
                            onChange={(e) => updateCustomField(index, { enabled: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          />
                          Enable
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={field.required || false}
                            onChange={(e) => updateCustomField(index, { required: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          />
                          Required
                        </label>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomField(index)}
                      className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primaryAmber"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save Checkout Settings"}
          </Button>
        </form>
      )}
    </div>
  );
}

