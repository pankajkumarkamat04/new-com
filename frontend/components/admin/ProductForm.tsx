"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { productApi, getMediaUrl } from "@/lib/api";
import type { Product, Category } from "@/lib/types";
import MediaPickerModal from "@/components/admin/MediaPickerModal";

type MediaPickerContext =
  | { type: "product-main" }
  | { type: "product-gallery" }
  | { type: "variation-main"; index: number }
  | { type: "variation-gallery"; index: number };

const INITIAL_FORM = {
  name: "",
  description: "",
  price: "",
  discountedPrice: "",
  category: "",
  stockManagement: "manual" as "manual" | "inventory",
  sku: "",
  stock: "0",
  image: "",
  images: [] as string[],
  attributes: [] as { name: string; terms: string[] }[],
  defaultVariationIndex: 0,
  variations: [] as {
    price: string;
    discountedPrice: string;
    stockManagement: "manual" | "inventory";
    sku: string;
    stock: string;
    image: string;
    images: string[];
    attributes: { name: string; value: string }[];
    isActive: boolean;
  }[],
  isActive: true,
};

const ATTRIBUTE_PRESETS: { name: string; terms: string[] }[] = [
  { name: "Size", terms: ["XS", "S", "M", "L", "XL", "XXL"] },
  { name: "Color", terms: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Pink", "Orange", "Purple", "Brown", "Grey", "Navy"] },
  { name: "Material", terms: ["Cotton", "Polyester", "Silk", "Wool", "Linen", "Denim", "Leather", "Nylon"] },
  { name: "Weight", terms: ["250g", "500g", "1kg", "2kg", "5kg"] },
  { name: "Style", terms: ["Regular", "Slim Fit", "Relaxed", "Oversized"] },
  { name: "Pattern", terms: ["Solid", "Striped", "Checked", "Printed", "Floral", "Polka Dot"] },
  { name: "Sleeve", terms: ["Full Sleeve", "Half Sleeve", "Sleeveless", "3/4 Sleeve"] },
  { name: "Fit", terms: ["Regular", "Slim", "Loose", "Tailored"] },
  { name: "Storage", terms: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"] },
  { name: "RAM", terms: ["4GB", "6GB", "8GB", "12GB", "16GB", "32GB"] },
  { name: "Pack", terms: ["Pack of 1", "Pack of 2", "Pack of 3", "Pack of 5", "Pack of 10"] },
];

type ProductFormProps = {
  product: Product | null;
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
};

export default function ProductForm({ product, categories, onSuccess, onCancel }: ProductFormProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerCtx, setMediaPickerCtx] = useState<MediaPickerContext | null>(null);
  const [newTermInputs, setNewTermInputs] = useState<Record<number, string>>({});
  const [newAttrName, setNewAttrName] = useState("");
  const [bulkAttr, setBulkAttr] = useState("");
  const [bulkTerm, setBulkTerm] = useState("");
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkDiscounted, setBulkDiscounted] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const [bulkStockManagement, setBulkStockManagement] = useState<"" | "manual" | "inventory">("");

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description || "",
        price: String(product.price),
        discountedPrice: product.discountedPrice ? String(product.discountedPrice) : "",
        category: product.category || "",
        stockManagement: product.stockManagement === "inventory" ? "inventory" : "manual",
        sku: product.sku || "",
        stock: String(product.stock),
        image: product.image || "",
        images: Array.isArray(product.images) ? product.images.slice(0, 5) : [],
        attributes: Array.isArray(product.attributes)
          ? product.attributes.map((a) => ({ name: a.name, terms: [...a.terms] }))
          : [],
        defaultVariationIndex: typeof product.defaultVariationIndex === "number" ? product.defaultVariationIndex : 0,
        variations: Array.isArray(product.variations)
          ? product.variations.map((v) => ({
              price: String(v.price),
              discountedPrice: v.discountedPrice ? String(v.discountedPrice) : "",
              stockManagement: v.stockManagement === "inventory" ? "inventory" : "manual",
              sku: v.sku || "",
              stock: String(v.stock ?? 0),
              image: v.image || "",
              images: Array.isArray(v.images) ? v.images.slice(0, 5) : [],
              attributes: Array.isArray(v.attributes)
                ? v.attributes.map((a) => ({ name: a.name || "", value: a.value || "" }))
                : [],
              isActive: v.isActive !== false,
            }))
          : [],
        isActive: product.isActive,
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setShowMediaPicker(false);
    setMediaPickerCtx(null);
    setNewTermInputs({});
    setNewAttrName("");
    setError("");
    setBulkAttr("");
    setBulkTerm("");
    setBulkPrice("");
    setBulkDiscounted("");
    setBulkStock("");
    setBulkStockManagement("");
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const basePrice = parseFloat(form.price);
    const baseDiscounted = form.discountedPrice ? parseFloat(form.discountedPrice) : undefined;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: basePrice,
      discountedPrice:
        typeof baseDiscounted === "number" && !isNaN(baseDiscounted) && baseDiscounted >= 0
          ? baseDiscounted
          : undefined,
      category: form.category.trim() || undefined,
      stockManagement: form.stockManagement,
      sku: form.stockManagement === "inventory" ? (form.sku.trim() || undefined) : undefined,
      stock: form.stockManagement === "manual" ? (parseInt(form.stock, 10) || 0) : 0,
      image: form.image.trim() || undefined,
      images: form.images.filter((url) => url.trim()).slice(0, 5),
      attributes: form.attributes
        .filter((a) => a.name.trim() && a.terms.length > 0)
        .map((a) => ({
          name: a.name.trim(),
          terms: a.terms.map((t) => t.trim()).filter(Boolean),
        })),
      defaultVariationIndex: Math.max(0, Math.min(form.defaultVariationIndex, form.variations.length - 1)),
      variations: form.variations
        .map((v) => {
          const vPrice = parseFloat(v.price);
          const vDiscounted = v.discountedPrice ? parseFloat(v.discountedPrice) : undefined;
          const attrs = v.attributes
            .map((a) => ({ name: a.name.trim(), value: a.value.trim() }))
            .filter((a) => a.name && a.value);
          const autoName = attrs.map((a) => a.value).join(" / ") || "Variation";
          return {
            name: autoName,
            price: vPrice,
            discountedPrice:
              typeof vDiscounted === "number" && !isNaN(vDiscounted) && vDiscounted >= 0
                ? vDiscounted
                : undefined,
            stockManagement: v.stockManagement || "manual",
            sku: v.stockManagement === "inventory" ? (v.sku?.trim() || undefined) : undefined,
            stock: v.stockManagement === "manual" ? (parseInt(v.stock, 10) || 0) : 0,
            image: v.image.trim() || undefined,
            images: v.images.filter((url) => url.trim()).slice(0, 5),
            attributes: attrs.length ? attrs : undefined,
            isActive: v.isActive,
          };
        })
        .filter((v) => !isNaN(v.price) && v.price >= 0),
      isActive: form.isActive,
    };

    if (!payload.name || isNaN(basePrice) || basePrice < 0) {
      setError("Name and valid price are required");
      setSubmitting(false);
      return;
    }

    if (product) {
      const res = await productApi.update(product._id, payload);
      setSubmitting(false);
      if (res.error) setError(res.error);
      else onSuccess();
    } else {
      const res = await productApi.create(payload);
      setSubmitting(false);
      if (res.error) setError(res.error);
      else onSuccess();
    }
  };

  const openMediaPicker = (ctx: MediaPickerContext) => {
    setMediaPickerCtx(ctx);
    setShowMediaPicker(true);
  };

  const handleMediaSelect = (url: string) => {
    if (!mediaPickerCtx) return;
    setForm((prev) => {
      if (mediaPickerCtx.type === "product-main") return { ...prev, image: url };
      if (mediaPickerCtx.type === "product-gallery") {
        const imgs = prev.images || [];
        if (imgs.length < 5 && !imgs.includes(url)) return { ...prev, images: [...imgs, url] };
        return prev;
      }
      if (mediaPickerCtx.type === "variation-main") {
        const next = [...prev.variations];
        next[mediaPickerCtx.index] = { ...next[mediaPickerCtx.index], image: url };
        return { ...prev, variations: next };
      }
      if (mediaPickerCtx.type === "variation-gallery") {
        const next = [...prev.variations];
        const v = next[mediaPickerCtx.index];
        if (v.images.length < 5 && !v.images.includes(url)) {
          next[mediaPickerCtx.index] = { ...v, images: [...v.images, url] };
        }
        return { ...prev, variations: next };
      }
      return prev;
    });
    setShowMediaPicker(false);
    setMediaPickerCtx(null);
  };

  const addPresetAttribute = (preset: { name: string; terms: string[] }) => {
    if (form.attributes.some((a) => a.name.toLowerCase() === preset.name.toLowerCase())) return;
    setForm((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { name: preset.name, terms: [...preset.terms] }],
    }));
  };

  const addAttribute = () => {
    const trimmed = newAttrName.trim();
    if (!trimmed) return;
    if (form.attributes.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) return;
    setForm((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { name: trimmed, terms: [] }],
    }));
    setNewAttrName("");
  };

  const removeAttribute = (attrIdx: number) => {
    setForm((prev) => {
      const removedName = prev.attributes[attrIdx].name;
      return {
        ...prev,
        attributes: prev.attributes.filter((_, i) => i !== attrIdx),
        variations: prev.variations.map((v) => ({
          ...v,
          attributes: v.attributes.filter((a) => a.name !== removedName),
        })),
      };
    });
  };

  const addTerm = (attrIdx: number) => {
    const term = (newTermInputs[attrIdx] || "").trim();
    if (!term) return;
    setForm((prev) => {
      const attrs = [...prev.attributes];
      if (attrs[attrIdx].terms.some((t) => t.toLowerCase() === term.toLowerCase())) return prev;
      attrs[attrIdx] = { ...attrs[attrIdx], terms: [...attrs[attrIdx].terms, term] };
      return { ...prev, attributes: attrs };
    });
    setNewTermInputs((prev) => ({ ...prev, [attrIdx]: "" }));
  };

  const removeTerm = (attrIdx: number, termIdx: number) => {
    setForm((prev) => {
      const attrs = [...prev.attributes];
      const removedTerm = attrs[attrIdx].terms[termIdx];
      const attrName = attrs[attrIdx].name;
      attrs[attrIdx] = { ...attrs[attrIdx], terms: attrs[attrIdx].terms.filter((_, i) => i !== termIdx) };
      return {
        ...prev,
        attributes: attrs,
        variations: prev.variations.filter(
          (v) => !v.attributes.some((a) => a.name === attrName && a.value === removedTerm)
        ),
      };
    });
  };

  const addVariation = () => {
    setForm((prev) => ({
      ...prev,
      variations: [
        ...prev.variations,
        {
          price: prev.price || "",
          discountedPrice: prev.discountedPrice || "",
          stockManagement: "manual" as const,
          sku: "",
          stock: "0",
          image: "",
          images: [],
          attributes: prev.attributes.map((a) => ({ name: a.name, value: a.terms[0] || "" })),
          isActive: true,
        },
      ],
    }));
  };

  const generateAllCombinations = () => {
    const attrs = form.attributes.filter((a) => a.terms.length > 0);
    if (attrs.length === 0) return;

    let combos: { name: string; value: string }[][] = [[]];
    for (const attr of attrs) {
      const next: { name: string; value: string }[][] = [];
      for (const combo of combos) {
        for (const term of attr.terms) {
          next.push([...combo, { name: attr.name, value: term }]);
        }
      }
      combos = next;
    }

    const existingKeys = new Set(
      form.variations.map((v) =>
        v.attributes.map((a) => `${a.name}:${a.value}`).sort().join("|")
      )
    );

    const newVariations = combos
      .filter((combo) => {
        const key = combo.map((a) => `${a.name}:${a.value}`).sort().join("|");
        return !existingKeys.has(key);
      })
      .map((combo) => ({
        price: form.price || "",
        discountedPrice: form.discountedPrice || "",
        stockManagement: "manual" as const,
        sku: "",
        stock: "0",
        image: "",
        images: [] as string[],
        attributes: combo,
        isActive: true,
      }));

    if (newVariations.length === 0) return;
    setForm((prev) => ({
      ...prev,
      variations: [...prev.variations, ...newVariations],
    }));
  };

  const bulkTermOptions: string[] = bulkAttr === "__all__" ? [] : (form.attributes.find((a) => a.name === bulkAttr)?.terms || []);

  const applyBulkPricing = () => {
    setForm((prev) => ({
      ...prev,
      variations: prev.variations.map((v) => {
        const matches = bulkAttr === "__all__" || v.attributes.some((a) => a.name === bulkAttr && a.value === bulkTerm);
        if (!matches) return v;
        const updates: Record<string, unknown> = {};
        if (bulkPrice !== "") updates.price = bulkPrice;
        if (bulkDiscounted !== "") updates.discountedPrice = bulkDiscounted;
        if (bulkStock !== "" && (bulkStockManagement === "manual" || v.stockManagement === "manual")) updates.stock = bulkStock;
        if (bulkStockManagement) {
          updates.stockManagement = bulkStockManagement;
          updates.sku = "";
        }
        return { ...v, ...updates };
      }),
    }));
  };

  const hasBulkValues = bulkPrice !== "" || bulkDiscounted !== "" || bulkStock !== "" || bulkStockManagement !== "";

  const resetBulkForm = () => {
    setBulkAttr("");
    setBulkTerm("");
    setBulkPrice("");
    setBulkDiscounted("");
    setBulkStock("");
    setBulkStockManagement("");
  };

  const hasAttributes = form.attributes.length > 0;
  const hasTerms = form.attributes.some((a) => a.terms.length > 0);

  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        {product ? "Edit Product" : "Add Product"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Price *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Discounted price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.discountedPrice}
              onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="Optional"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">Stock management</label>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="stockManagement"
                  checked={form.stockManagement === "manual"}
                  onChange={() => {
                    if (form.sku) {
                      const ok = window.confirm(
                        "Switching to Enter stock will remove the product SKU and this product will no longer appear in Inventory. Past inventory movements will remain for records. Continue?"
                      );
                      if (!ok) return;
                    }
                    setForm({ ...form, stockManagement: "manual", sku: "" });
                  }}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm">Enter stock</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="stockManagement"
                  checked={form.stockManagement === "inventory"}
                  onChange={() => setForm({ ...form, stockManagement: "inventory" })}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm">Manage with Inventory</span>
              </label>
            </div>
            {form.stockManagement === "manual" ? (
              <div className="mt-2">
                {product && product.stockManagement === "inventory" && product.sku && (
                  <p className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    ⚠️ Switching to Enter stock will remove the product SKU and remove this product from the Inventory module. Past inventory movements will remain for records.
                  </p>
                )}
                <label className="mb-1 block text-xs text-slate-500">Stock</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                SKU will be auto-generated on save. Manage stock via{" "}
                <Link href="/admin/inventory" className="text-amber-600 hover:underline">Inventory</Link>.
                {form.sku && <span className="mt-1 block font-mono text-slate-700">SKU: {form.sku}</span>}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Main image</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openMediaPicker({ type: "product-main" })}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {form.image ? (
                <>
                  <img src={getMediaUrl(form.image)} alt="" className="h-10 w-10 rounded object-cover" />
                  Change image
                </>
              ) : (
                "Choose from media"
              )}
            </button>
            {form.image && (
              <button type="button" onClick={() => setForm({ ...form, image: "" })} className="text-sm text-red-600 hover:underline">
                Remove
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Additional images (up to 5)</label>
          <div className="flex flex-wrap gap-3">
            {form.images.map((img, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className="h-16 w-16 overflow-hidden rounded border border-slate-300 bg-slate-50">
                  <img src={getMediaUrl(img)} alt={`Image ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, images: form.images.filter((_, i) => i !== idx) })}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
            {form.images.length < 5 && (
              <button
                type="button"
                onClick={() => openMediaPicker({ type: "product-gallery" })}
                className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-slate-300 text-xs text-slate-500 hover:border-amber-400 hover:text-amber-600"
              >
                + Add
              </button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-1 text-sm font-semibold text-slate-700">Step 1: Attributes</h3>
          <p className="mb-3 text-xs text-slate-500">
            Define attribute types for this product (e.g. Size, Color, Material).
          </p>
          {form.attributes.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {form.attributes.map((attr, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                  {attr.name}
                  <button type="button" onClick={() => removeAttribute(idx)} className="text-amber-600 hover:text-red-600">&times;</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newAttrName}
              onChange={(e) => setNewAttrName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAttribute(); } }}
              placeholder="Attribute name (e.g. Size)"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button type="button" onClick={addAttribute} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500">
              Add
            </button>
          </div>
          {ATTRIBUTE_PRESETS.filter((p) => !form.attributes.some((a) => a.name.toLowerCase() === p.name.toLowerCase())).length > 0 && (
            <div className="mt-3 border-t border-slate-200 pt-3">
              <span className="mb-1.5 block text-[11px] font-medium uppercase text-slate-400">Quick add presets</span>
              <div className="flex flex-wrap gap-1.5">
                {ATTRIBUTE_PRESETS.filter((p) => !form.attributes.some((a) => a.name.toLowerCase() === p.name.toLowerCase())).map((preset) => (
                  <button key={preset.name} type="button" onClick={() => addPresetAttribute(preset)} className="rounded-full border border-dashed border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700">
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {hasAttributes && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-1 text-sm font-semibold text-slate-700">Step 2: Terms</h3>
            <p className="mb-3 text-xs text-slate-500">Add values for each attribute (e.g. S, M, L, XL for Size).</p>
            <div className="space-y-3">
              {form.attributes.map((attr, attrIdx) => (
                <div key={attrIdx}>
                  <label className="mb-1 block text-xs font-medium text-slate-600">{attr.name}</label>
                  {attr.terms.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {attr.terms.map((term, termIdx) => (
                        <span key={termIdx} className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {term}
                          <button type="button" onClick={() => removeTerm(attrIdx, termIdx)} className="text-slate-400 hover:text-red-600">&times;</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTermInputs[attrIdx] || ""}
                      onChange={(e) => setNewTermInputs((prev) => ({ ...prev, [attrIdx]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTerm(attrIdx); } }}
                      placeholder={`Add ${attr.name} value...`}
                      className="flex-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                    <button type="button" onClick={() => addTerm(attrIdx)} className="rounded bg-slate-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-600">
                      Add
                    </button>
                  </div>
                  {(() => {
                    const preset = ATTRIBUTE_PRESETS.find((p) => p.name.toLowerCase() === attr.name.toLowerCase());
                    if (!preset) return null;
                    const suggestions = preset.terms.filter((t) => !attr.terms.some((existing) => existing.toLowerCase() === t.toLowerCase()));
                    if (suggestions.length === 0) return null;
                    return (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {suggestions.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() =>
                              setForm((prev) => {
                                const attrs = [...prev.attributes];
                                if (attrs[attrIdx].terms.some((t) => t.toLowerCase() === term.toLowerCase())) return prev;
                                attrs[attrIdx] = { ...attrs[attrIdx], terms: [...attrs[attrIdx].terms, term] };
                                return { ...prev, attributes: attrs };
                              })
                            }
                            className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[10px] text-slate-500 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
                          >
                            + {term}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasTerms && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-1 text-sm font-semibold text-slate-700">Step 3: Variations</h3>
            <p className="mb-3 text-xs text-slate-500">
              Create variations by picking terms. Each variation has its own pricing, stock, and images.
            </p>
            <div className="mb-3 flex gap-2">
              <button type="button" onClick={addVariation} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                + Add Variation
              </button>
              <button type="button" onClick={generateAllCombinations} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500">
                Generate All Combinations
              </button>
            </div>

            {form.variations.length > 0 && (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <h4 className="mb-2 text-xs font-semibold text-amber-800">Bulk Set Pricing</h4>
                <div className="grid gap-2 sm:grid-cols-7">
                  <div>
                    <label className="mb-0.5 block text-[10px] font-medium text-amber-700">Attribute</label>
                    <select value={bulkAttr} onChange={(e) => { setBulkAttr(e.target.value); setBulkTerm(""); }} className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-amber-500 focus:outline-none">
                      <option value="">Select...</option>
                      <option value="__all__">All Variations</option>
                      {form.attributes.map((attr) => (
                        <option key={attr.name} value={attr.name}>{attr.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-medium text-amber-700">Term</label>
                    <select value={bulkTerm} onChange={(e) => setBulkTerm(e.target.value)} disabled={!bulkAttr || bulkAttr === "__all__"} className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-amber-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400">
                      <option value="">{bulkAttr === "__all__" ? "N/A" : "Select..."}</option>
                      {bulkTermOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-medium text-amber-700">Price</label>
                    <input type="number" min="0" step="0.01" value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)} placeholder="Price" className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-medium text-amber-700">Discounted</label>
                    <input type="number" min="0" step="0.01" value={bulkDiscounted} onChange={(e) => setBulkDiscounted(e.target.value)} placeholder="Optional" className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-medium text-amber-700">Stock</label>
                    <input type="number" min="0" value={bulkStock} onChange={(e) => setBulkStock(e.target.value)} placeholder="Stock" className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-medium text-amber-700">Stock Mgmt</label>
                    <select value={bulkStockManagement} onChange={(e) => setBulkStockManagement((e.target.value || "") as "" | "manual" | "inventory")} className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-amber-500 focus:outline-none">
                      <option value="">Skip</option>
                      <option value="manual">Enter stock</option>
                      <option value="inventory">Manage with Inventory</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!bulkAttr) return;
                        if (bulkAttr !== "__all__" && !bulkTerm) return;
                        if (!hasBulkValues) return;
                        if (bulkStockManagement === "manual") {
                          const targeted = form.variations.filter((v) => bulkAttr === "__all__" || v.attributes.some((a) => a.name === bulkAttr && a.value === bulkTerm));
                          const willRemoveSku = targeted.some((v) => v.stockManagement === "inventory" && v.sku);
                          if (willRemoveSku && !window.confirm("This will switch selected variations to Enter stock and remove their SKUs. They will no longer appear in Inventory. Continue?")) return;
                        }
                        applyBulkPricing();
                        resetBulkForm();
                      }}
                      disabled={!bulkAttr || (bulkAttr !== "__all__" && !bulkTerm) || !hasBulkValues}
                      className="rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-amber-500 disabled:opacity-40"
                    >
                      Apply
                    </button>
                    <button type="button" onClick={resetBulkForm} className="rounded border border-amber-300 bg-white px-2 py-1 text-xs text-amber-700 transition hover:bg-amber-100">
                      Clear
                    </button>
                  </div>
                </div>
                {bulkStockManagement === "manual" && form.variations.some((v) => v.stockManagement === "inventory" && v.sku && (bulkAttr === "__all__" || v.attributes.some((a) => a.name === bulkAttr && a.value === bulkTerm))) && (
                  <p className="mt-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-[10px] text-amber-800">
                    ⚠️ Selecting &quot;Enter stock&quot; will remove SKUs from targeted variations. They will no longer appear in Inventory.
                  </p>
                )}
                <p className="mt-1.5 text-[10px] text-amber-600">
                  Select &quot;All Variations&quot; or an attribute + term (e.g. Color = Red) to target variations. Set Price, Discounted, Stock, or Stock Mgmt. Leave fields empty to skip.
                </p>
              </div>
            )}

            {form.variations.length > 0 && (
              <div className="mb-3 flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600">Default variation (shown first on product page):</label>
                <select
                  value={form.defaultVariationIndex}
                  onChange={(e) => setForm((prev) => ({ ...prev, defaultVariationIndex: parseInt(e.target.value, 10) || 0 }))}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                >
                  {form.variations.map((v, idx) => {
                    const varName = v.attributes.map((a) => a.value).filter(Boolean).join(" / ") || `Variation ${idx + 1}`;
                    return <option key={idx} value={idx}>{varName}</option>;
                  })}
                </select>
              </div>
            )}

            {form.variations.length === 0 ? (
              <p className="text-xs text-slate-500">No variations yet.</p>
            ) : (
              <div className="space-y-3">
                {form.variations.map((v, idx) => {
                  const varName = v.attributes.map((a) => a.value).filter(Boolean).join(" / ") || `Variation ${idx + 1}`;
                  if (idx === form.defaultVariationIndex) {
                    return (
                      <div key={idx} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs text-amber-800">
                          <strong>Default variation:</strong> {varName} — uses product main image and details.
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={v.isActive}
                            onChange={(e) => setForm((prev) => {
                              const next = [...prev.variations];
                              next[idx] = { ...next[idx], isActive: e.target.checked };
                              return { ...prev, variations: next };
                            })}
                            className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-xs font-semibold text-slate-800">{varName}</span>
                        </div>
                        <button type="button" onClick={() => setForm((prev) => ({ ...prev, variations: prev.variations.filter((_, i) => i !== idx) }))} className="text-xs text-red-600 hover:underline">
                          Remove
                        </button>
                      </div>
                      <div className="mb-2 grid gap-2 sm:grid-cols-2">
                        {form.attributes.map((attr) => (
                          <div key={attr.name}>
                            <label className="mb-0.5 block text-[11px] font-medium text-slate-500">{attr.name}</label>
                            <select
                              value={v.attributes.find((a) => a.name === attr.name)?.value || ""}
                              onChange={(e) => setForm((prev) => {
                                const next = [...prev.variations];
                                const cur = next[idx];
                                const attrs = cur.attributes.filter((a) => a.name !== attr.name);
                                if (e.target.value) attrs.push({ name: attr.name, value: e.target.value });
                                next[idx] = { ...cur, attributes: attrs };
                                return { ...prev, variations: next };
                              })}
                              className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                            >
                              <option value="">Select {attr.name}</option>
                              {attr.terms.map((term) => (
                                <option key={term} value={term}>{term}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <div className="grid gap-2 sm:grid-cols-4">
                          <div>
                            <label className="mb-0.5 block text-[11px] font-medium text-slate-500">Price *</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={v.price}
                              onChange={(e) => setForm((prev) => {
                                const next = [...prev.variations];
                                next[idx] = { ...next[idx], price: e.target.value };
                                return { ...prev, variations: next };
                              })}
                              className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-0.5 block text-[11px] font-medium text-slate-500">Discounted</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={v.discountedPrice}
                              onChange={(e) => setForm((prev) => {
                                const next = [...prev.variations];
                                next[idx] = { ...next[idx], discountedPrice: e.target.value };
                                return { ...prev, variations: next };
                              })}
                              placeholder="Optional"
                              className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-0.5 block text-[11px] font-medium text-slate-500">Stock</label>
                            <div className="flex gap-2">
                              <label className="flex items-center gap-1">
                                <input
                                  type="radio"
                                  checked={v.stockManagement === "manual"}
                                  onChange={() => {
                                    if (v.sku) {
                                      if (!window.confirm("Switching to Enter stock will remove this variation's SKU. It will no longer appear in Inventory. Continue?")) return;
                                    }
                                    setForm((prev) => {
                                      const next = [...prev.variations];
                                      next[idx] = { ...next[idx], stockManagement: "manual" as const, sku: "" };
                                      return { ...prev, variations: next };
                                    });
                                  }}
                                  className="text-amber-600"
                                />
                                <span className="text-[10px]">Enter</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input
                                  type="radio"
                                  checked={v.stockManagement === "inventory"}
                                  onChange={() => setForm((prev) => {
                                    const next = [...prev.variations];
                                    next[idx] = { ...next[idx], stockManagement: "inventory" };
                                    return { ...prev, variations: next };
                                  })}
                                  className="text-amber-600"
                                />
                                <span className="text-[10px]">Inventory</span>
                              </label>
                            </div>
                            {v.stockManagement === "manual" ? (
                              <input
                                type="number"
                                min="0"
                                value={v.stock}
                                onChange={(e) => setForm((prev) => {
                                  const next = [...prev.variations];
                                  next[idx] = { ...next[idx], stock: e.target.value };
                                  return { ...prev, variations: next };
                                })}
                                className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                              />
                            ) : (
                              <p className="mt-1 text-[10px] text-slate-500">SKU auto-generated{v.sku ? `: ${v.sku}` : ""}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-[auto,1fr]">
                        <div>
                          <label className="mb-0.5 block text-[11px] font-medium text-slate-500">Image</label>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => openMediaPicker({ type: "variation-main", index: idx })} className="flex items-center gap-1.5 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">
                              {v.image ? (
                                <>
                                  <img src={getMediaUrl(v.image)} alt="" className="h-6 w-6 rounded object-cover" />
                                  Change
                                </>
                              ) : (
                                "Choose"
                              )}
                            </button>
                            {v.image && (
                              <button type="button" onClick={() => setForm((prev) => {
                                const next = [...prev.variations];
                                next[idx] = { ...next[idx], image: "" };
                                return { ...prev, variations: next };
                              })} className="text-[10px] text-red-600 hover:underline">
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="mb-0.5 block text-[11px] font-medium text-slate-500">Gallery (up to 5)</label>
                          <div className="flex flex-wrap gap-1.5">
                            {v.images.map((img, imgIdx) => (
                              <div key={imgIdx} className="flex flex-col items-center gap-0.5">
                                <div className="h-8 w-8 overflow-hidden rounded border border-slate-300 bg-slate-50">
                                  <img src={getMediaUrl(img)} alt="" className="h-full w-full object-cover" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setForm((prev) => {
                                    const next = [...prev.variations];
                                    next[idx] = { ...next[idx], images: next[idx].images.filter((_, i) => i !== imgIdx) };
                                    return { ...prev, variations: next };
                                  })}
                                  className="text-[9px] text-red-600 hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            {v.images.length < 5 && (
                              <button type="button" onClick={() => openMediaPicker({ type: "variation-gallery", index: idx })} className="flex h-8 w-8 items-center justify-center rounded border border-dashed border-slate-300 text-[10px] text-slate-500 hover:border-amber-400 hover:text-amber-600">
                                +
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
          <label htmlFor="isActive" className="text-sm text-slate-600">Active</label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-500 disabled:opacity-50">
            {submitting ? "Saving..." : product ? "Update" : "Create"}
          </button>
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100">
            Cancel
          </button>
        </div>
      </form>

      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => { setShowMediaPicker(false); setMediaPickerCtx(null); }}
        onSelect={handleMediaSelect}
        title="Select product image"
        type="image"
      />
    </div>
  );
}
