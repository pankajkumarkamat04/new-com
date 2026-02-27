"use client";

import Link from "next/link";
import type { Product, ProductVariation } from "@/lib/types";
import PriceDisplay from "@/components/shared/PriceDisplay";
import { Button, Badge } from "@/components/ui";

type ProductDetailInfoProps = {
  product: Product;
  selectedVariation: ProductVariation | null;
  selectedAttributes: Record<string, string>;
  effectivePrice: number;
  effectiveStock: number;
  isInCart: boolean;
  formatCurrency: (n: number) => string;
  onSelectAttribute: (attrName: string, term: string) => void;
  onAddToCart: () => void;
  onRemoveFromCart: () => void;
};

export default function ProductDetailInfo({
  product,
  selectedVariation,
  selectedAttributes,
  effectivePrice,
  effectiveStock,
  isInCart,
  formatCurrency,
  onSelectAttribute,
  onAddToCart,
  onRemoveFromCart,
}: ProductDetailInfoProps) {
  const hasAttributes = Array.isArray(product.attributes) && product.attributes.length > 0;
  const originalPrice =
    selectedVariation?.price && selectedVariation.discountedPrice && selectedVariation.discountedPrice < selectedVariation.price
      ? selectedVariation.price
      : product.discountedPrice && product.discountedPrice < product.price
        ? product.price
        : undefined;

  return (
    <div>
      {product.category && (
        <Link
          href={`/shop?category=${encodeURIComponent(product.category)}`}
          className="text-sm font-medium uppercase text-emerald-600 hover:text-emerald-500"
        >
          {product.category}
        </Link>
      )}
      <h1 className="mt-2 text-3xl font-bold text-slate-900">{product.name}</h1>
      <div className="mt-4">
        <PriceDisplay
          price={effectivePrice}
          originalPrice={originalPrice}
          formatCurrency={formatCurrency}
          size="lg"
        />
      </div>

      {hasAttributes && (
        <div className="mt-4 space-y-3">
          {product.attributes!.map((attr) => (
            <div key={attr.name}>
              <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                {attr.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {attr.terms.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => onSelectAttribute(attr.name, term)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      selectedAttributes[attr.name] === term
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-300 bg-white text-slate-700 hover:border-emerald-500"
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>
              {selectedVariation && (
                <p className="mt-2 text-xs text-slate-500">
                  Selected: <span className="font-medium text-slate-700">{selectedVariation.name}</span>
                  {selectedVariation.stock !== undefined && (
                    <span className="ml-2">&middot; Stock: {selectedVariation.stock}</span>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {product.description && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Description</h2>
          <div
            className="product-description mt-2 text-slate-600 [&_ul]:list-inside [&_ul]:list-disc [&_ol]:list-inside [&_ol]:list-decimal [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-medium [&_a]:text-amber-600 [&_a]:underline [&_a:hover]:text-amber-700"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      <div className="mt-6 flex items-center gap-4">
        <Badge variant={effectiveStock > 0 ? "success" : "neutral"}>
          {effectiveStock > 0 ? `In stock (${effectiveStock})` : "Out of stock"}
        </Badge>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        {isInCart ? (
          <Button variant="danger" onClick={onRemoveFromCart}>
            Remove from Cart
          </Button>
        ) : (
          <Button variant="primary" onClick={onAddToCart} className="rounded-xl px-8 py-4">
            Add to Cart
          </Button>
        )}
        <Button as="link" href="/shop" variant="outline">
          Continue Shopping
        </Button>
        <Button as="link" href="/cart" variant="outlineEmerald">
          View Cart
        </Button>
      </div>
    </div>
  );
}
