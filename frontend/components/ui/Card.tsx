"use client";

import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: "none" | "normal" | "large";
};

const paddingClasses = {
  none: "",
  normal: "p-6",
  large: "p-8",
};

export default function Card({ children, className = "", padding = "normal" }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${paddingClasses[padding]} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
