"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { inventoryApi, productApi } from "@/lib/api";
import type { InventoryMovement, Product, ProductVariation } from "@/lib/types";
import { Button, Card, Input, Label, LoadingState, EmptyState } from "@/components/ui";

/** Products that have inventory management with SKU (product or variations) */
function hasInventoryWithSku(p: Product): boolean {
  if (p.stockManagement === "inventory" && p.sku) return true;
  return (p.variations ?? []).some(
    (v) => v.stockManagement === "inventory" && v.sku
  );
}

function getSkus(product: Product): { sku: string; label: string; stock: number }[] {
  const list: { sku: string; label: string; stock: number }[] = [];
  const variations = product.variations ?? [];
  const hasVariations = variations.length > 0;
  const defaultIdx = Math.max(0, Math.min(product.defaultVariationIndex ?? 0, variations.length - 1));
  const defaultVar = variations[defaultIdx];

  if (hasVariations) {
    if (product.stockManagement === "inventory" && product.sku && defaultVar?.sku === product.sku) {
      const defaultAttrLabel = (defaultVar?.attributes ?? [])
        .map((a) => `${a.name}: ${a.value}`)
        .join(", ") || "Product";
      list.push({
        sku: product.sku,
        label: defaultAttrLabel,
        stock: defaultVar?.stock ?? 0,
      });
    }
    variations.forEach((v: ProductVariation, i: number) => {
      if (v.stockManagement === "inventory" && v.sku) {
        if (product.sku === v.sku && product.stockManagement === "inventory") return;
        const attrLabel = (v.attributes ?? [])
          .map((a) => `${a.name}: ${a.value}`)
          .join(", ");
        list.push({
          sku: v.sku,
          label: attrLabel || `Variation ${i + 1}`,
          stock: v.stock ?? 0,
        });
      }
    });
  } else if (product.stockManagement === "inventory" && product.sku) {
    list.push({
      sku: product.sku,
      label: "Product",
      stock: product.stock ?? 0,
    });
  }
  return list;
}

