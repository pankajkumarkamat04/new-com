"use client";

import { useEffect, useState } from "react";
import { inventoryApi, productApi } from "@/lib/api";
import type { InventoryMovement, Product } from "@/lib/types";

export default function AdminInventoryPage() {
  const [mounted, setMounted] = useState(false);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [filterProduct, setFilterProduct] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ productId: "", quantity: "", reason: "", notes: "" });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchProducts();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    fetchMovements();
  }, [mounted, pagination.page, filterProduct, filterType]);

  const fetchProducts = () => {
    productApi.list({ limit: 500 }).then((res) => {
      if (res.data?.data) setProducts(res.data.data);
    });
  };

  const fetchMovements = () => {
    setLoading(true);
    inventoryApi
      .list({
        productId: filterProduct || undefined,
        type: filterType || undefined,
        page: pagination.page,
        limit: pagination.limit,
      })
      .then((res) => {
        setLoading(false);
        if (res.data?.data) setMovements(res.data.data);
        if (res.data?.pagination) setPagination((p) => ({ ...p, ...res.data!.pagination }));
      });
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const qty = parseInt(addForm.quantity, 10);
    if (!addForm.productId) {
      setMessage({ type: "error", text: "Select a product" });
      return;
    }
    if (isNaN(qty) || qty < 1) {
      setMessage({ type: "error", text: "Quantity must be at least 1" });
      return;
    }
    setAddSubmitting(true);
    const res = await inventoryApi.addStock({
      productId: addForm.productId,
      quantity: qty,
      reason: addForm.reason || undefined,
      notes: addForm.notes || undefined,
    });
    setAddSubmitting(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setMessage({ type: "success", text: res.data?.message || "Stock added" });
    setAddForm({ productId: "", quantity: "", reason: "", notes: "" });
    setShowAddForm(false);
    fetchMovements();
    fetchProducts();
  };

  const getProductName = (p: InventoryMovement) => {
    const prod = p.productId;
    return typeof prod === "object" && prod?.name ? prod.name : "—";
  };

  if (!mounted) return null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track stock movements and add or adjust inventory for products.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-500"
        >
          {showAddForm ? "Cancel" : "Add Stock"}
        </button>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {showAddForm && (
        <form
          onSubmit={handleAddStock}
          className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Add Stock</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Product</label>
              <select
                value={addForm.productId}
                onChange={(e) => setAddForm((prev) => ({ ...prev, productId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (Stock: {p.stock ?? 0})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Quantity</label>
              <input
                type="number"
                min={1}
                value={addForm.quantity}
                onChange={(e) => setAddForm((prev) => ({ ...prev, quantity: e.target.value }))}
                placeholder="e.g. 10"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Reason</label>
              <input
                type="text"
                value={addForm.reason}
                onChange={(e) => setAddForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g. Purchase, Restock"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Notes</label>
              <input
                type="text"
                value={addForm.notes}
                onChange={(e) => setAddForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={addSubmitting}
              className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
            >
              {addSubmitting ? "Adding..." : "Add Stock"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Filter by product</label>
          <select
            value={filterProduct}
            onChange={(e) => {
              setFilterProduct(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Filter by type</label>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">All types</option>
            <option value="in">In</option>
            <option value="out">Out</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-slate-600">Loading movements...</div>
        ) : movements.length === 0 ? (
          <div className="py-12 text-center text-slate-600">No inventory movements yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Previous
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    New
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {movements.map((m) => (
                  <tr key={m._id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{getProductName(m)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.type === "in"
                            ? "bg-green-100 text-green-800"
                            : m.type === "out"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <span className={m.quantity > 0 ? "text-green-600" : "text-red-600"}>
                        {m.quantity > 0 ? "+" : ""}{m.quantity}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-600">
                      {m.previousStock}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-slate-900">
                      {m.newStock}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{m.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
            <p className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page <= 1}
                className="rounded border border-slate-300 bg-white px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination((p) => ({ ...p, page: Math.min(p.pages, p.page + 1) }))
                }
                disabled={pagination.page >= pagination.pages}
                className="rounded border border-slate-300 bg-white px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
