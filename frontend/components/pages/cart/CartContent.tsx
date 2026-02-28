"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";
import { PageLayout, LoadingState, EmptyState, Button } from "@/components/ui";
import { CartItemList } from "./CartItemList";
import { CartSummary } from "./CartSummary";

export function CartContent() {
  const { items, loading, updateQuantity, removeFromCart } = useCart();
  const { formatCurrency, taxEnabled, defaultTaxPercentage, shippingEnabled } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <PageLayout withLayout={false}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold text-slate-900">Shopping Cart</h1>

        {loading ? (
          <LoadingState message="Loading cart..." />
        ) : items.length === 0 ? (
          <EmptyState
            message="Your cart is empty"
            action={
              <Button as="link" href="/shop" variant="primary">
                Continue Shopping
              </Button>
            }
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CartItemList
                items={items}
                formatCurrency={formatCurrency}
                onUpdateQty={updateQuantity}
                onRemove={removeFromCart}
              />
            </div>
            <div className="lg:col-span-1">
              <CartSummary
                items={items}
                formatCurrency={formatCurrency}
                taxEnabled={taxEnabled}
                defaultTaxPercentage={defaultTaxPercentage}
                shippingEnabled={shippingEnabled}
              />
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
