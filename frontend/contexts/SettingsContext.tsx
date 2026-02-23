"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { settingsApi, type Settings, type HeroSettings, type HomePageSettings, type HomeCategorySettings } from "@/lib/api";

const defaultHero: HeroSettings = {
  layout: 'single',
  slides: [{ title: 'Discover Amazing Products', subtitle: 'Shop the latest trends.', buttonText: 'Shop Now', buttonLink: '/shop', showText: true }],
};

type SettingsContextType = {
  settings: Settings;
  hero: HeroSettings;
  homeCategorySettings: HomeCategorySettings;
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
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [settingsRes, homePageRes] = await Promise.all([
      settingsApi.get(),
      settingsApi.getHomePage(),
    ]);
    if (settingsRes.data?.data) {
      setSettings({ ...defaultSettings, ...settingsRes.data.data });
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
