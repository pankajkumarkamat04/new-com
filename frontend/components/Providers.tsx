"use client";

import { SettingsProvider } from "@/contexts/SettingsContext";
import { CartProvider } from "@/contexts/CartContext";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { FacebookPixel } from "@/components/FacebookPixel";
import { WhatsAppChatButton } from "@/components/WhatsAppChatButton";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <GoogleAnalytics />
      <FacebookPixel />
      <CartProvider>
        {children}
        <WhatsAppChatButton />
      </CartProvider>
    </SettingsProvider>
  );
}
