"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getMediaUrl } from "@/lib/api";
import { PageLayout, Breadcrumb } from "@/components/ui";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import ProductDetailInfo from "@/components/product/ProductDetailInfo";
import { getDefaultActiveImage, getDefaultSelectedAttributes } from "./productDetailUtils";

type ProductDetailViewProps = {
  product: Product;
};

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const { items, addToCart, removeFromCart } = useCart();
  const { formatCurrency } = useSettings();
  const [activeImage, setActiveImage] = useState<string | null>(() => getDefaultActiveImage(product));
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(() =>
    getDefaultSelectedAttributes(product)
  );

  const hasAttributes = Array.isArray(product.attributes) && product.attributes.length > 0;
  const hasVariations = Array.isArray(product.variations) && product.variations.length > 0;
  const selectedVariation =
    hasAttributes && hasVariations
      ? product.variations!.find((v) =>
          v.attributes?.every((a) => selectedAttributes[a.name] === a.value)
        ) || null
      : null;

  const effectivePrice =
    selectedVariation?.discountedPrice && selectedVariation.discountedPrice < selectedVariation.price
      ? selectedVariation.discountedPrice
      : selectedVariation?.price ??
        (product.discountedPrice && product.discountedPrice < product.price
          ? product.discountedPrice
          : product.price);

  const effectiveStock =
    hasVariations && selectedVariation
      ? (selectedVariation.stock ?? 0)
      : (product.stock ?? 0);

  const isInCart = items.some(
    (i) =>
      i.productId === product._id &&
      (i.variationName || "") === (selectedVariation?.name || "")
  );

  const baseImages = [product.image, ...(product.images || [])].filter(Boolean) as string[];
  const variationImages = selectedVariation
    ? [selectedVariation.image, ...(selectedVariation.images || [])].filter(Boolean)
    : [];
  const thumbnails = (variationImages.length > 0 ? variationImages : baseImages)
    .filter((url, idx, arr) => arr.indexOf(url) === idx)
    .slice(0, 6);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...(product.category
      ? [{ label: product.category, href: `/shop?category=${encodeURIComponent(product.category)}` }]
      : []),
    { label: product.name },
  ];

  return (
    <PageLayout withLayout={false}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={breadcrumbItems} className="mb-8" />

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ProductImageGallery
            productName={product.name}
            activeImage={activeImage}
            thumbnails={thumbnails.map((u) => getMediaUrl(u))}
            onSelectImage={setActiveImage}
          />

          <ProductDetailInfo
            product={product}
            selectedVariation={selectedVariation}
            selectedAttributes={selectedAttributes}
            effectivePrice={effectivePrice}
            effectiveStock={effectiveStock}
            isInCart={isInCart}
            formatCurrency={formatCurrency}
            onSelectAttribute={(attrName, term) => {
              const next = { ...selectedAttributes, [attrName]: term };
              setSelectedAttributes(next);
              const matched = product.variations?.find((v) =>
                v.attributes?.every((a) => next[a.name] === a.value)
              );
              if (matched?.image) setActiveImage(matched.image);
              else if (matched?.images?.[0]) setActiveImage(matched.images[0]);
            }}
            onAddToCart={() =>
              addToCart(product._id, 1, {
                name: selectedVariation ? `${product.name} - ${selectedVariation.name}` : product.name,
                price: effectivePrice,
                image: product.image || (product.images && product.images[0]),
                ...(selectedVariation && {
                  variationName: selectedVariation.name,
                  variationAttributes:
                    selectedVariation.attributes?.map((a) => ({
                      name: a.name || "",
                      value: a.value || "",
                    })) || [],
                }),
              })
            }
            onRemoveFromCart={() => removeFromCart(product._id, selectedVariation?.name)}
          />
        </div>
      </div>
    </PageLayout>
  );
}
