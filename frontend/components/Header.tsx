"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "@/contexts/SettingsContext";

type HeaderProps = {
  /** When true, show logged-in UI. When false, show login/signup. When undefined, detect from localStorage. */
  isLoggedIn?: boolean;
  userType?: string | null;
};

export default function Header({ isLoggedIn: propLoggedIn, userType: propUserType }: HeaderProps = {}) {
  const pathname = usePathname();
  const { settings } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [detectedLoggedIn, setDetectedLoggedIn] = useState(false);
  const [detectedUserType, setDetectedUserType] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || propLoggedIn !== undefined) return;
    setDetectedLoggedIn(!!localStorage.getItem("token"));
    setDetectedUserType(localStorage.getItem("userType"));
  }, [mounted, propLoggedIn, pathname]);

  const isLoggedIn = propLoggedIn ?? detectedLoggedIn;
  const userType = propUserType ?? detectedUserType;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-2xl font-bold tracking-tight text-emerald-600">
          {settings.siteName || "ShopNow"}
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/shop" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Shop
          </Link>
          <Link href="/shop?category=Electronics" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Electronics
          </Link>
          <Link href="/shop?category=Fashion" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Fashion
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/shop"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Browse
          </Link>
          {isLoggedIn ? (
            <>
              <Link href="/user/wishlist" className="text-slate-600 hover:text-slate-900">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>
              <Link href="/user/cart" className="relative text-slate-600 hover:text-slate-900">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-xs font-medium text-white">0</span>
              </Link>
              <Link
                href="/user/dashboard"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                My Account
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/user/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Login
              </Link>
              <Link
                href="/user/signup"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
