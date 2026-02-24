"use server";

import { settingsApi } from "@/lib/api";
import type { HeroSettings, HomePageSettings, PublicSettings } from "@/lib/types";
import { HeroClient } from "./HeroClient";

function buildDefaultHero(raw?: HeroSettings | null): HeroSettings {
  const base: HeroSettings = {
    layout: "single",
    slides: [
      {
        title: "Discover Amazing Products",
        subtitle: "Shop the latest trends.",
        buttonText: "Shop Now",
        buttonLink: "/shop",
        showText: true,
      },
    ],
  };

  if (!raw) return base;

  return {
    layout: (raw.layout === "no-image" ? "color" : raw.layout) || base.layout,
    colorType: raw.colorType || base.colorType,
    color1: raw.color1 || base.color1,
    color2: raw.color2 || base.color2,
    slides: Array.isArray(raw.slides) && raw.slides.length ? raw.slides : base.slides,
  };
}

export default async function Hero() {
  const res = await settingsApi.getPublic();
  const publicData = (res.data?.data || null) as PublicSettings | null;
  const homeData = publicData?.homepage as HomePageSettings | undefined;
  const raw = (homeData?.hero ?? null) as HeroSettings | null;
  const hero = buildDefaultHero(raw);

  return <HeroClient hero={hero} />;
}

