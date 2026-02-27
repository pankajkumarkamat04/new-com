"use client";

import { useEffect, useState } from "react";
import { adminShippingApi } from "@/lib/api";
import type { ShippingZone, ShippingMethod } from "@/lib/types";
import { Button, Card, Input, Label, LoadingState, EmptyState } from "@/components/ui";

export default function AdminShippingPage() {
  const [mounted, setMounted] = useState(false);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [methodsByZone, setMethodsByZone] = useState<Record<string, ShippingMethod[]>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expandedZone, setExpandedZone] = useState<string | null>(null);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [addingMethodZoneId, setAddingMethodZoneId] = useState<string | null>(null);
  const [formZone, setFormZone] = useState({ name: "", description: "", countryCodes: ["*"], stateCodes: [] as string[], zipPrefixes: [] as string[], sortOrder: 0, isActive: true });
  const [formMethod, setFormMethod] = useState({ name: "", description: "", rateType: "flat" as "flat" | "per_item" | "per_order", rateValue: 0, minOrderForFree: 0, estimatedDaysMin: undefined as number | undefined, estimatedDaysMax: undefined as number | undefined, sortOrder: 0, isActive: true });
  const [savingZone, setSavingZone] = useState(false);
  const [savingMethod, setSavingMethod] = useState(false);

  const loadData = async () => {
    const zonesRes = await adminShippingApi.listZones();
    if (zonesRes.data?.data) {
      setZones(zonesRes.data.data);
      const methods: Record<string, ShippingMethod[]> = {};
      for (const z of zonesRes.data.data) {
        const mRes = await adminShippingApi.listMethods(z._id);
        methods[z._id] = mRes.data?.data || [];
      }
      setMethodsByZone(methods);
    }
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadData();
  }, [mounted]);

  const openAddZone = () => {
    setEditingZone(null);
    setFormZone({ name: "New Zone", description: "", countryCodes: ["*"], stateCodes: [], zipPrefixes: [], sortOrder: zones.length, isActive: true });
  };

  const openEditZone = (z: ShippingZone) => {
    setEditingZone(z);
    setFormZone({
      name: z.name,
      description: z.description || "",
      countryCodes: (z.countryCodes && z.countryCodes.length) ? z.countryCodes : ["*"],
      stateCodes: z.stateCodes || [],
      zipPrefixes: z.zipPrefixes || [],
      sortOrder: z.sortOrder ?? 0,
      isActive: z.isActive !== false,
    });
  };

  const saveZone = async () => {
    setSavingZone(true);
    setMessage(null);
    const payload = {
      name: formZone.name.trim() || "New Zone",
      description: formZone.description.trim(),
      countryCodes: formZone.countryCodes.filter(Boolean).length ? formZone.countryCodes : ["*"],
      stateCodes: formZone.stateCodes.filter(Boolean),
      zipPrefixes: formZone.zipPrefixes.filter(Boolean),
      sortOrder: formZone.sortOrder,
      isActive: formZone.isActive,
    };
    const res = editingZone
      ? await adminShippingApi.updateZone(editingZone._id, payload)
      : await adminShippingApi.createZone(payload);
    setSavingZone(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setMessage({ type: "success", text: editingZone ? "Zone updated" : "Zone created" });
    setEditingZone(null);
    setFormZone({ name: "", description: "", countryCodes: ["*"], stateCodes: [], zipPrefixes: [], sortOrder: 0, isActive: true });
    loadData();
  };

  const deleteZone = async (id: string) => {
    if (!confirm("Delete this zone and all its methods?")) return;
    const res = await adminShippingApi.deleteZone(id);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setMessage({ type: "success", text: "Zone deleted" });
    loadData();
  };

  const openAddMethod = (zoneId: string) => {
    setEditingMethod(null);
    setAddingMethodZoneId(zoneId);
    setFormMethod({
      name: "Standard Shipping",
      description: "",
      rateType: "flat",
      rateValue: 0,
      minOrderForFree: 0,
      estimatedDaysMin: undefined,
      estimatedDaysMax: undefined,
      sortOrder: (methodsByZone[zoneId]?.length ?? 0),
      isActive: true,
    });
    setExpandedZone(zoneId);
  };

  const openEditMethod = (m: ShippingMethod) => {
    setAddingMethodZoneId(null);
    setEditingMethod(m);
    setFormMethod({
      name: m.name,
      description: m.description || "",
      rateType: m.rateType || "flat",
      rateValue: m.rateValue ?? 0,
      minOrderForFree: m.minOrderForFree ?? 0,
      estimatedDaysMin: m.estimatedDaysMin,
      estimatedDaysMax: m.estimatedDaysMax,
      sortOrder: m.sortOrder ?? 0,
      isActive: m.isActive !== false,
    });
    setExpandedZone(m.zoneId);
  };

  const saveMethod = async (zoneId: string) => {
    setSavingMethod(true);
    setMessage(null);
    const payload = {
      name: formMethod.name.trim() || "Shipping",
      description: formMethod.description.trim(),
      rateType: formMethod.rateType,
      rateValue: formMethod.rateValue,
      minOrderForFree: formMethod.minOrderForFree,
      estimatedDaysMin: formMethod.estimatedDaysMin,
      estimatedDaysMax: formMethod.estimatedDaysMax,
      sortOrder: formMethod.sortOrder,
      isActive: formMethod.isActive,
    };
    const res = editingMethod
      ? await adminShippingApi.updateMethod(editingMethod._id, payload)
      : await adminShippingApi.createMethod(zoneId, payload);
    setSavingMethod(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setMessage({ type: "success", text: editingMethod ? "Method updated" : "Method created" });
    setEditingMethod(null);
    setAddingMethodZoneId(null);
    loadData();
  };

  const deleteMethod = async (id: string) => {
    if (!confirm("Delete this shipping method?")) return;
    const res = await adminShippingApi.deleteMethod(id);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setMessage({ type: "success", text: "Method deleted" });
    loadData();
  };

  if (!mounted) return null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Manage Shipping</h1>
      <p className="mb-8 text-sm text-slate-600">
        Enable zone-based shipping and define shipping methods with flat, per-item, or per-order rates. Customers see applicable methods at checkout based on their address.
      </p>

      {message && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading..." />
      ) : (
        <>
          {/* Zones */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Shipping Zones</h2>
              <Button type="button" variant="primaryAmber" onClick={openAddZone} className="text-sm">
                Add Zone
              </Button>
            </div>

            {/* Inline form for zone add/edit */}
            {(editingZone !== null || formZone.name === "New Zone") && (
              <Card className="mb-6 border-amber-200 bg-amber-50/50">
                <h3 className="mb-3 font-medium text-slate-900">{editingZone ? "Edit Zone" : "New Zone"}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input variant="amber" value={formZone.name} onChange={(e) => setFormZone((f) => ({ ...f, name: e.target.value }))} className="text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Country codes (e.g. IN, US, or * for all)</Label>
                    <Input
                      variant="amber"
                      value={formZone.countryCodes.join(", ")}
                      onChange={(e) => setFormZone((f) => ({ ...f, countryCodes: e.target.value.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean) }))}
                      placeholder="* or IN, US"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">State codes (optional, comma-separated)</Label>
                    <Input
                      variant="amber"
                      value={(formZone.stateCodes || []).join(", ")}
                      onChange={(e) => setFormZone((f) => ({ ...f, stateCodes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
                      placeholder="e.g. Maharashtra, Karnataka"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">ZIP prefixes (optional, comma-separated)</Label>
                    <Input
                      variant="amber"
                      value={(formZone.zipPrefixes || []).join(", ")}
                      onChange={(e) => setFormZone((f) => ({ ...f, zipPrefixes: e.target.value.split(",").map((z) => z.trim()).filter(Boolean) }))}
                      placeholder="e.g. 40, 56"
                      className="text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Description (optional)</Label>
                    <Input variant="amber" value={formZone.description} onChange={(e) => setFormZone((f) => ({ ...f, description: e.target.value }))} className="text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="zone-active"
                      checked={formZone.isActive}
                      onChange={(e) => setFormZone((f) => ({ ...f, isActive: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-amber-600"
                    />
                    <label htmlFor="zone-active" className="text-sm text-slate-600">Active</label>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button type="button" variant="primaryAmber" onClick={saveZone} disabled={savingZone} className="text-sm">
                    {savingZone ? "Saving..." : "Save Zone"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => { setEditingZone(null); setFormZone({ name: "", description: "", countryCodes: ["*"], stateCodes: [], zipPrefixes: [], sortOrder: 0, isActive: true }); }}
                    className="text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            <div className="space-y-3">
              {zones.length === 0 ? (
                <EmptyState
                  message="No shipping zones yet. Add a zone to define where you ship and which methods apply."
                  className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8"
                />
              ) : (
                zones.map((zone) => (
                  <div key={zone._id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => setExpandedZone(expandedZone === zone._id ? null : zone._id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-900">{zone.name}</span>
                        <span className="text-xs text-slate-500">
                          {(zone.countryCodes && zone.countryCodes.length) ? zone.countryCodes.join(", ") : "*"}
                          {(zone.stateCodes && zone.stateCodes.length) ? ` · ${zone.stateCodes.join(", ")}` : ""}
                        </span>
                        {!zone.isActive && <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Inactive</span>}
                      </div>
                      <svg className={`h-5 w-5 text-slate-400 ${expandedZone === zone._id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedZone === zone._id && (
                      <div className="border-t border-slate-200 px-4 py-4">
                        <div className="mb-4 flex gap-2">
                          <Button type="button" variant="secondary" onClick={() => openEditZone(zone)} className="text-sm px-3 py-1.5">
                            Edit Zone
                          </Button>
                          <Button type="button" variant="danger" onClick={() => deleteZone(zone._id)} className="text-sm px-3 py-1.5 border border-red-200 bg-white text-red-600 hover:bg-red-50">
                            Delete Zone
                          </Button>
                          <Button type="button" variant="primaryAmber" onClick={() => openAddMethod(zone._id)} className="text-sm px-3 py-1.5">
                            Add Method
                          </Button>
                        </div>

                        {/* Method form (add/edit) */}
                        {expandedZone === zone._id && (editingMethod !== null || addingMethodZoneId === zone._id) && (
                          <Card className="mb-4 border-amber-200 bg-amber-50/30">
                            <h4 className="mb-3 text-sm font-medium text-slate-900">{editingMethod ? "Edit Method" : "New Method"}</h4>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div>
                                <Label className="text-xs">Name</Label>
                                <Input variant="amber" value={formMethod.name} onChange={(e) => setFormMethod((f) => ({ ...f, name: e.target.value }))} className="text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Rate type</Label>
                                <select
                                  value={formMethod.rateType}
                                  onChange={(e) => setFormMethod((f) => ({ ...f, rateType: e.target.value as "flat" | "per_item" | "per_order" }))}
                                  className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
                                >
                                  <option value="flat">Flat rate</option>
                                  <option value="per_item">Per item</option>
                                  <option value="per_order">Per order</option>
                                </select>
                              </div>
                              <div>
                                <Label className="text-xs">Rate value</Label>
                                <Input
                                  variant="amber"
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={formMethod.rateValue}
                                  onChange={(e) => setFormMethod((f) => ({ ...f, rateValue: parseFloat(e.target.value) || 0 }))}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Free over (order amount)</Label>
                                <Input
                                  variant="amber"
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={formMethod.minOrderForFree || ""}
                                  onChange={(e) => setFormMethod((f) => ({ ...f, minOrderForFree: parseFloat(e.target.value) || 0 }))}
                                  placeholder="0"
                                  className="text-sm"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="method-active"
                                  checked={formMethod.isActive}
                                  onChange={(e) => setFormMethod((f) => ({ ...f, isActive: e.target.checked }))}
                                  className="h-4 w-4 rounded border-slate-300 text-amber-600"
                                />
                                <label htmlFor="method-active" className="text-xs text-slate-600">Active</label>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Button type="button" variant="primaryAmber" onClick={() => saveMethod(zone._id)} disabled={savingMethod} className="text-sm">
                                {savingMethod ? "Saving..." : "Save Method"}
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => { setEditingMethod(null); setAddingMethodZoneId(null); setFormMethod({ name: "", description: "", rateType: "flat", rateValue: 0, minOrderForFree: 0, estimatedDaysMin: undefined, estimatedDaysMax: undefined, sortOrder: 0, isActive: true }); }}
                                className="text-sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </Card>
                        )}

                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left text-slate-600">
                              <th className="pb-2 pr-2 font-medium">Name</th>
                              <th className="pb-2 pr-2 font-medium">Rate</th>
                              <th className="pb-2 pr-2 font-medium">Free over</th>
                              <th className="pb-2 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(methodsByZone[zone._id] || []).map((m) => (
                              <tr key={m._id} className="border-b border-slate-100">
                                <td className="py-2 pr-2">{m.name}</td>
                                <td className="py-2 pr-2">{m.rateType} – {m.rateValue}</td>
                                <td className="py-2 pr-2">{m.minOrderForFree ? m.minOrderForFree : "—"}</td>
                                <td className="py-2">
                                  <Button type="button" variant="link" onClick={() => openEditMethod(m)} className="text-amber-600 mr-2">Edit</Button>
                                  <Button type="button" variant="linkRed" onClick={() => deleteMethod(m._id)}>Delete</Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {(!methodsByZone[zone._id] || methodsByZone[zone._id].length === 0) && (
                          <p className="py-4 text-center text-sm text-slate-500">No methods in this zone. Add one above.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
