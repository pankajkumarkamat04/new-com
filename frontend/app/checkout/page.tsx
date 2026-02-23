"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";
import { ordersApi } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, loading, refreshCart } = useCart();
  const { checkoutSettings, paymentMethods, formatCurrency } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
  });
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  const isLoggedIn = mounted && typeof window !== "undefined" && !!localStorage.getItem("token") && localStorage.getItem("userType") === "user";
  const total = items.reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethods.some((m) => m.id === paymentMethod)) {
      setPaymentMethod(paymentMethods[0].id);
    }
  }, [paymentMethods, paymentMethod]);

  useEffect(() => {
    if (!mounted) return;
    if (isLoggedIn && !loading && items.length === 0 && !orderId) {
      router.replace("/cart");
    }
  }, [mounted, isLoggedIn, loading, items.length, orderId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const requiredErrors: string[] = [];

    const cfg = checkoutSettings;
    const shouldRequire = (fieldKey: keyof typeof form) =>
      (cfg as any)[fieldKey]?.enabled !== false && (cfg as any)[fieldKey]?.required !== false;

    (Object.keys(form) as (keyof typeof form)[]).forEach((key) => {
      if (shouldRequire(key) && !form[key].trim()) {
        requiredErrors.push(key);
      }
    });

    (checkoutSettings.customFields || [])
      .filter((f) => f.enabled !== false && f.required)
      .forEach((f) => {
        const v = customValues[f.key || ""];
        if (!v || !v.trim()) {
          requiredErrors.push(f.key || f.label || "custom");
        }
      });

    if (requiredErrors.length > 0) {
      setError("Please fill in all required shipping fields.");
      return;
    }
    const allowedIds = paymentMethods.map((m) => m.id);
    const chosen = allowedIds.includes(paymentMethod) ? paymentMethod : (allowedIds[0] || "cod");

    setSubmitting(true);
    const res = await ordersApi.placeOrder({
      shippingAddress: {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip: form.zip.trim(),
        phone: form.phone.trim(),
        customFields: (checkoutSettings.customFields || [])
          .filter((f) => f.enabled !== false && (f.key || f.label))
          .map((f) => ({
            key: f.key || f.label || "",
            label: f.label || f.key || "",
            value: (customValues[f.key || ""] || "").trim(),
          }))
          .filter((f) => f.value),
      },
      paymentMethod: chosen,
    });
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.data?.data?._id) {
      setOrderId(res.data.data._id);
      await refreshCart();
    }
  };

  if (!mounted) return null;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
            <h1 className="text-xl font-bold text-slate-900">Login to Checkout</h1>
            <p className="mt-2 text-slate-600">Please sign in to your account to place an order.</p>
            <Link
              href={`/user/login?redirect=${encodeURIComponent("/checkout")}`}
              className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-500"
            >
              Log In
            </Link>
            <Link href="/cart" className="mt-4 block text-sm text-slate-500 hover:underline">
              ← Back to Cart
            </Link>
          </div>
        </div>
        <Footer variant="light" />
      </div>
    );
  }

  if (orderId) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <h1 className="text-2xl font-bold text-emerald-800">Order Placed</h1>
            <p className="mt-2 text-emerald-700">Thank you for your order.</p>
            <p className="mt-2 text-sm text-slate-600">Order ID: {orderId}</p>
            <Link
              href="/user/orders"
              className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-500"
            >
              View My Orders
            </Link>
            <Link href="/shop" className="mt-4 block text-sm text-slate-500 hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>
        <Footer variant="light" />
      </div>
    );
  }

  if (loading || items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center text-slate-600">
            {loading ? "Loading..." : "Your cart is empty."}
            {!loading && <Link href="/cart" className="ml-2 text-emerald-600 hover:underline">Go to cart</Link>}
          </div>
        </div>
        <Footer variant="light" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold text-slate-900">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Shipping Address</h2>
              <div className="space-y-4">
                {checkoutSettings.name.enabled !== false && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      {checkoutSettings.name.label || "Full Name"}
                      {checkoutSettings.name.required !== false && <span> *</span>}
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required={checkoutSettings.name.required !== false}
                    />
                  </div>
                )}
                {checkoutSettings.address.enabled !== false && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      {checkoutSettings.address.label || "Address"}
                      {checkoutSettings.address.required !== false && <span> *</span>}
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required={checkoutSettings.address.required !== false}
                    />
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {checkoutSettings.city.enabled !== false && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">
                        {checkoutSettings.city.label || "City"}
                        {checkoutSettings.city.required !== false && <span> *</span>}
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required={checkoutSettings.city.required !== false}
                      />
                    </div>
                  )}
                  {checkoutSettings.state.enabled !== false && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">
                        {checkoutSettings.state.label || "State / Province"}
                        {checkoutSettings.state.required && <span> *</span>}
                      </label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required={!!checkoutSettings.state.required}
                      />
                    </div>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {checkoutSettings.zip.enabled !== false && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">
                        {checkoutSettings.zip.label || "ZIP / Postal Code"}
                        {checkoutSettings.zip.required !== false && <span> *</span>}
                      </label>
                      <input
                        type="text"
                        value={form.zip}
                        onChange={(e) => setForm({ ...form, zip: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required={checkoutSettings.zip.required !== false}
                      />
                    </div>
                  )}
                  {checkoutSettings.phone.enabled !== false && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">
                        {checkoutSettings.phone.label || "Phone"}
                        {checkoutSettings.phone.required !== false && <span> *</span>}
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required={checkoutSettings.phone.required !== false}
                      />
                    </div>
                  )}
                </div>
                {(checkoutSettings.customFields || [])
                  .filter((f) => f.enabled !== false)
                  .map((field) => (
                    <div key={field.key || field.label}>
                      <label className="mb-1 block text-sm font-medium text-slate-600">
                        {field.label || field.key || "Custom Field"}
                        {field.required && <span> *</span>}
                      </label>
                      <input
                        type="text"
                        value={customValues[field.key || ""] || ""}
                        onChange={(e) =>
                          setCustomValues((prev) => ({
                            ...prev,
                            [field.key || ""]: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required={!!field.required}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6 rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div>
                <h2 className="mb-3 text-lg font-semibold text-slate-900">Payment method</h2>
                <div className="space-y-2">
                  {paymentMethods.map((m) => (
                    <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={m.id}
                        checked={paymentMethod === m.id}
                        onChange={() => setPaymentMethod(m.id)}
                        className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-medium text-slate-900">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Order Summary</h2>
                <ul className="space-y-2 border-b border-slate-200 pb-4">
                  {items.map((item) => (
                    <li key={item.productId} className="flex justify-between text-sm">
                      <span className="text-slate-700">
                        {item.product?.name || "Product"} × {item.quantity}
                      </span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency((item.product?.price ?? 0) * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xl font-bold text-slate-900">Total: {formatCurrency(total)}</p>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {submitting ? "Placing Order..." : `Place Order (${itemCount} item${itemCount !== 1 ? "s" : ""})`}
              </button>
              <Link
                href="/cart"
                className="mt-4 block w-full rounded-lg border border-slate-300 bg-white py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Back to Cart
              </Link>
            </div>
          </div>
        </form>
      </div>

      <Footer variant="light" />
    </div>
  );
}
