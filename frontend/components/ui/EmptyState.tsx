"use client";

import type { ReactNode } from "react";

type EmptyStateProps = {
  /** Message or custom content */
  message: ReactNode;
  /** Optional action (e.g. Link or button) */
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({ message, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center text-slate-600 ${className}`.trim()}
    >
      {typeof message === "string" ? <p>{message}</p> : message}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
