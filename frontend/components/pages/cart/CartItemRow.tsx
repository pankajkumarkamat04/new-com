"use client";

import { getMediaUrl } from "@/lib/api";
import ImagePlaceholder from "@/components/shared/ImagePlaceholder";
import type { CartItem } from "@/lib/types";

type CartItemRowProps = {
  item: CartItem;
  formatCurrency: (n: number) => string;
  onUpdateQty: (productId: string, qty: number, variationName?: string) => void;
  onRemove: (productId: string, variationName?: string) => void;
};

export function CartItemRow({
  item,
  formatCurrency,
  onUpdateQty,
  onRemove,
}: CartItemRowProps) {
  const product = item.product;
  const baseName = product?.name || "Product";
  const variationName = item.variationName || "";
  const name = variationName ? `${baseName} - ${variationName}` : baseName;
  const price = item.price ?? product?.price ?? 0;
  const image = product?.image;
  const subtotal = price * item.quantity;

  return (
    <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {image ? (
          <img src={getMediaUrl(image)} alt={name} className="h-full w-full object-cover" />
        ) : (
          <ImagePlaceholder className="h-full w-full" iconClassName="h-10 w-10" />
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
                onUpdateQty(item.productId, Math.max(1, item.quantity - 1), variationName || undefined)
              }
              className="px-3 py-1 text-slate-600 hover:bg-slate-100"
            >
              −
            </button>
            <span className="min-w-[2rem] px-2 py-1 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onUpdateQty(item.productId, item.quantity + 1, variationName || undefined)}
              className="px-3 py-1 text-slate-600 hover:bg-slate-100"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.productId, variationName || undefined)}
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
}
