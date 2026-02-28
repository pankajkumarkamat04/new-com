"use client";

import type { CartItem } from "@/lib/types";
import { CartItemRow } from "./CartItemRow";

type CartItemListProps = {
  items: CartItem[];
  formatCurrency: (n: number) => string;
  onUpdateQty: (productId: string, qty: number, variationName?: string) => void;
  onRemove: (productId: string, variationName?: string) => void;
};

export function CartItemList({
  items,
  formatCurrency,
  onUpdateQty,
  onRemove,
}: CartItemListProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <CartItemRow
          key={`${item.productId}::${item.variationName || ""}`}
          item={item}
          formatCurrency={formatCurrency}
          onUpdateQty={onUpdateQty}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
