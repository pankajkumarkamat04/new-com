"use client";

import Link from "next/link";

type BackLinkProps = {
  href: string;
  label: string;
  className?: string;
};

export default function BackLink({ href, label, className = "" }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={`mb-4 inline-flex items-center text-sm text-slate-500 hover:text-slate-700 ${className}`.trim()}
    >
      <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </Link>
  );
}
