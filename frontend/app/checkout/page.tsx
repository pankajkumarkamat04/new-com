"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";
import { ordersApi, couponApi, shippingApi } from "@/lib/api";
import type { ShippingOption } from "@/lib/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const COUNTRY_OPTIONS: { code: string; name: string }[] = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "SG", name: "Singapore" },
  { code: "MY", name: "Malaysia" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "NP", name: "Nepal" },
  { code: "LK", name: "Sri Lanka" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "HK", name: "Hong Kong" },
  { code: "NZ", name: "New Zealand" },
  { code: "ZA", name: "South Africa" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "PL", name: "Poland" },
  { code: "TH", name: "Thailand" },
  { code: "ID", name: "Indonesia" },
  { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" },
  { code: "KE", name: "Kenya" },
  { code: "NG", name: "Nigeria" },
  { code: "EG", name: "Egypt" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, loading, refreshCart } = useCart();
  const { checkoutSettings, paymentMethods, formatCurrency, couponEnabled, taxEnabled, defaultTaxPercentage, shippingEnabled } = useSettings();
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
    country: "IN",
  });
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    discountType: string;
    discountValue: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<{ methods: ShippingOption[]; zoneMatched?: boolean; message?: string; useZeroShipping?: boolean } | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<{ methodId: string; name: string; amount: number } | null>(null);

  const isLoggedIn = mounted && typeof window !== "undefined" && !!localStorage.getItem("token") && localStorage.getItem("userType") === "user";
  const subtotal = items.reduce(
    (sum, i) => sum + (i.price ?? i.product?.price ?? 0) * i.quantity,
    0
  );
  const taxAmount = taxEnabled
    ? items.reduce((sum, i) => {
        const p = i.price ?? i.product?.price ?? 0;
        const prod = i.product as { tax?: { taxType?: string; value?: number } } | undefined;
        const useCustom = prod?.tax && (prod.tax.value ?? 0) > 0;
        const type = useCustom ? (prod!.tax!.taxType || "percentage") : "percentage";
        const val = useCustom ? (prod!.tax!.value || 0) : defaultTaxPercentage;
        const lineTotal = p * i.quantity;
        if (type === "percentage") return sum + (lineTotal * val) / 100;
        return sum + (val * i.quantity);
      }, 0)
    : 0;
  const discount = appliedCoupon?.discount ?? 0;
  const shippingAmount = selectedShipping?.amount ?? 0;
  const total = Math.max(0, subtotal - discount + taxAmount + shippingAmount);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const handleApplyCoupon = async () => {
    setCouponError("");
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    const res = await couponApi.validate(couponCode.trim(), subtotal);
    setApplyingCoupon(false);
    if (res.error) {
      setCouponError(res.error);
      setAppliedCoupon(null);
    } else if (res.data?.data) {
      setAppliedCoupon(res.data.data);
      setCouponError("");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setForm((prev) => ({ ...prev, state: "" }));
  }, [form.country]);

  useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethods.some((m) => m.id === paymentMethod)) {
      setPaymentMethod(paymentMethods[0].id);
    }
  }, [paymentMethods, paymentMethod]);

  // Fetch shipping options when address has zip/country and shipping is enabled
  useEffect(() => {
    if (!shippingEnabled || !form.zip?.trim() || !form.country?.trim()) {
      setShippingOptions(null);
      setSelectedShipping(null);
      return;
    }
    setShippingLoading(true);
    shippingApi
      .getOptions({
        country: form.country.trim(),
        state: form.state.trim(),
        zip: form.zip.trim(),
        subtotal,
        itemCount,
      })
      .then((res) => {
        setShippingLoading(false);
        if (res.data?.data) {
          const d = res.data.data;
          if (d.enabled && d.methods && d.methods.length > 0) {
            setShippingOptions({ methods: d.methods, zoneMatched: d.zoneMatched });
            const first = d.methods[0];
            setSelectedShipping((prev) => {
              const stillValid = prev && d.methods.some((m) => m._id === prev.methodId);
              return stillValid ? prev : { methodId: first._id, name: first.name, amount: first.amount };
            });
          } else {
            // No zone or no methods: use 0 shipping (free)
            setShippingOptions({
              methods: [],
              zoneMatched: d.zoneMatched,
              message: d.message,
              useZeroShipping: d.useZeroShipping,
            });
            setSelectedShipping({ methodId: "", name: "Free Shipping", amount: 0 });
          }
        } else {
          setShippingOptions(null);
          setSelectedShipping(null);
        }
      })
      .catch(() => {
        setShippingLoading(false);
        setShippingOptions(null);
        setSelectedShipping(null);
      });
  }, [shippingEnabled, form.country, form.state, form.zip, subtotal, itemCount]);

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
    if (shippingEnabled && !selectedShipping) {
      setError("Please enter your address to see shipping options.");
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
        country: form.country.trim() || "IN",
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
      ...(appliedCoupon && { couponCode: appliedCoupon.code }),
      ...(shippingEnabled && selectedShipping && {
        ...(selectedShipping.methodId && { shippingMethodId: selectedShipping.methodId }),
        shippingAmount: selectedShipping.amount,
      }),
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
        <Footer />
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
        <Footer />
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
        <Footer />
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
                      {form.country === "IN" ? (
                        <select
                          value={form.state}
                          onChange={(e) => setForm({ ...form, state: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          required={!!checkoutSettings.state.required}
                        >
                          <option value="">Select state</option>
                          {INDIAN_STATES.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={form.state}
                          onChange={(e) => setForm({ ...form, state: e.target.value })}
                          placeholder="State / Province"
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          required={!!checkoutSettings.state.required}
                        />
                      )}
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
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">Country</label>
                    <select
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
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
              {shippingEnabled && (
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-slate-900">Shipping method</h2>
                  <p className="mb-3 text-sm text-slate-500">Shipping will be calculated after entering address.</p>
                  {shippingLoading ? (
                    <p className="text-sm text-slate-500">Loading options...</p>
                  ) : !form.zip?.trim() ? (
                    <p className="text-sm text-slate-500">Enter your ZIP and country above to see shipping options.</p>
                  ) : shippingOptions?.useZeroShipping || (shippingOptions?.message && !shippingOptions?.methods?.length) ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">Free Shipping</p>
                      {shippingOptions?.message && (
                        <p className="mt-0.5 text-xs text-slate-500">{shippingOptions.message}</p>
                      )}
                      <p className="mt-1 text-sm text-emerald-600">{formatCurrency(0)}</p>
                    </div>
                  ) : shippingOptions?.methods?.length ? (
                    <div className="space-y-2">
                      {shippingOptions.methods.map((m) => (
                        <label
                          key={m._id}
                          className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shippingMethod"
                              checked={selectedShipping?.methodId === m._id}
                              onChange={() => setSelectedShipping({ methodId: m._id, name: m.name, amount: m.amount })}
                              className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-slate-900">{m.name}</span>
                          </div>
                          <span className="text-sm font-medium text-slate-900">{formatCurrency(m.amount)}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Order Summary</h2>
                <ul className="space-y-2 border-b border-slate-200 pb-4">
                  {items.map((item) => {
                    const baseName = item.product?.name || "Product";
                    const variationName = item.variationName || "";
                    const displayName = variationName
                      ? `${baseName} - ${variationName}`
                      : baseName;
                    const price = item.price ?? item.product?.price ?? 0;
                    return (
                      <li
                        key={`${item.productId}::${variationName}`}
                        className="flex flex-col gap-0.5"
                      >
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-700">
                            {displayName} × {item.quantity}
                          </span>
                          <span className="font-medium text-slate-900">
                            {formatCurrency(price * item.quantity)}
                          </span>
                        </div>
                        {item.variationAttributes &&
                          item.variationAttributes.length > 0 && (
                            <p className="text-xs text-slate-500">
                              {item.variationAttributes
                                .map(
                                  (a) =>
                                    a.name && a.value
                                      ? `${a.name}: ${a.value}`
                                      : ""
                                )
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                      </li>
                    );
                  })}
                </ul>

                {couponEnabled && (
                  <div className="mt-4 border-b border-slate-200 pb-4">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                        <div>
                          <span className="text-sm font-medium text-emerald-800">
                            {appliedCoupon.code}
                          </span>
                          <span className="ml-2 text-xs text-emerald-600">
                            {appliedCoupon.discountType === "percentage"
                              ? `${appliedCoupon.discountValue}% off`
                              : `${formatCurrency(appliedCoupon.discountValue)} off`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-600">
                          Coupon Code
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value.toUpperCase());
                              setCouponError("");
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleApplyCoupon();
                              }
                            }}
                            placeholder="Enter code"
                            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm uppercase text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={applyingCoupon || !couponCode.trim()}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                          >
                            {applyingCoupon ? "..." : "Apply"}
                          </button>
                        </div>
                        {couponError && (
                          <p className="mt-1 text-xs text-red-600">{couponError}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {taxEnabled && taxAmount > 0 && (
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Tax</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  {shippingEnabled && selectedShipping && (
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Shipping ({selectedShipping.name})</span>
                      <span>{formatCurrency(selectedShipping.amount)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <p className="pt-2 text-xl font-bold text-slate-900">
                    Total: {formatCurrency(total)}
                  </p>
                </div>
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

      <Footer />
    </div>
  );
}
