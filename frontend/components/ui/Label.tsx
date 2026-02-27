"use client";

import type { LabelHTMLAttributes } from "react";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export default function Label({ children, required, className = "", ...props }: LabelProps) {
  return (
    <label
      className={`mb-1 block text-sm font-medium text-slate-600 ${className}`.trim()}
      {...props}
    >
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}
