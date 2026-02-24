import Link from "next/link";
import type { PublicSettings } from "@/lib/api";
import { getMediaUrl } from "@/lib/api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:5000/api" : "/api");

async function fetchPublicSettings(): Promise<PublicSettings | null> {
  try {
    const res = await fetch(`${API_BASE}/settings/public`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data || null) as PublicSettings | null;
  } catch {
    return null;
  }
}

export async function HeaderSSR() {
  const publicSettings = await fetchPublicSettings();
  const general = publicSettings?.general;
  const header = publicSettings?.header;

  const siteName = general?.siteName || "ShopNow";
  const logoImageUrl = header?.logoImageUrl || "";
  const navLinks =
    header?.navLinks && header.navLinks.length
      ? header.navLinks
      : [
          { label: "Shop", href: "/shop" },
          { label: "Electronics", href: "/shop?category=Electronics" },
          { label: "Fashion", href: "/shop?category=Fashion" },
        ];
  const showBrowse = header?.showBrowseButton !== false;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-2xl font-bold tracking-tight text-emerald-600">
          {logoImageUrl ? (
            <img src={getMediaUrl(logoImageUrl)} alt={siteName} className="h-10 w-auto max-w-[180px] object-contain" />
          ) : (
            siteName
          )}
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href + link.label} href={link.href} className="text-sm font-medium text-slate-600 hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {showBrowse && (
            <Link
              href="/shop"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Browse
            </Link>
          )}
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
        </div>
      </div>
    </header>
  );
}

