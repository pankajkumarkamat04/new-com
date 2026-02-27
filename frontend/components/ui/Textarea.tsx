"use client";

import type { TextareaHTMLAttributes } from "react";

const baseClass =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1";
const focusDefault = "focus:border-emerald-500 focus:ring-emerald-500";
const focusAmber = "focus:border-amber-500 focus:ring-amber-500";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  variant?: "default" | "amber";
};

export default function Textarea({ variant = "default", className = "", ...props }: TextareaProps) {
  const focusClass = variant === "amber" ? focusAmber : focusDefault;
  return <textarea className={`${baseClass} ${focusClass} ${className}`.trim()} {...props} />;
}
