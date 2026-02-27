"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { productApi, getMediaUrl } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";
import { PageLayout, Breadcrumb, LoadingState, ErrorState, Button } from "@/components/ui";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import ProductDetailInfo from "@/components/product/ProductDetailInfo";

export default function ProductPage() {
  const params = useParams();
  const id = params?.id as string;
  const { items, addToCart, removeFromCart } = useCart();
  const { formatCurrency } = useSettings();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    productApi.get(id).then((res) => {
      setLoading(false);
      if (res.data?.data) {
        const p = res.data.data;
        if (!p.isActive) {
          setError("This product is no longer available.");
        } else {
          setProduct(p);
          if (Array.isArray(p.attributes) && p.attributes.length > 0) {
            const defaultIdx =
              typeof p.defaultVariationIndex === "number" &&
              p.variations &&
              p.defaultVariationIndex >= 0 &&
              p.defaultVariationIndex < p.variations.length
                ? p.defaultVariationIndex
                : 0;
            const defaultVar = p.variations?.[defaultIdx];
            const initial: Record<string, string> = {};
            if (defaultVar?.attributes && defaultVar.attributes.length > 0) {
              defaultVar.attributes.forEach((a) => {
                if (a.name && a.value) initial[a.name] = a.value;
              });
            }
            p.attributes.forEach((attr) => {
              if (!(attr.name in initial) && attr.terms.length > 0) {
                initial[attr.name] = attr.terms[0];
              }
            });
            setSelectedAttributes(initial);
            const firstVar = p.variations?.find((v) =>
              v.attributes?.every((a) => initial[a.name] === a.value)
            );
            const mainImage: string | null =
              firstVar?.image ||
              (Array.isArray(firstVar?.images) && firstVar.images[0]) ||
              p.image ||
              (Array.isArray(p.images) && p.images[0]) ||
              null;
            setActiveImage(mainImage);
          } else {
            const mainImage: string | null =
              p.image || (Array.isArray(p.images) && p.images[0]) || null;
            setActiveImage(mainImage);
          }
        }
      } else {
        setError(res.error || "Product not found.");
      }
    });
  }, [id]);

  if (loading) {
    return (
      <PageLayout>
        <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
          <LoadingState message="Loading product..." />
        </div>
      </PageLayout>
    );
  }

  if (error || !product) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <ErrorState
            message={error || "Product not found."}
            action={
              <Button as="link" href="/shop" variant="primary">
                Back to Shop
              </Button>
            }
          />
        </div>
      </PageLayout>
    );
  }

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
    ...(product.category ? [{ label: product.category, href: `/shop?category=${encodeURIComponent(product.category)}` }] : []),
    { label: product.name },
  ];

  return (
    <PageLayout>
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
