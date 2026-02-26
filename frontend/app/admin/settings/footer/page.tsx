"use client";

import { useEffect, useState } from "react";
import { settingsApi } from "@/lib/api";
import type { FooterSettings, FooterColumn, FooterLink, FooterColumnType } from "@/lib/types";

const COLUMN_TYPES: { value: FooterColumnType; label: string; description: string }[] = [
  { value: "links", label: "Links", description: "A list of text links (e.g. Shop, FAQ, Privacy)." },
  { value: "about", label: "About Us", description: "Short text or description about your company." },
  { value: "social", label: "Social Links", description: "Social media links from General settings or custom." },
  { value: "contact", label: "Contact", description: "Contact details from General settings or custom." },
];

const SOCIAL_PRESETS: { label: string; value: string }[] = [
  { label: "Facebook", value: "Facebook" },
  { label: "YouTube", value: "YouTube" },
  { label: "Instagram", value: "Instagram" },
  { label: "X (Twitter)", value: "X (Twitter)" },
  { label: "LinkedIn", value: "LinkedIn" },
];

const defaultColumn: FooterColumn = { type: "links", title: "", content: "", links: [] };
const defaultLink: FooterLink = { label: "", href: "" };

export default function AdminFooterSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<FooterSettings>({
    columns: [
      {
        type: "links",
        title: "Need Help",
        content: "",
        links: [
          { label: "Contact Us", href: "#" },
          { label: "Track Order", href: "#" },
          { label: "FAQs", href: "#" },
        ],
      },
      {
        type: "links",
        title: "Company",
        content: "",
        links: [
          { label: "About Us", href: "#" },
          { label: "Blogs", href: "#" },
        ],
      },
      {
        type: "links",
        title: "More Info",
        content: "",
        links: [
          { label: "T&C", href: "#" },
          { label: "Privacy Policy", href: "#" },
        ],
      },
      { type: "contact", title: "Contact", content: "", links: [] },
    ],
    copyrightText: "",
    showSocial: true,
    variant: "dark",
    backgroundColor: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<FooterColumn | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    settingsApi.getFooter().then((res) => {
      setLoading(false);
      if (res.data?.data) {
        const d = res.data.data;
        setForm((prev) => ({
          columns:
            Array.isArray(d.columns) && d.columns.length > 0
              ? d.columns.map((c: FooterColumn) => ({
                  type: (c.type && COLUMN_TYPES.some((t) => t.value === c.type) ? c.type : "links") as FooterColumnType,
                  title: c.title || "",
                  content: c.content ?? "",
                  links: Array.isArray(c.links)
                    ? c.links.map((l: FooterLink) => ({ label: l.label || "", href: l.href || "" }))
                    : [],
                }))
              : prev.columns,
          copyrightText: d.copyrightText ?? "",
          showSocial: d.showSocial !== false,
          variant: d.variant === "light" ? "light" : "dark",
          backgroundColor: typeof (d as any).backgroundColor === "string" ? (d as any).backgroundColor : prev.backgroundColor,
        }));
      }
    });
  }, [mounted]);

  const openEditModal = (index: number) => {
    const col = form.columns[index] || { ...defaultColumn };
    const clone: FooterColumn = {
      type: (col.type && COLUMN_TYPES.some((t) => t.value === col.type) ? col.type : "links") as FooterColumnType,
      title: col.title || "",
      content: col.content ?? "",
      links: Array.isArray(col.links) ? col.links.map((l) => ({ label: l.label || "", href: l.href || "" })) : [],
    };
    setEditingIndex(index);
    setEditDraft(clone);
    setMessage(null);
  };

  const closeEditModal = () => {
    setEditingIndex(null);
    setEditDraft(null);
  };

  const updateEditDraft = (patch: Partial<FooterColumn>) => {
    setEditDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const updateEditDraftLink = (linkIndex: number, field: "label" | "href", value: string) => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      const links = [...(prev.links || [])];
      if (!links[linkIndex]) links[linkIndex] = { ...defaultLink };
      links[linkIndex] = { ...links[linkIndex], [field]: value };
      return { ...prev, links };
    });
  };

  const addEditDraftLink = (presetLabel?: string) => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        links: [...(prev.links || []), { label: presetLabel || "", href: "" }],
      };
    });
  };

  const removeEditDraftLink = (linkIndex: number) => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, links: prev.links?.filter((_, i) => i !== linkIndex) || [] };
    });
  };

  const saveEditModal = () => {
    if (editingIndex === null || !editDraft) return;
    setForm((prev) => {
      const cols = [...(prev.columns || [])];
      cols[editingIndex] = {
        type: editDraft.type || "links",
        title: editDraft.title || "",
        content: editDraft.type === "about" ? editDraft.content || "" : "",
        links: Array.isArray(editDraft.links)
          ? editDraft.links
              .filter((l) => l && (l.label || l.href))
              .map((l) => ({ label: l.label || "", href: l.href || "" }))
          : [],
      };
      return { ...prev, columns: cols };
    });
    closeEditModal();
  };

  const addColumn = (type: FooterColumnType = "links") => {
    const title =
      type === "contact" ? "Contact" : type === "social" ? "Follow Us" : type === "about" ? "About Us" : "New Column";
    setForm((prev) => ({
      ...prev,
      columns: [...(prev.columns || []), { ...defaultColumn, type, title }],
    }));
    setMessage(null);
  };

  const removeColumn = (index: number) => {
    setForm((prev) => ({ ...prev, columns: prev.columns?.filter((_, i) => i !== index) || [] }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    const res = await settingsApi.updateFooter(form);
    setSubmitting(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setMessage({ type: "success", text: "Footer settings saved." });
  };

  if (!mounted) return null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Footer Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage footer columns below. Click <strong>Edit</strong> on a column to change its content. Use{" "}
          <code className="rounded bg-slate-100 px-1">{"{year}"}</code> and{" "}
          <code className="rounded bg-slate-100 px-1">{"{siteName}"}</code> in copyright for dynamic values.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            message.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-600">Loading footer settings...</div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Footer columns</h2>
              <div className="flex flex-wrap gap-2">
                {COLUMN_TYPES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => addColumn(opt.value)}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
                  >
                    + {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {!form.columns?.length ? (
              <p className="text-sm text-slate-500">No columns yet. Use the buttons above to add one.</p>
            ) : (
              <div className="divide-y divide-slate-200">
                {form.columns.map((col, index) => {
                  const colType = (col.type && COLUMN_TYPES.some((t) => t.value === col.type)
                    ? col.type
                    : "links") as FooterColumnType;
                  const typeMeta = COLUMN_TYPES.find((t) => t.value === colType);
                  const summary =
                    colType === "links"
                      ? `${col.links?.length || 0} link(s)`
                      : colType === "about"
                        ? col.content?.trim()
                          ? `${col.content.trim().slice(0, 50)}...`
                          : "No content"
                        : colType === "social"
                          ? col.links?.length
                            ? `${col.links.length} custom link(s)`
                            : "From General settings"
                          : col.links?.length
                            ? `${col.links.length} custom line(s)`
                            : "From General settings";

                  return (
                    <div key={index} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            {typeMeta?.label ?? "Links"}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {col.title || `Column ${index + 1}`}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500">{summary}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(index)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeColumn(index)}
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Copyright &amp; appearance</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Copyright text</label>
                <input
                  type="text"
                  value={form.copyrightText}
                  onChange={(e) => setForm((prev) => ({ ...prev, copyrightText: e.target.value }))}
                  placeholder="e.g. © {year} {siteName}. All rights reserved."
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900"
                />
                <p className="mt-0.5 text-xs text-slate-500">
                  Leave empty to use default. Use {"{year}"} and {"{siteName}"} as placeholders.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Footer style</label>
                <select
                  value={form.variant}
                  onChange={(e) => setForm((prev) => ({ ...prev, variant: e.target.value as "light" | "dark" }))}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Footer background color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={
                      form.backgroundColor && /^#([0-9A-Fa-f]{3}){1,2}$/.test(form.backgroundColor)
                        ? form.backgroundColor
                        : form.variant === "light"
                          ? "#ffffff"
                          : "#0f172a"
                    }
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        backgroundColor: e.target.value,
                      }))
                    }
                    className="h-9 w-14 cursor-pointer rounded border border-slate-300 bg-white p-1"
                  />
                  <input
                    type="text"
                    value={form.backgroundColor}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        backgroundColor: e.target.value,
                      }))
                    }
                    placeholder={form.variant === "light" ? "#ffffff" : "#0f172a"}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Leave empty to use the default theme color. Use a valid hex color (e.g. #0f172a).
                </p>
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.showSocial}
                  onChange={(e) => setForm((prev) => ({ ...prev, showSocial: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">
                  Show social links in global footer area (from General settings)
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-amber-600 px-6 py-2.5 font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save footer settings"}
          </button>
        </form>
      )}

      {/* Edit modal */}
      {editingIndex !== null && editDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeEditModal()}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Edit column</h2>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Column type</label>
                  <select
                    value={editDraft.type || "links"}
                    onChange={(e) => updateEditDraft({ type: e.target.value as FooterColumnType })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    {COLUMN_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    {COLUMN_TYPES.find((t) => t.value === (editDraft.type || "links"))?.description}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Column title</label>
                  <input
                    type="text"
                    value={editDraft.title}
                    onChange={(e) => updateEditDraft({ title: e.target.value })}
                    placeholder="e.g. Follow Us, Contact"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              {editDraft.type === "about" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Content</label>
                  <textarea
                    value={editDraft.content || ""}
                    onChange={(e) => updateEditDraft({ content: e.target.value })}
                    placeholder="Write a short about your company..."
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              )}

              {editDraft.type === "links" && (
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-600">Links</label>
                  <div className="space-y-2">
                    {(editDraft.links || []).map((link, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateEditDraftLink(idx, "label", e.target.value)}
                          placeholder="Label"
                          className="w-36 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        />
                        <input
                          type="text"
                          value={link.href}
                          onChange={(e) => updateEditDraftLink(idx, "href", e.target.value)}
                          placeholder="URL"
                          className="min-w-[180px] flex-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeEditDraftLink(idx)}
                          className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addEditDraftLink()} className="text-sm text-amber-600 hover:underline">
                      + Add link
                    </button>
                  </div>
                </div>
              )}

              {editDraft.type === "social" && (
                <div>
                  <p className="mb-2 text-xs text-slate-600">
                    <strong>General:</strong> Uses Facebook, Instagram, Twitter, LinkedIn from General settings.
                    <br />
                    <strong>Custom:</strong> Add your own social links below. Leave empty to use General.
                  </p>
                  <div className="space-y-2">
                    {(editDraft.links || []).map((link, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateEditDraftLink(idx, "label", e.target.value)}
                          placeholder="Platform (e.g. Facebook)"
                          className="w-36 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        />
                        <input
                          type="text"
                          value={link.href}
                          onChange={(e) => updateEditDraftLink(idx, "href", e.target.value)}
                          placeholder="URL"
                          className="min-w-[200px] flex-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeEditDraftLink(idx)}
                          className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {SOCIAL_PRESETS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => addEditDraftLink(p.label)}
                          className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
                        >
                          + {p.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => addEditDraftLink()}
                        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                      >
                        + Other
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {editDraft.type === "contact" && (
                <div>
                  <p className="mb-2 text-xs text-slate-600">
                    <strong>General:</strong> Uses email, phone, address from General settings.
                    <br />
                    <strong>Custom:</strong> Add your own contact lines below (e.g. Email: x@y.com). Leave empty to use General.
                  </p>
                  <div className="space-y-2">
                    {(editDraft.links || []).map((link, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateEditDraftLink(idx, "label", e.target.value)}
                          placeholder="Label (e.g. Email, Phone)"
                          className="w-32 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        />
                        <input
                          type="text"
                          value={link.href}
                          onChange={(e) => updateEditDraftLink(idx, "href", e.target.value)}
                          placeholder="Value or URL"
                          className="min-w-[200px] flex-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeEditDraftLink(idx)}
                          className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addEditDraftLink()} className="text-sm text-amber-600 hover:underline">
                      + Add contact line
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditModal}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
              >
                Save column
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
