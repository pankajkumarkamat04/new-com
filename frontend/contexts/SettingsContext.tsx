"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  settingsApi,
  type Settings,
  type HeroSettings,
  type HomePageSettings,
  type HomeCategorySettings,
  type HeaderSettings,
  type CheckoutSettings,
  type PublicSettings,
} from "@/lib/api";

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
};

type SettingsContextType = {
  settings: Settings;
  hero: HeroSettings;
  homeCategorySettings: HomeCategorySettings;
  headerSettings: HeaderSettings;
  checkoutSettings: CheckoutSettings;
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
   checkoutSettings: defaultCheckoutSettings,
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
  const [checkoutSettings, setCheckoutSettings] = useState<CheckoutSettings>(defaultCheckoutSettings);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [publicRes, homePageRes] = await Promise.all([
      settingsApi.getPublic(),
      settingsApi.getHomePage(),
    ]);

    const publicData = (publicRes.data?.data || null) as PublicSettings | null;

    if (publicData?.general) {
      setSettings({ ...defaultSettings, ...publicData.general });
    } else {
      setSettings(defaultSettings);
    }

    const homeData = (homePageRes.data?.data || null) as HomePageSettings | null;
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
              .filter((f) => f && (f.key || f.label))
              .map((f) => ({
                key: f.key || f.label || "",
                label: f.label || f.key || "",
                enabled: f.enabled !== false,
                required: !!f.required,
              }))
          : [],
      });
    } else {
      setCheckoutSettings(defaultCheckoutSettings);
    }
  };

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
        checkoutSettings,
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
