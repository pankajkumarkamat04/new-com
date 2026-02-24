"use client";

import { useEffect, useState } from "react";
import { categoryApi, getMediaUrl, type Category } from "@/lib/api";
import MediaPickerModal from "@/components/admin/MediaPickerModal";

function getParentId(c: Category): string | null {
  if (!c.parent) return null;
  return typeof c.parent === "string" ? c.parent : c.parent._id;
}

function getParentName(c: Category): string {
  if (!c.parent) return "—";
  return typeof c.parent === "object" && c.parent ? c.parent.name : "—";
}

/** Flatten tree: roots first, then children under each root (by name order) */
function orderedCategories(list: Category[]): Category[] {
  const byParent = new Map<string | null, Category[]>();
  for (const c of list) {
    const pid = getParentId(c);
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid)!.push(c);
  }
  for (const arr of byParent.values()) arr.sort((a, b) => a.name.localeCompare(b.name));
  const roots = byParent.get(null) ?? [];
  const out: Category[] = [];
  function append(cats: Category[]) {
    for (const c of cats) {
          out.push(c);
          append(byParent.get(c._id) ?? []);
        }
  }
  append(roots);
  return out;
}

export default function AdminCategoriesPage() {
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    isActive: true,
    showOnHomepage: false,
    parent: "" as string,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchCategories();
  }, [mounted]);

  const fetchCategories = () => {
    setLoading(true);
    categoryApi.list().then((res) => {
      setLoading(false);
      if (res.data?.data) setCategories(res.data.data);
    });
  };

  const resetForm = () => {
    setForm({ name: "", description: "", image: "", isActive: true, showOnHomepage: false, parent: "" });
    setEditing(null);
    setShowForm(false);
    setError("");
  };

  const handleEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description || "",
      image: category.image || "",
      isActive: category.isActive,
      showOnHomepage: !!category.showOnHomepage,
      parent: getParentId(category) ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      image: form.image.trim() || undefined,
      isActive: form.isActive,
      showOnHomepage: form.showOnHomepage,
      parent: form.parent || undefined,
    };
    if (!payload.name) {
      setError("Name is required");
      setSubmitting(false);
      return;
    }
    if (editing) {
      const res = await categoryApi.update(editing._id, payload);
      setSubmitting(false);
      if (res.error) setError(res.error);
      else {
        fetchCategories();
        resetForm();
      }
    } else {
      const res = await categoryApi.create(payload);
      setSubmitting(false);
      if (res.error) setError(res.error);
      else {
        fetchCategories();
        resetForm();
      }
    }
  };

  function isDescendantOf(cat: Category, ancestorId: string): boolean {
    const pid = getParentId(cat);
    if (!pid) return false;
    if (pid === ancestorId) return true;
    const parentCat = categories.find((c) => c._id === pid);
    return parentCat ? isDescendantOf(parentCat, ancestorId) : false;
  }

  const parentOptions = editing
    ? categories.filter((c) => c._id !== editing._id && !isDescendantOf(c, editing._id))
    : categories;

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Products with this category will keep the category name.")) return;
    const res = await categoryApi.delete(id);
    if (!res.error) fetchCategories();
  };

  if (!mounted) return null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-500"
        >
          Add Category
        </button>
      </div>

      {showForm && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {editing ? "Edit Category" : "Add Category"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="mb-1 block text-sm font-medium text-slate-600">Parent category</label>
              <select
                value={form.parent}
                onChange={(e) => setForm({ ...form, parent: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">None (top-level category)</option>
                {orderedCategories(parentOptions).map((c) => (
                  <option key={c._id} value={c._id}>
                    {getParentId(c) ? "↳ " : ""}{c.name}
                  </option>
                ))}
              </select>
              <p className="mt-0.5 text-xs text-slate-500">Leave as &quot;None&quot; for a main category; choose a category to create a subcategory.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Image</label>
              <div className="flex items-center gap-3">
                {form.image ? (
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    <img src={getMediaUrl(form.image)} alt="Category" className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(true)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {form.image ? "Change" : "Select"} Image
                  </button>
                  {form.image && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image: "" })}
                      className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="isActive" className="text-sm text-slate-600">
                Active
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showOnHomepage"
                checked={form.showOnHomepage}
                onChange={(e) => setForm({ ...form, showOnHomepage: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="showOnHomepage" className="text-sm text-slate-600">
                Show in homepage "Shop by Category"
              </label>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
              >
                {submitting ? "Saving..." : editing ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url) => {
          setForm((f) => ({ ...f, image: url }));
          setShowMediaPicker(false);
        }}
        title="Select category image"
        type="image"
      />

      {loading ? (
        <div className="py-12 text-center text-slate-600">Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          No categories yet. Click &quot;Add Category&quot; to create one.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Parent</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">On Homepage</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {orderedCategories(categories).map((category) => {
                const isSub = !!getParentId(category);
                return (
                <tr key={category._id} className={isSub ? "bg-slate-50/50" : ""}>
                  {/* Image */}
                  <td className="whitespace-nowrap px-6 py-4">
                    {category.image ? (
                      <div className="h-10 w-10 overflow-hidden rounded-lg border border-slate-200">
                        <img src={getMediaUrl(category.image)} alt={category.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                        </svg>
                      </div>
                    )}
                  </td>
                  {/* Name */}
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                    {isSub && <span className="mr-2 text-slate-400">↳</span>}
                    {category.name}
                  </td>
                  {/* Parent */}
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                    {getParentName(category)}
                  </td>
                  {/* Slug */}
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                    {category.slug}
                  </td>
                  {/* Description */}
                  <td className="max-w-xs truncate px-6 py-4 text-slate-600">
                    {category.description || "—"}
                  </td>
                  {/* On Homepage */}
                  <td className="whitespace-nowrap px-6 py-4">
                    {category.showOnHomepage ? (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500">
                        No
                      </span>
                    )}
                  </td>
                  {/* Status */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        category.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(category)}
                      className="mr-2 text-amber-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category._id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
