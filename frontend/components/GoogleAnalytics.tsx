"use client";

import Script from "next/script";
import { useSettings } from "@/contexts/SettingsContext";

/**
 * Injects Google Analytics (GA4) script when enabled in settings.
 * Place inside Providers so useSettings() is available.
 */
export function GoogleAnalytics() {
  const { googleAnalyticsEnabled, googleAnalyticsId } = useSettings();

  if (!googleAnalyticsEnabled || !googleAnalyticsId?.trim()) {
    return null;
  }

  const id = googleAnalyticsId.trim();

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
