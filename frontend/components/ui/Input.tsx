"use client";

import type { InputHTMLAttributes } from "react";

const baseClass =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
const focusAmber = "focus:border-amber-500 focus:ring-amber-500";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Use amber focus for admin forms */
  variant?: "default" | "amber";
  error?: boolean;
};

export default function Input({
  variant = "default",
  error = false,
  className = "",
  ...props
}: InputProps) {
  const focusClass = variant === "amber" ? focusAmber : "";
  const errorClass = error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "";
  return (
    <input
      className={`${baseClass} ${focusClass} ${errorClass} ${className}`.trim()}
      {...props}
    />
  );
}
