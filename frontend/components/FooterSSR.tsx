import Link from "next/link";
import type { PublicSettings } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

export async function FooterSSR() {
  const publicSettings = await fetchPublicSettings();
  const general = publicSettings?.general;
  const footer = publicSettings?.footer;

  const s = {
    siteName: general?.siteName || "ShopNow",
    siteTagline: general?.siteTagline || "Your trusted online shopping destination.",
    contactEmail: general?.contactEmail || "",
    contactPhone: general?.contactPhone || "",
    contactAddress: general?.contactAddress || "",
    facebookUrl: general?.facebookUrl || "",
    instagramUrl: general?.instagramUrl || "",
    twitterUrl: general?.twitterUrl || "",
    linkedinUrl: general?.linkedinUrl || "",
  };

  const cols = Array.isArray(footer?.columns) ? footer.columns : [];
  const variant = footer?.variant === "light" ? "light" : "dark";
  const backgroundColor = footer?.backgroundColor?.trim();

  const copyrightRaw = footer?.copyrightText?.trim();
  const copyrightText = copyrightRaw
    ? copyrightRaw
        .replace(/\{year\}/g, String(new Date().getFullYear()))
        .replace(/\{siteName\}/g, s.siteName || "ShopNow")
    : `© ${new Date().getFullYear()} ${s.siteName || "ShopNow"}. All rights reserved.`;

  const isLight = variant === "light";

  return (
    <footer
      className={
        isLight
          ? "border-t border-slate-200 bg-white py-12"
          : "border-t border-slate-200 bg-slate-800 py-12"
      }
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
          style={
            cols.length > 0 && cols.length <= 4
              ? { gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }
              : undefined
          }
        >
          {cols.length > 0 ? (
            cols.map((col, i) => {
              const colType = col.type || "links";
              const linkCls = isLight
                ? "text-sm text-slate-500 hover:text-slate-900"
                : "text-sm text-slate-400 hover:text-white";
              const textCls = isLight ? "text-sm text-slate-500" : "text-sm text-slate-400";
              const hasCustomLinks = Array.isArray(col.links) && col.links.length > 0;

              return (
                <div key={i}>
                  <h4
                    className={
                      isLight
                        ? "font-semibold text-slate-900"
                        : "font-semibold text-red-500"
                    }
                  >
                    {col.title || `Column ${i + 1}`}
                  </h4>

                  {/* Links type (always custom list) */}
                  {colType === "links" && hasCustomLinks && (
                    <ul className="mt-4 space-y-2">
                      {col.links.map((link, j) => (
                        <li key={j}>
                          {link.href?.startsWith("mailto:") || link.href?.startsWith("tel:") ? (
                            <a href={link.href} className={linkCls}>
                              {link.label || link.href}
                            </a>
                          ) : (
                            <Link href={link.href || "#"} className={linkCls}>
                              {link.label || link.href || "Link"}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* About type */}
                  {colType === "about" && (
                    <div className={`mt-4 whitespace-pre-wrap ${textCls}`}>
                      {col.content || ""}
                    </div>
                  )}

                  {/* Social type: if custom links exist, use them; otherwise use General settings */}
                  {colType === "social" && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {hasCustomLinks
                        ? col.links.map((link, j) => (
                            <a
                              key={j}
                              href={link.href || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={linkCls}
                            >
                              {link.label || link.href || "Social"}
                            </a>
                          ))
                        : (
                          <>
                            {s.facebookUrl && (
                              <a href={s.facebookUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>
                                Facebook
                              </a>
                            )}
                            {s.instagramUrl && (
                              <a href={s.instagramUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>
                                Instagram
                              </a>
                            )}
                            {s.twitterUrl && (
                              <a href={s.twitterUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>
                                Twitter
                              </a>
                            )}
                            {s.linkedinUrl && (
                              <a href={s.linkedinUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>
                                LinkedIn
                              </a>
                            )}
                            {!s.facebookUrl && !s.instagramUrl && !s.twitterUrl && !s.linkedinUrl && (
                              <span className={textCls}>Add social URLs in General settings.</span>
                            )}
                          </>
                        )}
                    </div>
                  )}

                  {/* Contact type: if custom rows exist, show those; otherwise General settings contact */}
                  {colType === "contact" && (
                    <div className="mt-4 space-y-1">
                      {hasCustomLinks
                        ? col.links.map((link, j) => (
                            <div key={j} className={textCls}>
                              {link.label ? (
                                <>
                                  <span className="font-medium">{link.label}:</span>{" "}
                                  <span>{link.href}</span>
                                </>
                              ) : (
                                <span>{link.href}</span>
                              )}
                            </div>
                          ))
                        : (
                          <>
                            {s.contactEmail && (
                              <a href={`mailto:${s.contactEmail}`} className={`block ${linkCls}`}>
                                {s.contactEmail}
                              </a>
                            )}
                            {s.contactPhone && (
                              <a href={`tel:${s.contactPhone}`} className={`block ${linkCls}`}>
                                {s.contactPhone}
                              </a>
                            )}
                            {s.contactAddress && (
                              <span className={`block ${textCls}`}>{s.contactAddress}</span>
                            )}
                            {!s.contactEmail && !s.contactPhone && !s.contactAddress && (
                              <span className={textCls}>Add contact details in General settings.</span>
                            )}
                          </>
                        )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <>
              <div>
                <Link
                  href="/"
                  className={isLight ? "text-xl font-bold text-emerald-600" : "text-xl font-bold text-red-500"}
                >
                  {s.siteName || "ShopNow"}
                </Link>
                <p className="mt-2 text-sm text-slate-500">
                  {s.siteTagline || "Your trusted online shopping destination."}
                </p>
              </div>
              <div>
                <h4 className={isLight ? "font-semibold text-slate-900" : "font-semibold text-red-500"}>
                  Shop
                </h4>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link
                      href="/shop"
                      className={isLight ? "text-sm text-slate-500 hover:text-slate-900" : "text-sm text-slate-400 hover:text-white"}
                    >
                      All Products
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className={isLight ? "font-semibold text-slate-900" : "font-semibold text-red-500"}>
                  Account
                </h4>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link
                      href="/user/login"
                      className={isLight ? "text-sm text-slate-500 hover:text-slate-900" : "text-sm text-slate-400 hover:text-white"}
                    >
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/user/signup"
                      className={isLight ? "text-sm text-slate-500 hover:text-slate-900" : "text-sm text-slate-400 hover:text-white"}
                    >
                      Sign Up
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/user/dashboard"
                      className={isLight ? "text-sm text-slate-500 hover:text-slate-900" : "text-sm text-slate-400 hover:text-white"}
                    >
                      My Account
                    </Link>
                  </li>
                </ul>
                {(s.contactEmail || s.contactPhone) && (
                  <div className="mt-4">
                    <h4 className={isLight ? "font-semibold text-slate-900" : "font-semibold text-red-500"}>
                      Contact
                    </h4>
                    <ul className="mt-2 space-y-1">
                      {s.contactEmail && (
                        <li>
                          <a
                            href={`mailto:${s.contactEmail}`}
                            className={isLight ? "text-sm text-slate-500 hover:text-slate-900" : "text-sm text-slate-400 hover:text-white"}
                          >
                            {s.contactEmail}
                          </a>
                        </li>
                      )}
                      {s.contactPhone && (
                        <li>
                          <a
                            href={`tel:${s.contactPhone}`}
                            className={isLight ? "text-sm text-slate-500 hover:text-slate-900" : "text-sm text-slate-400 hover:text-white"}
                          >
                            {s.contactPhone}
                          </a>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-8 border-t border-slate-700/40 pt-6 text-center text-xs text-slate-400">
          {copyrightText}
        </div>
      </div>
    </footer>
  );
}

