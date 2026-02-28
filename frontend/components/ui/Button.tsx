"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const variantClasses = {
  primary: "rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50",
  primaryAmber: "rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-500 disabled:opacity-50",
  secondary: "rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50",
  danger: "rounded-xl bg-red-600 px-8 py-4 font-semibold text-white transition hover:bg-red-500",
  outline: "rounded-xl border border-slate-300 bg-white px-8 py-4 font-semibold text-slate-700 transition hover:bg-slate-50",
  outlineEmerald: "rounded-xl border border-emerald-600 px-8 py-4 font-semibold text-emerald-600 transition hover:bg-emerald-50",
  link: "text-amber-600 hover:underline",
  linkRed: "text-red-600 hover:underline",
  fullPrimary: "w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50",
  fullSecondary: "block w-full rounded-lg border border-slate-300 bg-white py-3 text-center font-medium text-slate-700 transition hover:bg-slate-50",
} as const;

type ButtonVariant = keyof typeof variantClasses;

type BaseProps = {
  variant?: ButtonVariant;
  className?: string;
  disabled?: boolean;
  children: ReactNode;
};

type ButtonAsButton = BaseProps & {
  as?: "button";
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  href?: never;
};

type ButtonAsLink = BaseProps & {
  as?: "link";
  href: string;
  type?: never;
  onClick?: never;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export default function Button(props: ButtonProps) {
  const {
    variant = "primary",
    className = "",
    disabled = false,
    children,
    as = "button",
  } = props;

  const classes = `${variantClasses[variant]} ${className}`.trim();

  if (as === "link" && "href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { type = "button", onClick } = props as ButtonAsButton;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
