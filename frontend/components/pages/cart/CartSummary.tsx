"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { computeItemTax } from "./cartUtils";
import type { CartItem } from "@/lib/types";

type CartSummaryProps = {
  items: CartItem[];
  formatCurrency: (n: number) => string;
  taxEnabled: boolean;
  defaultTaxPercentage: number;
  shippingEnabled: boolean;
};

export function CartSummary({
  items,
  formatCurrency,
  taxEnabled,
  defaultTaxPercentage,
  shippingEnabled,
}: CartSummaryProps) {
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
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="sticky top-24 rounded-xl border border-slate-200 bg-slate-50 p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Order Summary</h2>
      <p className="mb-4 text-slate-600">{itemCount} item(s)</p>
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
        <p className="pt-2 text-xl font-bold text-slate-900">Total: {formatCurrency(total)}</p>
      </div>
      <Link
        href="/checkout"
        className="mt-6 block w-full rounded-lg bg-emerald-600 py-3 text-center font-semibold text-white transition hover:bg-emerald-500"
      >
        Proceed to Checkout
      </Link>
      <Button as="link" href="/shop" variant="fullSecondary" className="mt-4">
        Continue Shopping
      </Button>
    </div>
  );
}
