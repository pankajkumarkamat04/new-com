"use client";

import { useEffect, useState } from "react";
import { couponApi, settingsApi } from "@/lib/api";
import type { Coupon } from "@/lib/types";
import { Button, Card, Input, Label, LoadingState, EmptyState, Badge } from "@/components/ui";

export default function AdminCouponsPage() {
  const [mounted, setMounted] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponEnabled, setCouponEnabled] = useState<boolean | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    minOrderAmount: "",
    maxDiscount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    settingsApi.get().then((res) => {
      if (res.data?.data) {
        setCouponEnabled(!!(res.data.data as any).couponEnabled);
      } else {
        setCouponEnabled(false);
      }
    });
    fetchCoupons();
  }, [mounted]);

  const fetchCoupons = () => {
    setLoading(true);
    couponApi.list({ limit: 100 }).then((res) => {
      setLoading(false);
      if (res.data?.data) setCoupons(res.data.data);
    });
  };

  const resetForm = () => {
    setForm({
      code: "",
      discountType: "percentage",
      discountValue: "",
      minOrderAmount: "",
      maxDiscount: "",
      usageLimit: "",
      startDate: "",
      endDate: "",
      isActive: true,
    });
    setEditing(null);
    setShowForm(false);
    setError("");
  };

  const handleEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderAmount: coupon.minOrderAmount ? String(coupon.minOrderAmount) : "",
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
      startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : "",
      endDate: coupon.endDate ? coupon.endDate.slice(0, 10) : "",
      isActive: coupon.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.code.trim()) {
      setError("Coupon code is required");
      return;
    }
    const dv = parseFloat(form.discountValue);
    if (!dv || dv <= 0) {
      setError("Discount value must be greater than 0");
      return;
    }

    setSubmitting(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: dv,
      minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : 0,
      maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : 0,
      usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : 0,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      isActive: form.isActive,
    };

    if (editing) {
      const res = await couponApi.update(editing._id, payload);
      setSubmitting(false);
      if (res.error) setError(res.error);
      else {
        fetchCoupons();
        resetForm();
      }
    } else {
      const res = await couponApi.create(payload);
      setSubmitting(false);
      if (res.error) setError(res.error);
      else {
        fetchCoupons();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    const res = await couponApi.delete(id);
    if (!res.error) fetchCoupons();
  };

  if (!mounted) return null;

  if (couponEnabled === false) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Coupons</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="text-lg font-medium text-amber-800">Coupon Management is Disabled</p>
          <p className="mt-2 text-sm text-amber-700">
            Enable it in{" "}
            <a href="/admin/settings/general" className="font-semibold underline">
              General Settings
            </a>{" "}
            under the Features section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Coupons</h1>
        <Button variant="primaryAmber" onClick={() => { resetForm(); setShowForm(true); }}>
          Add Coupon
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {editing ? "Edit Coupon" : "Add Coupon"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SAVE20"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 font-mono text-slate-900 uppercase focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Discount Type *
                </label>
                <select
                  value={form.discountType}
                  onChange={(e) =>
                    setForm({ ...form, discountType: e.target.value as "percentage" | "fixed" })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Discount Value *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  placeholder={form.discountType === "percentage" ? "e.g. 20" : "e.g. 100"}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Min Order Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                  placeholder="0 = no minimum"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              {form.discountType === "percentage" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">
                    Max Discount (cap)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    placeholder="0 = no cap"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Usage Limit
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="0 = unlimited"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="couponActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="couponActive" className="text-sm text-slate-600">
                Active
              </label>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" variant="primaryAmber" disabled={submitting}>
                {submitting ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <LoadingState message="Loading coupons..." />
      ) : coupons.length === 0 ? (
        <EmptyState message='No coupons yet. Click "Add Coupon" to create one.' />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Discount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Min Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Usage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Validity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {coupons.map((coupon) => {
                const now = new Date();
                const expired = coupon.endDate && new Date(coupon.endDate) < now;
                const notStarted = coupon.startDate && new Date(coupon.startDate) > now;
                return (
                  <tr key={coupon._id}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-semibold text-slate-900">
                      {coupon.code}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                      {coupon.discountType === "percentage"
                        ? `${coupon.discountValue}%`
                        : `${coupon.discountValue} flat`}
                      {coupon.discountType === "percentage" &&
                        coupon.maxDiscount !== undefined &&
                        coupon.maxDiscount > 0 && (
                          <span className="ml-1 text-xs text-slate-400">
                            (max {coupon.maxDiscount})
                          </span>
                        )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                      {coupon.minOrderAmount ? coupon.minOrderAmount : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                      {coupon.usedCount || 0}
                      {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " / ∞"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {coupon.startDate
                        ? new Date(coupon.startDate).toLocaleDateString()
                        : "—"}{" "}
                      →{" "}
                      {coupon.endDate
                        ? new Date(coupon.endDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge
                        variant={
                          !coupon.isActive ? "neutral" : expired ? "danger" : notStarted ? "warning" : "success"
                        }
                      >
                        {!coupon.isActive ? "Inactive" : expired ? "Expired" : notStarted ? "Scheduled" : "Active"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Button type="button" variant="link" onClick={() => handleEdit(coupon)} className="mr-2 text-amber-600">
                        Edit
                      </Button>
                      <Button type="button" variant="linkRed" onClick={() => handleDelete(coupon._id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
