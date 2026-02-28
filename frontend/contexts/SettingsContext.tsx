"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { settingsApi } from "@/lib/api";
import type {
  Settings,
  HeroSettings,
  HomePageSettings,
  HomeCategorySettings,
  HeaderSettings,
  FooterSettings,
  CheckoutSettings,
  PaymentSettings,
  PublicSettings,
  FooterColumnType,
  WhatsappChatSettings,
} from "@/lib/types";

const defaultHero: HeroSettings = {
  layout: 'single',
  slides: [{ title: 'Discover Amazing Products', subtitle: 'Shop the latest trends.', buttonText: 'Shop Now', buttonLink: '/shop', showText: true }],
};

const defaultHeaderSettings: HeaderSettings = {
  logoImageUrl: "",
  navLinks: [
    { label: "Shop", href: "/shop" },
    { label: "Electronics", href: "/shop?category=Electronics" },
    { label: "Fashion", href: "/shop?category=Fashion" },
  ],
  showBrowseButton: true,
  showCartIcon: true,
};

const defaultCheckoutSettings: CheckoutSettings = {
  name: { enabled: true, required: true, label: "Full Name" },
  address: { enabled: true, required: true, label: "Address" },
  city: { enabled: true, required: true, label: "City" },
  state: { enabled: true, required: false, label: "State / Province" },
  zip: { enabled: true, required: true, label: "ZIP / Postal Code" },
  phone: { enabled: true, required: true, label: "Phone" },
  customFields: [],
  internationalShippingEnabled: false,
  defaultCountry: "IN",
};

const defaultPaymentSettings: PaymentSettings = {
  currency: "INR",
  cod: { enabled: true },
  razorpay: { enabled: false, keyId: "", keySecret: "" },
  cashfree: { enabled: false, appId: "", secretKey: "", env: "sandbox" },
};

const defaultFooterSettings: FooterSettings = {
  columns: [
    { type: "links", title: "Need Help", content: "", links: [{ label: "Contact Us", href: "#" }, { label: "Track Order", href: "#" }, { label: "FAQs", href: "#" }] },
    { type: "links", title: "Company", content: "", links: [{ label: "About Us", href: "#" }, { label: "Blogs", href: "#" }] },
    { type: "links", title: "More Info", content: "", links: [{ label: "T&C", href: "#" }, { label: "Privacy Policy", href: "#" }, { label: "Shipping Policy", href: "#" }, { label: "Refund & Return Policy", href: "#" }] },
    { type: "contact", title: "Contact", content: "", links: [] },
  ],
  copyrightText: "",
  showSocial: true,
  variant: "dark",
  backgroundColor: "",
};

type SettingsContextType = {
  settings: Settings;
  hero: HeroSettings;
  homeCategorySettings: HomeCategorySettings;
  headerSettings: HeaderSettings;
  footerSettings: FooterSettings;
  checkoutSettings: CheckoutSettings;
  paymentSettings: PaymentSettings;
  couponEnabled: boolean;
  shippingEnabled: boolean;
  blogEnabled: boolean;
  taxEnabled: boolean;
  defaultTaxPercentage: number;
  googleAnalyticsEnabled: boolean;
  googleAnalyticsId: string;
  facebookPixelEnabled: boolean;
  facebookPixelId: string;
  whatsappChat: WhatsappChatSettings;
  currency: string;
  paymentMethods: { id: string; label: string }[];
  formatCurrency: (amount: number) => string;
  loading: boolean;
  refresh: () => Promise<void>;
};

const defaultSettings: Settings = {
  _id: "",
  siteName: "ShopNow",
  siteUrl: "",
  siteTagline: "Your trusted online shopping destination.",
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  facebookUrl: "",
  instagramUrl: "",
  twitterUrl: "",
  linkedinUrl: "",
};

