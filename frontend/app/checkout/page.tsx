"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";
import { ordersApi, couponApi, shippingApi, paymentApi, addressApi } from "@/lib/api";
import type { ShippingOption } from "@/lib/types";
import type { Address } from "@/lib/types";
import { PageLayout, Card, Button, Input, Label } from "@/components/ui";
import { COUNTRY_OPTIONS, INDIAN_STATES } from "@/lib/addressConstants";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, loading, refreshCart } = useCart();
  const { checkoutSettings, paymentMethods, paymentSettings, formatCurrency, couponEnabled, taxEnabled, defaultTaxPercentage, shippingEnabled } = useSettings();
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
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveAddressForLater, setSaveAddressForLater] = useState(false);

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
  const allowedIds = paymentMethods.map((m) => m.id);
  const allowedChosen = allowedIds.includes(paymentMethod) ? paymentMethod : (paymentMethods[0]?.id || "cod");

  const buildShippingAddress = () => ({
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
  });

  const saveAddressIfRequested = async () => {
    if (!saveAddressForLater || !form.name.trim() || !form.address.trim() || !form.city.trim() || !form.zip.trim() || !form.phone.trim()) return;
    const customFields = (checkoutSettings.customFields || [])
      .filter((f) => f.enabled !== false && (f.key || f.label))
      .map((f) => ({
        key: f.key || f.label || "",
        label: f.label || f.key || "",
        value: (customValues[f.key || ""] || "").trim(),
      }))
      .filter((f) => f.value);
    await addressApi.create({
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim() || undefined,
      zip: form.zip.trim(),
      phone: form.phone.trim(),
      country: form.country.trim() || "IN",
      customFields: customFields.length ? customFields : undefined,
      isDefault: savedAddresses.length === 0,
    });
  };

  const placeOrderPayload = (extra: { razorpayPayment?: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }; cashfreePayment?: { order_id: string } } = {}) => ({
    shippingAddress: buildShippingAddress(),
    paymentMethod: allowedChosen,
    ...(appliedCoupon && { couponCode: appliedCoupon.code }),
    ...(shippingEnabled && selectedShipping && {
      ...(selectedShipping.methodId && { shippingMethodId: selectedShipping.methodId }),
      shippingAmount: selectedShipping.amount,
    }),
    ...extra,
  });

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

  // When international shipping is disabled, lock country to default (defined early for use in effects)
  const internationalShippingEnabled = checkoutSettings.internationalShippingEnabled === true;
  const defaultCountry = (checkoutSettings.defaultCountry && checkoutSettings.defaultCountry.trim()) || "IN";

  // Load saved addresses when logged in
  useEffect(() => {
    if (!mounted || !isLoggedIn) return;
    addressApi.list().then((res) => {
      if (res.data?.data) {
        setSavedAddresses(res.data.data);
        const defaultAddr = res.data.data.find((a) => a.isDefault) ?? res.data.data[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id);
          setForm({
            name: defaultAddr.name,
            address: defaultAddr.address,
            city: defaultAddr.city,
            state: defaultAddr.state ?? "",
            zip: defaultAddr.zip,
            phone: defaultAddr.phone,
            country: internationalShippingEnabled ? (defaultAddr.country ?? "IN") : defaultCountry,
          });
        }
      }
    });
  }, [mounted, isLoggedIn, internationalShippingEnabled, defaultCountry]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, state: "" }));
  }, [form.country]);

  useEffect(() => {
    if (!internationalShippingEnabled && defaultCountry) {
      setForm((prev) => (prev.country !== defaultCountry ? { ...prev, country: defaultCountry } : prev));
    }
  }, [internationalShippingEnabled, defaultCountry]);

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
    const chosen = allowedChosen;
    const currency = paymentSettings?.currency || "INR";

    if (chosen === "cod") {
      setSubmitting(true);
      const res = await ordersApi.placeOrder(placeOrderPayload());
      setSubmitting(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.data?.data?._id) {
        setOrderId(res.data.data._id);
        await refreshCart();
        await saveAddressIfRequested();
      }
      return;
    }

    if (chosen === "razorpay") {
      setSubmitting(true);
      try {
        const createRes = await paymentApi.createRazorpayOrder({ amount: total, currency });
        if (createRes.error || !createRes.data?.data) {
          setError(createRes.error || "Failed to create payment.");
          setSubmitting(false);
          return;
        }
        const { orderId: rpOrderId, keyId } = createRes.data.data;
        const loadScript = (src: string) =>
          new Promise<void>((resolve, reject) => {
            if (typeof document === "undefined") {
              resolve();
              return;
            }
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
              resolve();
              return;
            }
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Razorpay script failed to load"));
            document.body.appendChild(script);
          });
        await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        const Razorpay = (window as unknown as {
          Razorpay: new (options: {
            key: string;
            order_id: string;
            amount: number;
            currency: string;
            name?: string;
            handler: (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
          }) => { on: (event: string, cb: () => void) => void; open: () => void };
        }).Razorpay;
        if (!Razorpay) {
          setError("Razorpay failed to load.");
          setSubmitting(false);
          return;
        }
        const rzp = new Razorpay({
          key: keyId,
          order_id: rpOrderId,
          amount: createRes.data.data.amountInPaise,
          currency,
          name: "Checkout",
          handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            const placeRes = await ordersApi.placeOrder(
              placeOrderPayload({
                razorpayPayment: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                },
              })
            );
            setSubmitting(false);
            if (placeRes.error) {
              setError(placeRes.error);
              return;
            }
            if (placeRes.data?.data?._id) {
              setOrderId(placeRes.data.data._id);
              refreshCart();
              saveAddressIfRequested();
            }
          },
        });
        rzp.on("payment.failed", () => {
          setSubmitting(false);
          setError("Payment failed or was cancelled.");
        });
        rzp.open();
      } catch (err) {
        setSubmitting(false);
        setError(err instanceof Error ? err.message : "Payment failed.");
      }
      return;
    }

    if (chosen === "cashfree") {
      setSubmitting(true);
      try {
        const cfOrderId = `cf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const returnUrl = `${origin}/checkout/success?cf_order_id={order_id}`;
        const sessionRes = await paymentApi.createCashfreeSession({
          orderId: cfOrderId,
          amount: total,
          currency,
          customerDetails: {
            customer_name: form.name.trim(),
            customer_phone: form.phone.trim(),
            customer_email: "",
          },
          returnUrl,
        });
        if (sessionRes.error || !sessionRes.data?.data) {
          setError(sessionRes.error || "Failed to create Cashfree session.");
          setSubmitting(false);
          return;
        }
        const { paymentSessionId } = sessionRes.data.data;
        const payload = { ...placeOrderPayload({ cashfreePayment: { order_id: sessionRes.data.data.orderId } }), saveAddressForLater };
        try {
          sessionStorage.setItem("checkout_cashfree_payload", JSON.stringify(payload));
        } catch (_) {}
        const loadCashfree = (): Promise<{ checkout: (opts: { paymentSessionId: string; redirectTarget: string }) => void }> =>
          new Promise((resolve, reject) => {
            if (typeof document === "undefined") {
              reject(new Error("No document"));
              return;
            }
            const existing = (window as unknown as { Cashfree?: { checkout?: (opts: unknown) => void } }).Cashfree;
            if (existing?.checkout) {
              resolve(existing as { checkout: (opts: { paymentSessionId: string; redirectTarget: string }) => void });
              return;
            }
            const script = document.createElement("script");
            script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
            script.async = true;
            script.onload = () => {
              const CashfreeFn = (window as unknown as { Cashfree: (opts: { mode: string }) => { checkout: (opts: { paymentSessionId: string; redirectTarget: string }) => void } }).Cashfree;
              const mode = (paymentSettings as { cashfree?: { env?: string } })?.cashfree?.env === "production" ? "production" : "sandbox";
              resolve(CashfreeFn({ mode }));
            };
            script.onerror = () => reject(new Error("Cashfree SDK failed to load"));
            document.body.appendChild(script);
          });
        const cashfree = await loadCashfree();
        cashfree.checkout({ paymentSessionId, redirectTarget: "_self" });
        setSubmitting(false);
      } catch (err) {
        setSubmitting(false);
        setError(err instanceof Error ? err.message : "Cashfree checkout failed.");
      }
      return;
    }

    setSubmitting(true);
    const res = await ordersApi.placeOrder(placeOrderPayload());
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
      <PageLayout>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Card padding="large" className="mx-auto max-w-md text-center bg-slate-50">
            <h1 className="text-xl font-bold text-slate-900">Login to Checkout</h1>
            <p className="mt-2 text-slate-600">Please sign in to your account to place an order.</p>
            <Button as="link" href={`/user/login?redirect=${encodeURIComponent("/checkout")}`} variant="primary" className="mt-6">
              Log In
            </Button>
            <Link href="/cart" className="mt-4 block text-sm text-slate-500 hover:underline">
              ← Back to Cart
            </Link>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (orderId) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Card padding="large" className="mx-auto max-w-md border-emerald-200 bg-emerald-50 text-center">
            <h1 className="text-2xl font-bold text-emerald-800">Order Placed</h1>
            <p className="mt-2 text-emerald-700">Thank you for your order.</p>
            <p className="mt-2 text-sm text-slate-600">Order ID: {orderId}</p>
            <Button as="link" href="/user/orders" variant="primary" className="mt-6">
              View My Orders
            </Button>
            <Link href="/shop" className="mt-4 block text-sm text-slate-500 hover:underline">
              Continue Shopping
            </Link>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (loading || items.length === 0) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center text-slate-600">
            {loading ? "Loading..." : "Your cart is empty."}
            {!loading && <Link href="/cart" className="ml-2 text-emerald-600 hover:underline">Go to cart</Link>}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold text-slate-900">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {savedAddresses.length > 0 && (
              <Card>
                <h2 className="mb-3 text-lg font-semibold text-slate-900">Saved addresses</h2>
                <p className="mb-4 text-sm text-slate-500">Choose a saved address or enter a new one below.</p>
                <div className="space-y-2">
                  {savedAddresses.map((a) => (
                    <label
                      key={a._id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition ${
                        selectedAddressId === a._id ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        value={a._id}
                        checked={selectedAddressId === a._id}
                        onChange={() => {
                          setSelectedAddressId(a._id);
                          setForm({
                            name: a.name,
                            address: a.address,
                            city: a.city,
                            state: a.state ?? "",
                            zip: a.zip,
                            phone: a.phone,
                            country: internationalShippingEnabled ? (a.country ?? "IN") : defaultCountry,
                          });
                        }}
                        className="mt-1 h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1 text-sm">
                        {a.label && <span className="font-medium text-slate-500">{a.label} · </span>}
                        <span className="font-medium text-slate-900">{a.name}</span>
                        <p className="text-slate-600">{a.address}, {a.city}{a.state ? `, ${a.state}` : ""} {a.zip}</p>
                        <p className="text-slate-500">{a.phone}</p>
                      </div>
                      {a.isDefault && (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Default</span>
                      )}
                    </label>
                  ))}
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 transition hover:bg-slate-50">
                    <input
                      type="radio"
                      name="savedAddress"
                      value=""
                      checked={selectedAddressId === null}
                      onChange={() => {
                        setSelectedAddressId(null);
                        setForm({ name: "", address: "", city: "", state: "", zip: "", phone: "", country: defaultCountry });
                      }}
                      className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-900">Use new address</span>
                  </label>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  <Link href="/user/addresses" className="text-emerald-600 hover:underline">Manage addresses</Link>
                </p>
              </Card>
            )}
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Shipping Address</h2>
              <div className="space-y-4">
                {checkoutSettings.name.enabled !== false && (
                  <div>
                    <Label required={checkoutSettings.name.required !== false}>
                      {checkoutSettings.name.label || "Full Name"}
                    </Label>
                    <Input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required={checkoutSettings.name.required !== false}
                    />
                  </div>
                )}
                {checkoutSettings.address.enabled !== false && (
                  <div>
                    <Label required={checkoutSettings.address.required !== false}>
                      {checkoutSettings.address.label || "Address"}
                    </Label>
                    <Input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      required={checkoutSettings.address.required !== false}
                    />
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {checkoutSettings.city.enabled !== false && (
                    <div>
                      <Label required={checkoutSettings.city.required !== false}>
                        {checkoutSettings.city.label || "City"}
                      </Label>
                      <Input
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        required={checkoutSettings.city.required !== false}
                      />
                    </div>
                  )}
                  {checkoutSettings.state.enabled !== false && (
                    <div>
                      <Label required={!!checkoutSettings.state.required}>
                        {checkoutSettings.state.label || "State / Province"}
                      </Label>
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
                        <Input
                          type="text"
                          value={form.state}
                          onChange={(e) => setForm({ ...form, state: e.target.value })}
                          placeholder="State / Province"
                          required={!!checkoutSettings.state.required}
                        />
                      )}
                    </div>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {checkoutSettings.zip.enabled !== false && (
                    <div>
                      <Label required={checkoutSettings.zip.required !== false}>
                        {checkoutSettings.zip.label || "ZIP / Postal Code"}
                      </Label>
                      <Input
                        type="text"
                        value={form.zip}
                        onChange={(e) => setForm({ ...form, zip: e.target.value })}
                        required={checkoutSettings.zip.required !== false}
                      />
                    </div>
                  )}
                  <div>
                    <Label>Country</Label>
                    {internationalShippingEnabled ? (
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
                    ) : (
                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                        {COUNTRY_OPTIONS.find((c) => c.code === (form.country || defaultCountry))?.name ?? form.country ?? defaultCountry}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {checkoutSettings.phone.enabled !== false && (
                    <div>
                      <Label required={checkoutSettings.phone.required !== false}>
                        {checkoutSettings.phone.label || "Phone"}
                      </Label>
                      <Input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        required={checkoutSettings.phone.required !== false}
                      />
                    </div>
                  )}
                </div>
                {isLoggedIn && (
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={saveAddressForLater}
                      onChange={(e) => setSaveAddressForLater(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700">Save this address for next time</span>
                  </label>
                )}
                {(checkoutSettings.customFields || [])
                  .filter((f) => f.enabled !== false)
                  .map((field) => (
                    <div key={field.key || field.label}>
                      <Label required={!!field.required}>
                        {field.label || field.key || "Custom Field"}
                      </Label>
                      <Input
                        type="text"
                        value={customValues[field.key || ""] || ""}
                        onChange={(e) =>
                          setCustomValues((prev) => ({
                            ...prev,
                            [field.key || ""]: e.target.value,
                          }))
                        }
                        required={!!field.required}
                      />
                    </div>
                  ))}
              </div>
            </Card>
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
                          <Input
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
                            className="flex-1 font-mono text-sm uppercase"
                          />
                          <Button
                            type="button"
                            variant="primary"
                            onClick={handleApplyCoupon}
                            disabled={applyingCoupon || !couponCode.trim()}
                            className="text-sm"
                          >
                            {applyingCoupon ? "..." : "Apply"}
                          </Button>
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
              <Button
                type="submit"
                variant="fullPrimary"
                disabled={submitting}
                className="mt-6"
              >
                {submitting ? "Placing Order..." : `Place Order (${itemCount} item${itemCount !== 1 ? "s" : ""})`}
              </Button>
              <Button as="link" href="/cart" variant="fullSecondary" className="mt-4">
                Back to Cart
              </Button>
            </div>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