export default function AdminInventoryPage() {
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productMovements, setProductMovements] = useState<InventoryMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ productId: "", sku: "", quantity: "", reason: "", notes: "" });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const inventoryProducts = products.filter(hasInventoryWithSku);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchProducts();
  }, [mounted]);

  useEffect(() => {
    if (!selectedProduct) {
      setProductMovements([]);
      return;
    }
    setMovementsLoading(true);
    inventoryApi.getByProduct(selectedProduct._id).then((res) => {
      setMovementsLoading(false);
      if (res.data?.data?.movements) setProductMovements(res.data.data.movements);
    });
  }, [selectedProduct?._id]);

  const fetchProducts = () => {
    setLoading(true);
    return productApi.list({ limit: 500 }).then((res) => {
      setLoading(false);
      if (res.data?.data) setProducts(res.data.data);
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
    const prod = products.find((p) => p._id === addForm.productId);
    const skus = prod ? getSkus(prod) : [];
    const skuToUse = addForm.sku || (skus.length === 1 ? skus[0].sku : "");
    if (skus.length > 1 && !skuToUse) {
      setMessage({ type: "error", text: "Select a SKU (this product has multiple)" });
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
      sku: skuToUse || undefined,
    });
    setAddSubmitting(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setMessage({ type: "success", text: res.data?.message || "Stock added" });
    const addedProductId = addForm.productId;
    setAddForm({ productId: "", sku: "", quantity: "", reason: "", notes: "" });
    setShowAddForm(false);
    fetchProducts().then(() => {
      if (selectedProduct && selectedProduct._id === addedProductId) {
        productApi.get(addedProductId).then((r) => {
          if (r.data?.data) setSelectedProduct(r.data.data);
        });
        inventoryApi.getByProduct(addedProductId).then((r) => {
          if (r.data?.data?.movements) setProductMovements(r.data.data.movements);
        });
      }
    });
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
        <Button type="button" variant="primaryAmber" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "Add Stock"}
        </Button>
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
        <Card className="mb-6">
          <form onSubmit={handleAddStock}>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Add Stock</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>Product</Label>
              <select
                value={addForm.productId}
                onChange={(e) =>
                  setAddForm((prev) => ({
                    ...prev,
                    productId: e.target.value,
                    sku: "",
                  }))
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">Select product</option>
                {inventoryProducts.length > 0
                  ? inventoryProducts.map((p) => {
                      const total = getSkus(p).reduce((s, x) => s + x.stock, 0);
                      return (
                        <option key={p._id} value={p._id}>
                          {p.name} (SKUs: {getSkus(p).length}, Stock: {total})
                        </option>
                      );
                    })
                  : products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} (Stock: {p.stock ?? 0})
                      </option>
                    ))}
              </select>
            </div>
            {addForm.productId && (() => {
              const prod = products.find((p) => p._id === addForm.productId);
              const skus = prod ? getSkus(prod) : [];
              return skus.length > 0 ? (
                <div>
                  <Label>SKU</Label>
                  <select
                    value={addForm.sku}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, sku: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">Select SKU (optional)</option>
                    {skus.map((s) => (
                      <option key={s.sku} value={s.sku}>
                        {s.sku} — {s.label} (Stock: {s.stock})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null;
            })()}
            <div>
              <Label>Quantity</Label>
              <Input
                variant="amber"
                type="number"
                min={1}
                value={addForm.quantity}
                onChange={(e) => setAddForm((prev) => ({ ...prev, quantity: e.target.value }))}
                placeholder="e.g. 10"
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                variant="amber"
                value={addForm.reason}
                onChange={(e) => setAddForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g. Purchase, Restock"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                variant="amber"
                value={addForm.notes}
                onChange={(e) => setAddForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" variant="primaryAmber" disabled={addSubmitting}>
              {addSubmitting ? "Adding..." : "Add Stock"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
          </form>
        </Card>
      )}

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Products with Inventory (SKU)</h2>
        <p className="mb-4 text-sm text-slate-600">
          Click a product to view all its SKUs and stock movements.
        </p>
        {loading ? (
          <LoadingState message="Loading products..." />
        ) : inventoryProducts.length === 0 ? (
          <EmptyState
            message={
              <>
                No products with inventory management (SKU) yet. Add products with &quot;Manage with Inventory&quot; and generate SKUs in the{" "}
                <Link href="/admin/products" className="font-medium text-amber-600 hover:text-amber-500">
                  Products
                </Link>{" "}
                page.
              </>
            }
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {inventoryProducts.map((p) => {
              const skus = getSkus(p);
              const isSelected = selectedProduct?._id === p._id;
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => setSelectedProduct(isSelected ? null : p)}
                  className={`rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500"
                      : "border-slate-200 bg-white hover:border-amber-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-medium text-slate-900">{p.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {skus.length} SKU{skus.length !== 1 ? "s" : ""} • Total stock: {skus.reduce((sum, s) => sum + s.stock, 0)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedProduct && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{selectedProduct.name}</h3>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-medium text-slate-600">All SKUs</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {getSkus(selectedProduct).map((s) => (
                  <div
                    key={s.sku}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-mono font-medium text-slate-900">{s.sku}</span>
                    <span className="mx-2 text-slate-400">•</span>
                    <span className="text-slate-600">{s.label}</span>
                    <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-slate-700">
                      Stock: {s.stock}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-6">
            <h4 className="mb-3 text-sm font-medium text-slate-600">Stock movements</h4>
            {movementsLoading ? (
              <div className="py-8 text-center text-slate-500">Loading movements...</div>
            ) : productMovements.length === 0 ? (
              <div className="py-8 text-center text-slate-500">No movements for this product yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">SKU</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">Type</th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase text-slate-500">Quantity</th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase text-slate-500">Previous</th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase text-slate-500">New</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {productMovements.map((m) => (
                      <tr key={m._id}>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                          {new Date(m.createdAt).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                          {m.sku || "—"}
                        </td>
                        <td className="px-4 py-3">
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
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                          <span className={m.quantity > 0 ? "text-green-600" : "text-red-600"}>
                            {m.quantity > 0 ? "+" : ""}{m.quantity}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600">
                          {m.previousStock}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-slate-900">
                          {m.newStock}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{m.reason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