function buildPaymentMethods(p: PaymentSettings): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  if (p.cod?.enabled) out.push({ id: "cod", label: "Cash on Delivery (COD)" });
  if (p.razorpay?.enabled) out.push({ id: "razorpay", label: "Razorpay" });
  if (p.cashfree?.enabled) out.push({ id: "cashfree", label: "Cashfree" });
  return out.length ? out : [{ id: "cod", label: "Cash on Delivery (COD)" }];
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings as Settings,
  hero: defaultHero,
  homeCategorySettings: {
    title: "Shop by Category",
    description: "",
    columns: 4,
    limit: 8,
    showImage: true,
  },
  headerSettings: defaultHeaderSettings,
  footerSettings: defaultFooterSettings,
  checkoutSettings: defaultCheckoutSettings,
  paymentSettings: defaultPaymentSettings,
  couponEnabled: false,
  shippingEnabled: false,
  blogEnabled: false,
  taxEnabled: false,
  defaultTaxPercentage: 0,
  googleAnalyticsEnabled: false,
  googleAnalyticsId: "",
  facebookPixelEnabled: false,
  facebookPixelId: "",
  whatsappChat: { enabled: false, position: "right", phoneNumber: "" },
  currency: "INR",
  paymentMethods: [{ id: "cod", label: "Cash on Delivery (COD)" }],
  formatCurrency: (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount),
  loading: true,
  refresh: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [hero, setHero] = useState<HeroSettings | null>(null);
  const [homeCategorySettings, setHomeCategorySettings] = useState<HomeCategorySettings>({
    title: "Shop by Category",
    description: "",
    columns: 4,
    limit: 8,
    showImage: true,
  });
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings>(defaultHeaderSettings);
  const [footerSettings, setFooterSettings] = useState<FooterSettings>(defaultFooterSettings);
  const [checkoutSettings, setCheckoutSettings] = useState<CheckoutSettings>(defaultCheckoutSettings);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(defaultPaymentSettings);
  const [couponEnabled, setCouponEnabled] = useState(false);
  const [shippingEnabled, setShippingEnabled] = useState(false);
  const [blogEnabled, setBlogEnabled] = useState(false);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [defaultTaxPercentage, setDefaultTaxPercentage] = useState(0);
  const [googleAnalyticsEnabled, setGoogleAnalyticsEnabled] = useState(false);
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [facebookPixelEnabled, setFacebookPixelEnabled] = useState(false);
  const [facebookPixelId, setFacebookPixelId] = useState("");
  const [whatsappChat, setWhatsappChat] = useState<WhatsappChatSettings>({
    enabled: false,
    position: "right",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const publicRes = await settingsApi.getPublic();
    const publicData = (publicRes.data?.data || null) as PublicSettings | null;

    if (publicData?.general) {
      setSettings({ ...defaultSettings, ...publicData.general });
      setCouponEnabled(!!publicData.general.couponEnabled);
      setShippingEnabled(!!publicData.general.shippingEnabled);
      setBlogEnabled(!!publicData.general.blogEnabled);
      setTaxEnabled(!!publicData.general.taxEnabled);
      setDefaultTaxPercentage(typeof publicData.general.defaultTaxPercentage === "number" ? publicData.general.defaultTaxPercentage : 0);
      setGoogleAnalyticsEnabled(!!publicData.general.googleAnalyticsEnabled);
      setGoogleAnalyticsId(publicData.general.googleAnalyticsId?.trim() || "");
      setFacebookPixelEnabled(!!publicData.general.facebookPixelEnabled);
      setFacebookPixelId(publicData.general.facebookPixelId?.trim() || "");
      const wc = publicData.general.whatsappChat;
      setWhatsappChat({
        enabled: !!wc?.enabled,
        position: wc?.position === "left" ? "left" : "right",
        phoneNumber: (wc?.phoneNumber || "").trim(),
      });
    } else {
      setSettings(defaultSettings);
      setCouponEnabled(false);
      setShippingEnabled(false);
      setBlogEnabled(false);
      setTaxEnabled(false);
      setDefaultTaxPercentage(0);
      setGoogleAnalyticsEnabled(false);
      setGoogleAnalyticsId("");
      setFacebookPixelEnabled(false);
      setFacebookPixelId("");
      setWhatsappChat({ enabled: false, position: "right", phoneNumber: "" });
    }

    const homeData = publicData?.homepage;
    if (homeData?.hero) {
      setHero({ ...defaultHero, ...homeData.hero });
    } else {
      setHero(defaultHero);
    }
    const rawSection = homeData?.homeCategorySettings;
    setHomeCategorySettings({
      title: rawSection?.title || "Shop by Category",
      description: rawSection?.description || "",
      columns: rawSection?.columns || 4,
      limit: rawSection?.limit || 8,
      showImage: rawSection?.showImage !== false,
    });

    const header = publicData?.header;
    if (header) {
      setHeaderSettings({
        logoImageUrl: header.logoImageUrl || "",
        navLinks: Array.isArray(header.navLinks) && header.navLinks.length > 0 ? header.navLinks : defaultHeaderSettings.navLinks,
        showBrowseButton: header.showBrowseButton !== false,
        showCartIcon: header.showCartIcon !== false,
      });
    } else {
      setHeaderSettings(defaultHeaderSettings);
    }

    const footer = publicData?.footer;
    if (footer && Array.isArray(footer.columns) && footer.columns.length > 0) {
      const colTypes: FooterColumnType[] = ["links", "about", "social", "contact"];
      setFooterSettings({
        columns: footer.columns.map(
          (col: { type?: FooterColumnType; title?: string; content?: string; links?: { label: string; href: string }[] }) => ({
            type: col.type && colTypes.includes(col.type) ? col.type : "links",
            title: col.title || "",
            content: col.content ?? "",
            links: Array.isArray(col.links)
              ? col.links.map((l: { label?: string; href?: string }) => ({ label: l.label || "", href: l.href || "" }))
              : [],
          })
        ),
        copyrightText: footer.copyrightText ?? "",
        showSocial: footer.showSocial !== false,
        variant: footer.variant === "light" ? "light" : "dark",
        backgroundColor: typeof footer.backgroundColor === "string" ? footer.backgroundColor : "",
      });
    } else {
      setFooterSettings(defaultFooterSettings);
    }

    const checkout = publicData?.checkout;
    if (checkout) {
      setCheckoutSettings({
        name: {
          enabled: checkout.name?.enabled !== false,
          required: checkout.name?.required !== false,
          label: checkout.name?.label || defaultCheckoutSettings.name.label,
        },
        address: {
          enabled: checkout.address?.enabled !== false,
          required: checkout.address?.required !== false,
          label: checkout.address?.label || defaultCheckoutSettings.address.label,
        },
        city: {
          enabled: checkout.city?.enabled !== false,
          required: checkout.city?.required !== false,
          label: checkout.city?.label || defaultCheckoutSettings.city.label,
        },
        state: {
          enabled: checkout.state?.enabled !== false,
          required: !!checkout.state?.required,
          label: checkout.state?.label || defaultCheckoutSettings.state.label,
        },
        zip: {
          enabled: checkout.zip?.enabled !== false,
          required: checkout.zip?.required !== false,
          label: checkout.zip?.label || defaultCheckoutSettings.zip.label,
        },
        phone: {
          enabled: checkout.phone?.enabled !== false,
          required: checkout.phone?.required !== false,
          label: checkout.phone?.label || defaultCheckoutSettings.phone.label,
        },
        customFields: Array.isArray(checkout.customFields)
          ? checkout.customFields
              .filter((f: any) => f && (f.key || f.label))
              .map((f: any) => ({
                key: f.key || f.label || "",
                label: f.label || f.key || "",
                enabled: f.enabled !== false,
                required: !!f.required,
              }))
          : [],
        internationalShippingEnabled: checkout.internationalShippingEnabled === true,
        defaultCountry: (checkout.defaultCountry && String(checkout.defaultCountry).trim()) || "IN",
      });
    } else {
      setCheckoutSettings(defaultCheckoutSettings);
    }

    const payment = publicData?.payment;
    if (payment) {
      setPaymentSettings({
        currency: payment.currency || "INR",
        cod: { enabled: payment.cod?.enabled !== false },
        razorpay: {
          enabled: !!payment.razorpay?.enabled,
          keyId: (payment as { razorpay?: { keyId?: string } }).razorpay?.keyId ?? "",
        },
        cashfree: {
          enabled: !!payment.cashfree?.enabled,
          env: (payment as { cashfree?: { env?: string } }).cashfree?.env === "production" ? "production" : "sandbox",
        },
      });
    } else {
      setPaymentSettings(defaultPaymentSettings);
    }
  };

  const currency = paymentSettings.currency || "INR";
  const paymentMethods = buildPaymentMethods(paymentSettings);
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings: settings ?? defaultSettings,
        hero: hero ?? defaultHero,
        homeCategorySettings,
        headerSettings,
        footerSettings: footerSettings ?? defaultFooterSettings,
        checkoutSettings,
        paymentSettings: paymentSettings ?? defaultPaymentSettings,
        couponEnabled,
        shippingEnabled,
        blogEnabled,
        taxEnabled,
        defaultTaxPercentage,
        googleAnalyticsEnabled,
        googleAnalyticsId,
        facebookPixelEnabled,
        facebookPixelId,
        whatsappChat,
        currency,
        paymentMethods,
        formatCurrency,
        loading,
        refresh,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  return context;
}
