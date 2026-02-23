"use client";

import Link from "next/link";
import { useSettings } from "@/contexts/SettingsContext";

export default function Footer() {
  const { settings, footerSettings } = useSettings();
  const variant = footerSettings?.variant ?? "dark";
  const s = settings ?? {
    siteName: "ShopNow",
    siteTagline: "Your trusted online shopping destination.",
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    facebookUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    linkedinUrl: "",
  };
  const cols = footerSettings?.columns ?? [];
  const showSocial = footerSettings?.showSocial !== false;
  const copyrightRaw = footerSettings?.copyrightText?.trim();
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

        {showSocial && (s.facebookUrl || s.instagramUrl || s.twitterUrl || s.linkedinUrl) && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 border-t border-slate-200 pt-8">
            <div className={`flex gap-4 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {s.facebookUrl && (
                <a href={s.facebookUrl} target="_blank" rel="noopener noreferrer" className={isLight ? "hover:text-slate-900" : "hover:text-white"}>
                  Facebook
                </a>
              )}
              {s.instagramUrl && (
                <a href={s.instagramUrl} target="_blank" rel="noopener noreferrer" className={isLight ? "hover:text-slate-900" : "hover:text-white"}>
                  Instagram
                </a>
              )}
              {s.twitterUrl && (
                <a href={s.twitterUrl} target="_blank" rel="noopener noreferrer" className={isLight ? "hover:text-slate-900" : "hover:text-white"}>
                  Twitter
                </a>
              )}
              {s.linkedinUrl && (
                <a href={s.linkedinUrl} target="_blank" rel="noopener noreferrer" className={isLight ? "hover:text-slate-900" : "hover:text-white"}>
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        )}

        <div
          className={
            (showSocial && (s.facebookUrl || s.instagramUrl || s.twitterUrl || s.linkedinUrl)
              ? "mt-4 "
              : "mt-12 ") +
            "border-t pt-8 text-center text-sm text-slate-500 " +
            (isLight ? "border-slate-200" : "border-slate-700")
          }
        >
          {copyrightText}
        </div>
      </div>
    </footer>
  );
}
