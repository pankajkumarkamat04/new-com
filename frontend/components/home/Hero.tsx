"use server";

import { settingsApi, type HeroSettings } from "@/lib/api";
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
  const res = await settingsApi.getHomePage();
  const raw = (res.data?.data?.hero ?? null) as HeroSettings | null;
  const hero = buildDefaultHero(raw);

  return <HeroClient hero={hero} />;
}

