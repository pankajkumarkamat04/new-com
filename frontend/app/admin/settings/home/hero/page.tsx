"use client";

import { useEffect, useState } from "react";
import { settingsApi, getMediaUrl } from "@/lib/api";
import type { HeroSettings, HeroSlide } from "@/lib/types";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import { BackLink, Card, Button, Input, Label, LoadingState } from "@/components/ui";

const defaultSlide = { image: "", title: "Discover Amazing Products", subtitle: "Shop the latest trends.", textColor: "", buttonText: "Shop Now", buttonLink: "/shop", buttonTextColor: "#ffffff", buttonBgColor: "#059669", showText: true };

export default function AdminHeroSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<HeroSettings>({
    layout: "single",
    slides: [defaultSlide],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaForIndex, setMediaForIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    settingsApi.getHero().then((res) => {
      setLoading(false);
      if (res.data?.data) {
        const h = res.data.data;
        const layout = (h.layout === "no-image" ? "color" : h.layout || "single") as "carousel" | "single" | "color";
        const rawSlides = h.slides?.length ? h.slides : [defaultSlide];
        const globalShowText = (h as { showText?: boolean }).showText !== false;
        const slides = rawSlides.map((s) => ({
          ...s,
          showText: s.showText !== undefined ? s.showText : globalShowText,
        }));
        setForm({
          layout: layout as "carousel" | "single" | "color",
          colorType: h.colorType || "gradient",
          color1: h.color1 || "#059669",
          color2: h.color2 || "#047857",
          slides,
        });
      }
    });
  }, [mounted]);

  const handleSlideChange = (index: number, field: keyof HeroSlide, value: string | boolean) => {
    setForm((prev) => {
      const slides = [...(prev.slides || [])];
      if (!slides[index]) slides[index] = { ...defaultSlide };
      slides[index] = { ...slides[index], [field]: value };
      return { ...prev, slides };
    });
  };

  const addSlide = () => {
    setForm((prev) => ({
      ...prev,
      slides: [...(prev.slides || []), { image: "", title: "", subtitle: "", textColor: "", buttonText: "", buttonLink: "", buttonTextColor: "#ffffff", buttonBgColor: "#059669", showText: true }],
    }));
  };

  const removeSlide = (index: number) => {
    setForm((prev) => {
      const slides = prev.slides?.filter((_, i) => i !== index) || [];
      return { ...prev, slides: slides.length ? slides : [{ ...defaultSlide }] };
    });
  };

  const openMediaModal = (index: number) => {
    setMediaForIndex(index);
    setMediaModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const res = await settingsApi.updateHero(form);
    setSubmitting(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setMessage({ type: "success", text: "Hero section saved successfully" });
  };

  if (!mounted) return null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <BackLink href="/admin/settings/home" label="Back to Home Settings" />
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Hero Section</h1>

      {message && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading..." />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Layout</h2>
            <div className="flex flex-wrap gap-4">
              {(["carousel", "single", "color"] as const).map((layout) => (
                <label key={layout} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="layout"
                    value={layout}
                    checked={form.layout === layout}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        layout,
                        ...(layout === "color" && {
                          colorType: prev.colorType || "gradient",
                          color1: prev.color1 || "#059669",
                          color2: prev.color2 || "#047857",
                          slides: (prev.slides?.length ? prev.slides : [defaultSlide]).slice(0, 1),
                        }),
                      }))
                    }
                    className="h-4 w-4 text-amber-600"
                  />
                  <span className="capitalize">{layout}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Carousel = multiple slides. Single = one slide with image. Color = solid or gradient background.
            </p>
          </div>

          {/* Color options - only when layout is color */}
          {form.layout === "color" && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Color</h2>
              <div className="mb-4 flex flex-wrap gap-4">
                {(["single", "gradient"] as const).map((t) => (
                  <label key={t} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="colorType"
                      value={t}
                      checked={(form.colorType || "gradient") === t}
                      onChange={() => setForm((prev) => ({ ...prev, colorType: t }))}
                      className="h-4 w-4 text-amber-600"
                    />
                    <span className="capitalize">{t}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-6">
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Color 1</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color1 || "#059669"}
                      onChange={(e) => setForm((prev) => ({ ...prev, color1: e.target.value }))}
                      className="h-10 w-14 cursor-pointer rounded border border-slate-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={form.color1 || "#059669"}
                      onChange={(e) => setForm((prev) => ({ ...prev, color1: e.target.value }))}
                      className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                {(form.colorType || "gradient") === "gradient" && (
                  <div>
                    <label className="mb-1 block text-sm text-slate-600">Color 2</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.color2 || "#047857"}
                        onChange={(e) => setForm((prev) => ({ ...prev, color2: e.target.value }))}
                        className="h-10 w-14 cursor-pointer rounded border border-slate-300 p-0.5"
                      />
                      <input
                        type="text"
                        value={form.color2 || "#047857"}
                        onChange={(e) => setForm((prev) => ({ ...prev, color2: e.target.value }))}
                        className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Slides - only when layout is carousel or single */}
          {(form.layout === "carousel" || form.layout === "single") && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  {form.layout === "carousel" ? "Slides" : "Slide"}
                </h2>
                {form.layout === "carousel" && (
                  <button
                    type="button"
                    onClick={addSlide}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
                  >
                    Add Slide
                  </button>
                )}
              </div>
              <div className="space-y-6">
                {(form.slides || []).slice(0, form.layout === "single" ? 1 : undefined).map((slide, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 p-4">
                    {form.layout === "carousel" && (
                      <div className="mb-3 flex items-center justify-between">
                        <span className="font-medium text-slate-700">Slide {i + 1}</span>
                        {(form.slides?.length || 0) > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSlide(i)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                    <div className="mb-4 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`showText-${i}`}
                        checked={slide.showText !== false}
                        onChange={(e) => handleSlideChange(i, "showText", e.target.checked)}
                        className="h-4 w-4 rounded text-amber-600"
                      />
                      <label htmlFor={`showText-${i}`} className="text-sm font-medium text-slate-700">
                        Show text (title, subtitle, button)
                      </label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm text-slate-600">Image</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openMediaModal(i)}
                            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {slide.image ? (
                              <>
                                <img src={getMediaUrl(slide.image)} alt="" className="h-10 w-10 rounded object-cover" />
                                Change image
                              </>
                            ) : (
                              "Choose from media"
                            )}
                          </button>
                          {slide.image && (
                            <button
                              type="button"
                              onClick={() => handleSlideChange(i, "image", "")}
                              className="text-sm text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-slate-600">Title</label>
                        <input
                          type="text"
                          value={slide.title || ""}
                          onChange={(e) => handleSlideChange(i, "title", e.target.value)}
                          placeholder="Discover Amazing Products"
                          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-slate-600">Subtitle</label>
                        <input
                          type="text"
                          value={slide.subtitle || ""}
                          onChange={(e) => handleSlideChange(i, "subtitle", e.target.value)}
                          placeholder="Shop the latest trends."
                          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-slate-600">Text Color (heading & subtitle)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={slide.textColor || "#ffffff"}
                            onChange={(e) => handleSlideChange(i, "textColor", e.target.value)}
                            className="h-10 w-14 cursor-pointer rounded border border-slate-300 p-0.5"
                          />
                          <input
                            type="text"
                            value={slide.textColor || ""}
                            onChange={(e) => handleSlideChange(i, "textColor", e.target.value)}
                            placeholder="#ffffff (default)"
                            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          {slide.textColor && (
                            <button
                              type="button"
                              onClick={() => handleSlideChange(i, "textColor", "")}
                              className="text-xs text-slate-500 hover:underline"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-slate-600">Button Text</label>
                        <input
                          type="text"
                          value={slide.buttonText || ""}
                          onChange={(e) => handleSlideChange(i, "buttonText", e.target.value)}
                          placeholder="Shop Now"
                          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-slate-600">Button Link</label>
                        <input
                          type="text"
                          value={slide.buttonLink || ""}
                          onChange={(e) => handleSlideChange(i, "buttonLink", e.target.value)}
                          placeholder="/shop"
                          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-slate-600">Button Text Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={slide.buttonTextColor || "#ffffff"}
                            onChange={(e) => handleSlideChange(i, "buttonTextColor", e.target.value)}
                            className="h-10 w-14 cursor-pointer rounded border border-slate-300 p-0.5"
                          />
                          <input
                            type="text"
                            value={slide.buttonTextColor || "#ffffff"}
                            onChange={(e) => handleSlideChange(i, "buttonTextColor", e.target.value)}
                            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-slate-600">Button Background Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={slide.buttonBgColor || "#059669"}
                            onChange={(e) => handleSlideChange(i, "buttonBgColor", e.target.value)}
                            className="h-10 w-14 cursor-pointer rounded border border-slate-300 p-0.5"
                          />
                          <input
                            type="text"
                            value={slide.buttonBgColor || "#059669"}
                            onChange={(e) => handleSlideChange(i, "buttonBgColor", e.target.value)}
                            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Text content for color layout - single slide without image */}
          {form.layout === "color" && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Content</h2>
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showText-color"
                  checked={form.slides?.[0]?.showText !== false}
                  onChange={(e) => handleSlideChange(0, "showText", e.target.checked)}
                  className="h-4 w-4 rounded text-amber-600"
                />
                <label htmlFor="showText-color" className="text-sm font-medium text-slate-700">
                  Show text (title, subtitle, button)
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Title</label>
                  <input
                    type="text"
                    value={form.slides?.[0]?.title || ""}
                    onChange={(e) => handleSlideChange(0, "title", e.target.value)}
                    placeholder="Discover Amazing Products"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Subtitle</label>
                  <input
                    type="text"
                    value={form.slides?.[0]?.subtitle || ""}
                    onChange={(e) => handleSlideChange(0, "subtitle", e.target.value)}
                    placeholder="Shop the latest trends."
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Text Color (heading & subtitle)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.slides?.[0]?.textColor || "#ffffff"}
                      onChange={(e) => handleSlideChange(0, "textColor", e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-slate-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={form.slides?.[0]?.textColor || ""}
                      onChange={(e) => handleSlideChange(0, "textColor", e.target.value)}
                      placeholder="#ffffff (default)"
                      className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    {form.slides?.[0]?.textColor && (
                      <button
                        type="button"
                        onClick={() => handleSlideChange(0, "textColor", "")}
                        className="text-xs text-slate-500 hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Button Text</label>
                  <input
                    type="text"
                    value={form.slides?.[0]?.buttonText || ""}
                    onChange={(e) => handleSlideChange(0, "buttonText", e.target.value)}
                    placeholder="Shop Now"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Button Link</label>
                  <input
                    type="text"
                    value={form.slides?.[0]?.buttonLink || ""}
                    onChange={(e) => handleSlideChange(0, "buttonLink", e.target.value)}
                    placeholder="/shop"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Button Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.slides?.[0]?.buttonTextColor || "#ffffff"}
                      onChange={(e) => handleSlideChange(0, "buttonTextColor", e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-slate-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={form.slides?.[0]?.buttonTextColor || "#ffffff"}
                      onChange={(e) => handleSlideChange(0, "buttonTextColor", e.target.value)}
                      className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Button Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.slides?.[0]?.buttonBgColor || "#059669"}
                      onChange={(e) => handleSlideChange(0, "buttonBgColor", e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-slate-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={form.slides?.[0]?.buttonBgColor || "#059669"}
                      onChange={(e) => handleSlideChange(0, "buttonBgColor", e.target.value)}
                      className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <MediaPickerModal
            open={mediaModalOpen}
            onClose={() => setMediaModalOpen(false)}
            onSelect={(url) => {
              if (mediaForIndex !== null) {
                handleSlideChange(mediaForIndex, "image", url);
              }
            }}
            title="Select image"
            type="image"
          />

          <Button type="submit" variant="primaryAmber" disabled={submitting}>
            {submitting ? "Saving..." : "Save Hero Section"}
          </Button>
        </form>
      )}
    </div>
  );
}
