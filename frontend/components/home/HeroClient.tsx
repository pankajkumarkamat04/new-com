"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getMediaUrl } from "@/lib/api";
import type { HeroSettings, HeroSlide } from "@/lib/types";

function SlideContent({ slide, showText, dark = false }: { slide: HeroSlide; showText: boolean; dark?: boolean }) {
  if (!showText) return null;
  const defaultTextColor = dark ? "#ffffff" : "#0f172a";
  const textColor = slide.textColor || defaultTextColor;
  return (
    <div className="text-center" style={{ color: textColor }}>
      {slide.title && (
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          {slide.title}
        </h1>
      )}
      {slide.subtitle && (
        <p className="mx-auto mt-6 max-w-2xl text-lg opacity-90">
          {slide.subtitle}
        </p>
      )}
      {slide.buttonText && (
        <div className="mt-10">
          <Link
            href={slide.buttonLink || "/shop"}
            className="inline-block rounded-xl px-8 py-4 text-base font-semibold shadow-lg transition hover:opacity-90"
            style={{
              color: slide.buttonTextColor || "#ffffff",
              backgroundColor: slide.buttonBgColor || "#059669",
            }}
          >
            {slide.buttonText}
          </Link>
        </div>
      )}
    </div>
  );
}

type Props = {
  hero: HeroSettings;
};

export function HeroClient({ hero }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = hero.slides?.length ? hero.slides : [
    { title: "Discover Amazing Products", subtitle: "Shop the latest trends.", buttonText: "Shop Now", buttonLink: "/shop" },
  ];
  const currentSlide = slides[activeIndex];

  const isCarousel = hero.layout === "carousel";
  const hasImage = hero.layout !== "color";

  useEffect(() => {
    if (!isCarousel || slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isCarousel, slides.length]);

  if (hero.layout === "color" || hero.layout === "no-image") {
    const colorType = hero.colorType || "gradient";
    const color1 = hero.color1 || "#059669";
    const color2 = hero.color2 || "#047857";
    const bgStyle =
      colorType === "single"
        ? { backgroundColor: color1 }
        : { background: `linear-gradient(to bottom right, ${color1}, ${color2})` };
    return (
      <section className="relative overflow-hidden" style={bgStyle}>
        <div className="mx-auto flex min-h-[40vh] max-w-7xl items-center justify-center px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <SlideContent slide={currentSlide} showText={currentSlide?.showText !== false} dark={true} />
        </div>
      </section>
    );
  }

  if (hero.layout === "single") {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-slate-50">
        {hasImage && currentSlide?.image ? (
          <div className="relative">
            <img
              src={getMediaUrl(currentSlide.image)}
              alt={currentSlide.title || "Hero"}
              className="h-[60vh] w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <SlideContent slide={currentSlide} showText={currentSlide?.showText !== false} dark={true} />
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <SlideContent slide={currentSlide} showText={currentSlide?.showText !== false} dark={false} />
          </div>
        )}
      </section>
    );
  }

  if (hero.layout === "carousel") {
    return (
      <section className="relative overflow-hidden bg-slate-900">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-500 ${
              i === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            {hasImage && slide.image ? (
              <>
                <img
                  src={getMediaUrl(slide.image)}
                  alt={slide.title || `Slide ${i + 1}`}
                  className="h-[70vh] w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <SlideContent slide={slide} showText={slide.showText !== false} dark={true} />
                </div>
              </>
            ) : (
              <div className="flex h-[70vh] items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-800">
                <SlideContent slide={slide} showText={slide.showText !== false} dark={true} />
              </div>
            )}
          </div>
        ))}
        {slides.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex((i) => (i - 1 + slides.length) % slides.length)}
              className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
              aria-label="Previous"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setActiveIndex((i) => (i + 1) % slides.length)}
              className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
              aria-label="Next"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-2 w-2 rounded-full transition ${
                    i === activeIndex ? "bg-white" : "bg-white/50"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>
    );
  }

  return null;
}

