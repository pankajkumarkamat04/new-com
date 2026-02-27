"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getMediaUrl } from "@/lib/api";

function computeItemTax(
  price: number,
  qty: number,
  productTax: { taxType?: string; value?: number } | undefined,
  defaultPct: number
): number {
  const useCustom = productTax && (productTax.value ?? 0) > 0;
  const type = useCustom ? (productTax!.taxType || "percentage") : "percentage";
  const val = useCustom ? (productTax!.value || 0) : defaultPct;
  const lineTotal = price * qty;
  if (type === "percentage") return (lineTotal * val) / 100;
  return val * qty;
}

export default function CartPage() {
  const { items, loading, updateQuantity, removeFromCart } = useCart();
  const { formatCurrency, taxEnabled, defaultTaxPercentage, shippingEnabled } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold text-slate-900">Shopping Cart</h1>

        {loading ? (
          <div className="py-16 text-center text-slate-600">Loading cart...</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-20">
            <p className="text-slate-600">Your cart is empty</p>
            <Link
              href="/shop"
              className="mt-6 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-500"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {items.map((item) => {
                  const product = item.product;
                  const baseName = product?.name || "Product";
                  const variationName = item.variationName || "";
                  const name = variationName ? `${baseName} - ${variationName}` : baseName;
                  const price = item.price ?? product?.price ?? 0;
                  const image = product?.image;
                  const subtotal = price * item.quantity;

                  return (
                    <div
                      key={`${item.productId}::${variationName}`}
                      className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {image ? (
                          <img src={getMediaUrl(image)} alt={name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900">{name}</h3>
                        {item.variationAttributes && item.variationAttributes.length > 0 && (
                          <p className="mt-1 text-xs text-slate-500">
                            {item.variationAttributes
                              .map((a) => (a.name && a.value ? `${a.name}: ${a.value}` : ""))
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                        <p className="mt-1 text-lg font-bold text-emerald-600">{formatCurrency(price)}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex items-center rounded-lg border border-slate-300">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  Math.max(1, item.quantity - 1),
                                  variationName || undefined
                                )
                              }
                              className="px-3 py-1 text-slate-600 hover:bg-slate-100"
                            >
                              −
                            </button>
                            <span className="min-w-[2rem] px-2 py-1 text-center text-sm">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity + 1, variationName || undefined)
                              }
                              className="px-3 py-1 text-slate-600 hover:bg-slate-100"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId, variationName || undefined)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatCurrency(subtotal)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Order Summary</h2>
                <p className="mb-4 text-slate-600">
                  {items.reduce((sum, i) => sum + i.quantity, 0)} item(s)
                </p>
                {(() => {
                  const subtotal = items.reduce(
                    (sum, i) => sum + (i.price ?? i.product?.price ?? 0) * i.quantity,
                    0
                  );
                  const tax = taxEnabled
                    ? items.reduce((sum, i) => {
                        const p = i.price ?? i.product?.price ?? 0;
                        return sum + computeItemTax(p, i.quantity, i.product?.tax, defaultTaxPercentage);
                      }, 0)
                    : 0;
                  const total = subtotal + tax;
                  return (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      {taxEnabled && tax > 0 && (
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>Tax</span>
                          <span>{formatCurrency(tax)}</span>
                        </div>
                      )}
                      {shippingEnabled && (
                        <p className="text-sm text-slate-500">Shipping will be calculated after entering address</p>
                      )}
                      <p className="pt-2 text-xl font-bold text-slate-900">
                        Total: {formatCurrency(total)}
                      </p>
                    </div>
                  );
                })()}
                <Link
                  href="/checkout"
                  className="mt-6 block w-full rounded-lg bg-emerald-600 py-3 text-center font-semibold text-white transition hover:bg-emerald-500"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  href="/shop"
                  className="mt-4 block w-full rounded-lg border border-slate-300 bg-white py-3 text-center font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
