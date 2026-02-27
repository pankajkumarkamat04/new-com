"use client";

import Link from "next/link";
import { getMediaUrl } from "@/lib/api";
import type { Product } from "@/lib/types";
import ImagePlaceholder from "./ImagePlaceholder";
import PriceDisplay from "./PriceDisplay";

type ProductCardProps = {
  product: Product;
  formatCurrency: (n: number) => string;
  /** Optional: show "View Details" CTA (shop style). Default true. */
  showCta?: boolean;
  /** Optional: link href. If not provided, uses /product/[id]. */
  href?: string;
  /** Card class for layout variants (e.g. user products vs shop) */
  className?: string;
};

export default function ProductCard({
  product,
  formatCurrency,
  showCta = true,
  href,
  className = "",
}: ProductCardProps) {
  const linkHref = href ?? `/product/${product._id}`;
  const imageUrl = product.image || (product.images && product.images[0]);
  const displayPrice = product.discountedPrice && product.discountedPrice < product.price
    ? product.discountedPrice
    : product.price;
  const originalPrice = product.discountedPrice && product.discountedPrice < product.price
    ? product.price
    : undefined;

  return (
    <Link
      href={linkHref}
      className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg ${className}`.trim()}
    >
      {imageUrl ? (
        <img
          src={getMediaUrl(imageUrl)}
          alt={product.name}
          className="h-48 w-full object-cover transition group-hover:scale-105"
        />
      ) : (
        <div className="h-48 w-full">
          <ImagePlaceholder className="h-full w-full" iconClassName="h-16 w-16" />
        </div>
      )}
      <div className="p-5">
        <p className="text-xs font-medium uppercase text-emerald-600">
          {product.category || "Product"}
        </p>
        <h3 className="mt-1 font-semibold text-slate-900 group-hover:text-emerald-600">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{product.description}</p>
        )}
        <div className="mt-4 flex items-center justify-between">
          <PriceDisplay
            price={displayPrice}
            originalPrice={originalPrice}
            formatCurrency={formatCurrency}
            size="md"
          />
          {showCta && (
            <span className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white group-hover:bg-emerald-500">
              View Details
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
