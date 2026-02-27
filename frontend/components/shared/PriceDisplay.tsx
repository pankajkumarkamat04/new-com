"use client";

type PriceDisplayProps = {
  price: number;
  originalPrice?: number;
  formatCurrency: (n: number) => string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export default function PriceDisplay({
  price,
  originalPrice,
  formatCurrency,
  className = "",
  size = "md",
}: PriceDisplayProps) {
  const showStrikethrough = originalPrice != null && originalPrice > price;
  const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-3xl" : "text-lg";

  const strikeClass = size === "lg" ? "mr-3 text-xl text-slate-400 line-through" : "mr-2 text-sm text-slate-400 line-through";

  return (
    <p className={`font-bold text-slate-900 ${sizeClass} ${className}`.trim()}>
      {showStrikethrough && (
        <span className={strikeClass}>
          {formatCurrency(originalPrice!)}
        </span>
      )}
      <span>{formatCurrency(price)}</span>
    </p>
  );
}
