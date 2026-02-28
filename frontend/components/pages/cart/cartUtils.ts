type ProductTax = { taxType?: string; value?: number } | undefined;

export function computeItemTax(
  price: number,
  qty: number,
  productTax: ProductTax,
  defaultPct: number
): number {
  const useCustom = productTax && (productTax.value ?? 0) > 0;
  const type = useCustom ? (productTax!.taxType || "percentage") : "percentage";
  const val = useCustom ? (productTax!.value || 0) : defaultPct;
  const lineTotal = price * qty;
  if (type === "percentage") return (lineTotal * val) / 100;
  return val * qty;
}
