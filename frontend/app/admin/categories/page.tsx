"use client";

import { useEffect, useState } from "react";
import { categoryApi, getMediaUrl } from "@/lib/api";
import type { Category } from "@/lib/types";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import { Button, Card, Input, Label, Textarea, LoadingState, EmptyState, Badge } from "@/components/ui";

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
        <Button variant="primaryAmber" onClick={() => { resetForm(); setShowForm(true); }}>
          Add Category
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {editing ? "Edit Category" : "Add Category"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label required>Name</Label>
              <Input variant="amber" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Parent category</Label>
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
              <Label>Image</Label>
              <div className="flex items-center gap-3">
                {form.image ? (
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    <img src={getMediaUrl(form.image)} alt="Category" className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => setShowMediaPicker(true)}>
                    {form.image ? "Change" : "Select"} Image
                  </Button>
                  {form.image && (
                    <Button type="button" variant="secondary" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setForm({ ...form, image: "" })}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea variant="amber" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
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
              <Button type="submit" variant="primaryAmber" disabled={submitting}>
                {submitting ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
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
        <LoadingState message="Loading categories..." />
      ) : categories.length === 0 ? (
        <EmptyState message='No categories yet. Click "Add Category" to create one.' />
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
                    <Badge variant={category.showOnHomepage ? "success" : "neutral"}>
                      {category.showOnHomepage ? "Yes" : "No"}
                    </Badge>
                  </td>
                  {/* Status */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <Badge variant={category.isActive ? "success" : "neutral"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  {/* Actions */}
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Button type="button" variant="link" onClick={() => handleEdit(category)} className="mr-2 text-amber-600">
                      Edit
                    </Button>
                    <Button type="button" variant="linkRed" onClick={() => handleDelete(category._id)}>
                      Delete
                    </Button>
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
