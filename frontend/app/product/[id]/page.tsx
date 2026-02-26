"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { productApi, getMediaUrl } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ProductPage() {
  const params = useParams();
  const id = params?.id as string;
  const { items, addToCart, removeFromCart } = useCart();
  const { formatCurrency } = useSettings();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const isInCart = product ? items.some((i) => i.productId === product._id) : false;
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
          // Auto-select default variation or first term for each attribute
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
            // Fill missing attributes with first term
            p.attributes.forEach((attr) => {
              if (!(attr.name in initial) && attr.terms.length > 0) {
                initial[attr.name] = attr.terms[0];
              }
            });
            setSelectedAttributes(initial);
            // Find matching variation for initial image
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
      <div className="min-h-screen bg-white">
        <Header />
        <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="text-slate-600">Loading product...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
            <p className="text-lg text-slate-600">{error || "Product not found."}</p>
            <Link
              href="/shop"
              className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-500"
            >
              Back to Shop
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const hasAttributes = Array.isArray(product.attributes) && product.attributes.length > 0;
  const hasVariations = Array.isArray(product.variations) && product.variations.length > 0;

  // Find variation matching all selected attributes
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

  // For products with variations, use selected variation's stock; otherwise use product-level stock
  const effectiveStock =
    hasVariations && selectedVariation
      ? (selectedVariation.stock ?? 0)
      : (product.stock ?? 0);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-700">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-slate-700">Shop</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                href={`/shop?category=${encodeURIComponent(product.category)}`}
                className="hover:text-slate-700"
              >
                {product.category}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-slate-900">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image + gallery */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center text-slate-400">
                  <svg className="h-32 w-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            {(() => {
              const baseImages = [product.image, ...(product.images || [])].filter(Boolean) as string[];
              const variationImages = selectedVariation
                ? [selectedVariation.image, ...(selectedVariation.images || [])].filter(Boolean)
                : [];
              const thumbnails = (variationImages.length > 0 ? variationImages : baseImages)
                .filter((url, idx, arr) => arr.indexOf(url) === idx)
                .slice(0, 6);
              if (!thumbnails.length) return null;
              return (
                <div className="mt-4 flex flex-wrap gap-2">
                  {thumbnails.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActiveImage(url || null)}
                      className={`h-16 w-16 overflow-hidden rounded border ${
                        activeImage === url ? "border-emerald-500" : "border-slate-300"
                      } bg-slate-50`}
                    >
                      <img src={getMediaUrl(url)} alt={product.name} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Details */}
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
            <p className="mt-4 text-3xl font-bold text-slate-900">
              {selectedVariation?.discountedPrice && selectedVariation.discountedPrice < selectedVariation.price ? (
                <>
                  <span className="mr-3 text-xl text-slate-400 line-through">
                    {formatCurrency(selectedVariation.price)}
                  </span>
                  <span>{formatCurrency(selectedVariation.discountedPrice)}</span>
                </>
              ) : product.discountedPrice && product.discountedPrice < product.price ? (
                <>
                  <span className="mr-3 text-xl text-slate-400 line-through">
                    {formatCurrency(product.price)}
                  </span>
                  <span>{formatCurrency(product.discountedPrice)}</span>
                </>
              ) : (
                formatCurrency(effectivePrice)
              )}
            </p>

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
                          onClick={() => {
                            const next = { ...selectedAttributes, [attr.name]: term };
                            setSelectedAttributes(next);
                            // Update image to matching variation
                            const matched = product.variations?.find((v) =>
                              v.attributes?.every((a) => next[a.name] === a.value)
                            );
                            if (matched?.image) setActiveImage(matched.image);
                            else if (matched?.images?.[0]) setActiveImage(matched.images[0]);
                          }}
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
                  </div>
                ))}
                {selectedVariation && (
                  <p className="text-xs text-slate-500">
                    Selected: <span className="font-medium text-slate-700">{selectedVariation.name}</span>
                    {selectedVariation.stock !== undefined && (
                      <span className="ml-2">
                        &middot; Stock: {selectedVariation.stock}
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

            {product.description && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase text-slate-500">Description</h2>
                <p className="mt-2 text-slate-600 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            <div className="mt-6 flex items-center gap-4">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                  effectiveStock > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                }`}
              >
                {effectiveStock > 0 ? `In stock (${effectiveStock})` : "Out of stock"}
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              {isInCart ? (
                <button
                  type="button"
                  onClick={() => product && removeFromCart(product._id)}
                  className="rounded-xl bg-red-600 px-8 py-4 font-semibold text-white transition hover:bg-red-500"
                >
                  Remove from Cart
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    product &&
                    addToCart(product._id, 1, {
                      name: selectedVariation ? `${product.name} - ${selectedVariation.name}` : product.name,
                      price: effectivePrice,
                    image: product.image || (product.images && product.images[0]),
                    })
                  }
                  className="rounded-xl bg-emerald-600 px-8 py-4 font-semibold text-white transition hover:bg-emerald-500"
                >
                  Add to Cart
                </button>
              )}
              <Link
                href="/shop"
                className="rounded-xl border border-slate-300 bg-white px-8 py-4 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Continue Shopping
              </Link>
              <Link
                href="/cart"
                className="rounded-xl border border-emerald-600 px-8 py-4 font-semibold text-emerald-600 transition hover:bg-emerald-50"
              >
                View Cart
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
