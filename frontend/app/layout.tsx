import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:5000/api" : "/api");

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [settingsRes, seoRes] = await Promise.all([
      fetch(`${API_BASE}/settings`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE}/settings/seo`, { next: { revalidate: 60 } }),
    ]);
    const settings = settingsRes.ok ? await settingsRes.json() : null;
    const seo = seoRes.ok ? await seoRes.json() : null;

    const siteName = settings?.data?.siteName?.trim() || "ShopNow";
    const siteTagline = settings?.data?.siteTagline?.trim() || "";
    const metaTitle = seo?.data?.metaTitle?.trim() || (siteName + (siteTagline ? ` - ${siteTagline}` : ""));
    const metaDescription = seo?.data?.metaDescription?.trim() || siteTagline || "Discover amazing products. Shop the latest trends with fast delivery and great prices.";

    let faviconHref = settings?.data?.faviconUrl?.trim() || "";
    if (faviconHref && !faviconHref.startsWith("http")) {
      const isBackendPath = faviconHref.startsWith("/api/") || faviconHref.startsWith("/uploads/");
      if (isBackendPath && API_BASE.startsWith("http")) {
        try {
          const origin = new URL(API_BASE).origin;
          faviconHref = `${origin}${faviconHref.startsWith("/") ? faviconHref : `/${faviconHref}`}`;
        } catch {
          faviconHref = faviconHref.startsWith("/") ? faviconHref : `/${faviconHref}`;
        }
      } else if (!faviconHref.startsWith("/")) {
        faviconHref = `/${faviconHref}`;
      }
    }

    return {
      title: metaTitle,
      description: metaDescription,
      icons: faviconHref ? { icon: faviconHref } : undefined,
      openGraph: {
        title: seo?.data?.ogTitle?.trim() || metaTitle,
        description: seo?.data?.ogDescription?.trim() || metaDescription,
        images: seo?.data?.ogImage ? [seo.data.ogImage] : undefined,
      },
    };
  } catch {
    return {
      title: "ShopNow - Your Online Shopping Destination",
      description: "Discover amazing products. Shop the latest trends with fast delivery and great prices.",
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
