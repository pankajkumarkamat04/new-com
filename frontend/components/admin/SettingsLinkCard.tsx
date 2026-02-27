"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type SettingsLinkCardProps = {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  iconBgClassName?: string;
};

export default function SettingsLinkCard({
  href,
  title,
  description,
  icon,
  iconBgClassName = "bg-amber-100 text-amber-600",
}: SettingsLinkCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-amber-300 hover:shadow-md"
    >
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${iconBgClassName}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <svg className="h-5 w-5 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
