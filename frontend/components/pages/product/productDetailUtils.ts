import type { Product } from "@/lib/types";

export function getDefaultActiveImage(product: Product): string | null {
  const p = product;
  if (Array.isArray(p.attributes) && p.attributes.length > 0 && p.variations?.length) {
    const defaultIdx =
      typeof p.defaultVariationIndex === "number" &&
      p.defaultVariationIndex >= 0 &&
      p.defaultVariationIndex < p.variations.length
        ? p.defaultVariationIndex
        : 0;
    const defaultVar = p.variations[defaultIdx];
    const initial: Record<string, string> = {};
    if (defaultVar?.attributes?.length) {
      defaultVar.attributes.forEach((a) => {
        if (a.name && a.value) initial[a.name] = a.value;
      });
    }
    p.attributes?.forEach((attr) => {
      if (!(attr.name in initial) && attr.terms?.length) initial[attr.name] = attr.terms[0];
    });
    const firstVar = p.variations?.find((v) =>
      v.attributes?.every((a) => initial[a.name] === a.value)
    );
    return (
      firstVar?.image ||
      (Array.isArray(firstVar?.images) && firstVar.images[0]) ||
      p.image ||
      (Array.isArray(p.images) && p.images[0]) ||
      null
    );
  }
  return p.image || (Array.isArray(p.images) && p.images[0]) || null;
}

export function getDefaultSelectedAttributes(product: Product): Record<string, string> {
  const p = product;
  if (!Array.isArray(p.attributes) || p.attributes.length === 0) return {};
  const defaultIdx =
    typeof p.defaultVariationIndex === "number" &&
    p.variations &&
    p.defaultVariationIndex >= 0 &&
    p.defaultVariationIndex < p.variations.length
      ? p.defaultVariationIndex
      : 0;
  const defaultVar = p.variations?.[defaultIdx];
  const initial: Record<string, string> = {};
  if (defaultVar?.attributes?.length) {
    defaultVar.attributes.forEach((a) => {
      if (a.name && a.value) initial[a.name] = a.value;
    });
  }
  p.attributes.forEach((attr) => {
    if (!(attr.name in initial) && attr.terms?.length) initial[attr.name] = attr.terms[0];
  });
  return initial;
}
