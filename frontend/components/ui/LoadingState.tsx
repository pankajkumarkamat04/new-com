"use client";

type LoadingStateProps = {
  message?: string;
  /** Use skeleton grid instead of text (e.g. for product grid) */
  variant?: "text" | "skeleton-grid";
  /** Number of skeleton items when variant is skeleton-grid */
  skeletonCount?: number;
  className?: string;
};

export default function LoadingState({
  message = "Loading...",
  variant = "text",
  skeletonCount = 8,
  className = "",
}: LoadingStateProps) {
  if (variant === "skeleton-grid") {
    return (
      <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-4 ${className}`.trim()}>
        {[...Array(skeletonCount)].map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className={`py-16 text-center text-slate-600 ${className}`.trim()}>
      {message}
    </div>
  );
}
