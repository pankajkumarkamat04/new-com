"use client";

import { useEffect, useState } from "react";
import { productApi, categoryApi, type Product, type Category } from "@/lib/api";
import MediaPickerModal from "@/components/admin/MediaPickerModal";

export default function AdminProductsPage() {
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "0",
    image: "",
    isActive: true,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchProducts();
    fetchCategories();
  }, [mounted]);

  const fetchProducts = () => {
    setLoading(true);
    productApi.list({ limit: 50 }).then((res) => {
      setLoading(false);
      if (res.data?.data) setProducts(res.data.data);
    });
  };

  const fetchCategories = () => {
    categoryApi.list({ isActive: true }).then((res) => {
      if (res.data?.data) setCategories(res.data.data);
    });
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      category: "",
      stock: "0",
      image: "",
      isActive: true,
    });
    setEditing(null);
    setShowForm(false);
    setShowMediaPicker(false);
    setError("");
  };

  const handleEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      category: product.category || "",
      stock: String(product.stock),
      image: product.image || "",
      isActive: product.isActive,
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
      price: parseFloat(form.price),
      category: form.category.trim() || undefined,
      stock: parseInt(form.stock, 10) || 0,
      image: form.image.trim() || undefined,
      isActive: form.isActive,
    };
    if (!payload.name || isNaN(payload.price) || payload.price < 0) {
      setError("Name and valid price are required");
      setSubmitting(false);
      return;
    }
    if (editing) {
      const res = await productApi.update(editing._id, payload);
      setSubmitting(false);
      if (res.error) setError(res.error);
      else {
        fetchProducts();
        resetForm();
      }
    } else {
      const res = await productApi.create(payload);
      setSubmitting(false);
      if (res.error) setError(res.error);
      else {
        fetchProducts();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const res = await productApi.delete(id);
    if (!res.error) fetchProducts();
  };

  if (!mounted) return null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-500"
          >
            Add Product
          </button>
        </div>

        {showForm && (
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              {editing ? "Edit Product" : "Add Product"}
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
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Image</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(true)}
                    className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {form.image ? (
                      <>
                        <img src={form.image} alt="" className="h-10 w-10 rounded object-cover" />
                        Change image
                      </>
                    ) : (
                      "Choose from media"
                    )}
                  </button>
                  {form.image && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image: "" })}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
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
          onSelect={(url) => setForm((f) => ({ ...f, image: url }))}
          title="Select product image"
          type="image"
        />

        {loading ? (
          <div className="py-12 text-center text-slate-600">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            No products yet. Click &quot;Add Product&quot; to create one.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {products.map((product) => (
                  <tr key={product._id}>
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                      {product.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {product.category || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {product.stock}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          product.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(product)}
                        className="mr-2 text-amber-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
