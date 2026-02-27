"use client";

import type { ReactNode } from "react";

type ErrorStateProps = {
  message: string;
  /** Optional action (e.g. Back to Shop link) */
  action?: ReactNode;
  className?: string;
};

export default function ErrorState({ message, action, className = "" }: ErrorStateProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center text-slate-600 ${className}`.trim()}
    >
      <p>{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
