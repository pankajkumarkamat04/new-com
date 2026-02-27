"use client";

type BadgeVariant = "success" | "neutral" | "draft" | "danger" | "warning";

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-emerald-100 text-emerald-800",
  neutral: "bg-slate-100 text-slate-600",
  draft: "bg-slate-100 text-slate-700",
  danger: "bg-red-100 text-red-800",
  warning: "bg-amber-100 text-amber-800",
};

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export default function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${variantClasses[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
