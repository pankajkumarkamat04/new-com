"use client";

import Link from "next/link";
import { useSettings } from "@/contexts/SettingsContext";

type FooterVariant = "light" | "dark";

export default function Footer({ variant = "dark" }: { variant?: FooterVariant }) {
  const { settings } = useSettings();
  const s = settings ?? { siteName: "ShopNow", siteTagline: "Your trusted online shopping destination.", contactEmail: "", contactPhone: "", contactAddress: "", facebookUrl: "", instagramUrl: "", twitterUrl: "", linkedinUrl: "" };

  if (variant === "light") {
    return (
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <Link href="/" className="text-xl font-bold text-emerald-600">
                {s.siteName || "ShopNow"}
              </Link>
              <p className="mt-2 text-sm text-slate-500">
                {s.siteTagline || "Your trusted online shopping destination."}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Shop</h4>
              <ul className="mt-4 space-y-2">
                <li><Link href="/shop" className="text-sm text-slate-500 hover:text-slate-900">All Products</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Account</h4>
              <ul className="mt-4 space-y-2">
                <li><Link href="/user/login" className="text-sm text-slate-500 hover:text-slate-900">Login</Link></li>
                <li><Link href="/user/signup" className="text-sm text-slate-500 hover:text-slate-900">Sign Up</Link></li>
                <li><Link href="/user/dashboard" className="text-sm text-slate-500 hover:text-slate-900">My Account</Link></li>
              </ul>
              {(s.contactEmail || s.contactPhone) && (
                <div className="mt-4">
                  <h4 className="font-semibold text-slate-900">Contact</h4>
                  <ul className="mt-2 space-y-1">
                    {s.contactEmail && (
                      <li><a href={`mailto:${s.contactEmail}`} className="text-sm text-slate-500 hover:text-slate-900">{s.contactEmail}</a></li>
                    )}
                    {s.contactPhone && (
                      <li><a href={`tel:${s.contactPhone}`} className="text-sm text-slate-500 hover:text-slate-900">{s.contactPhone}</a></li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 border-t border-slate-200 pt-8">
            {(s.facebookUrl || s.instagramUrl || s.twitterUrl || s.linkedinUrl) && (
              <div className="flex gap-4">
                {s.facebookUrl && (
                  <a href={s.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-900">
                    Facebook
                  </a>
                )}
                {s.instagramUrl && (
                  <a href={s.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-900">
                    Instagram
                  </a>
                )}
                {s.twitterUrl && (
                  <a href={s.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-900">
                    Twitter
                  </a>
                )}
                {s.linkedinUrl && (
                  <a href={s.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-900">
                    LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="mt-4 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} {s.siteName || "ShopNow"}. All rights reserved.
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-slate-200 bg-slate-800 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h4 className="font-semibold text-red-500">NEED HELP</h4>
            <ul className="mt-4 space-y-2">
              {s.contactEmail ? (
                <li><a href={`mailto:${s.contactEmail}`} className="text-sm text-slate-400 hover:text-white">Contact Us</a></li>
              ) : (
                <li><Link href="#" className="text-sm text-slate-400 hover:text-white">Contact Us</Link></li>
              )}
              <li><Link href="#" className="text-sm text-slate-400 hover:text-white">Track Order</Link></li>
              <li><Link href="#" className="text-sm text-slate-400 hover:text-white">FAQs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-red-500">COMPANY</h4>
            <ul className="mt-4 space-y-2">
              <li><Link href="#" className="text-sm text-slate-400 hover:text-white">About Us</Link></li>
              <li><Link href="#" className="text-sm text-slate-400 hover:text-white">Blogs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-red-500">MORE INFO</h4>
            <ul className="mt-4 space-y-2">
              <li><Link href="#" className="text-sm text-slate-400 hover:text-white">T&C</Link></li>
              <li><Link href="#" className="text-sm text-slate-400 hover:text-white">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-slate-400 hover:text-white">Shipping Policy</Link></li>
              <li><Link href="#" className="text-sm text-slate-400 hover:text-white">Refund & Return Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-red-500">CONTACT</h4>
            <ul className="mt-4 space-y-2">
              {s.contactEmail && <li><a href={`mailto:${s.contactEmail}`} className="text-sm text-slate-400 hover:text-white">{s.contactEmail}</a></li>}
              {s.contactPhone && <li><a href={`tel:${s.contactPhone}`} className="text-sm text-slate-400 hover:text-white">{s.contactPhone}</a></li>}
              {s.contactAddress && <li className="text-sm text-slate-400">{s.contactAddress}</li>}
            </ul>
            <div className="mt-4 flex gap-4">
              {s.facebookUrl && <a href={s.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">f</a>}
              {s.instagramUrl && <a href={s.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">📷</a>}
              {s.twitterUrl && <a href={s.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">X</a>}
              {s.linkedinUrl && <a href={s.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">in</a>}
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-slate-700 pt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} {s.siteName || "ShopNow"}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
