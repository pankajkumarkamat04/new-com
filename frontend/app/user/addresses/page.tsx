"use client";

import { useEffect, useState } from "react";
import { addressApi } from "@/lib/api";
import type { Address } from "@/lib/types";
import { COUNTRY_OPTIONS, INDIAN_STATES } from "@/lib/addressConstants";
import { Card, Button, Input, Label, LoadingState, EmptyState } from "@/components/ui";

const emptyForm = {
  label: "",
  name: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
  country: "IN",
};

export default function UserAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAddresses = () => {
    addressApi.list().then((res) => {
      setLoading(false);
      if (res.data?.data) setAddresses(res.data.data);
    });
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.city.trim() || !form.zip.trim() || !form.phone.trim()) {
      setMessage({ type: "error", text: "Name, address, city, zip and phone are required." });
      return;
    }
    setSaving(true);
    setMessage(null);
    const res = await addressApi.create({
      ...form,
      label: form.label.trim() || undefined,
      state: form.state.trim() || undefined,
      country: form.country.trim() || "IN",
    });
    setSaving(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setForm(emptyForm);
    setShowAdd(false);
    setMessage({ type: "success", text: "Address added." });
    loadAddresses();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !form.name.trim() || !form.address.trim() || !form.city.trim() || !form.zip.trim() || !form.phone.trim()) {
      setMessage({ type: "error", text: "Name, address, city, zip and phone are required." });
      return;
    }
    setSaving(true);
    setMessage(null);
    const res = await addressApi.update(editingId, {
      ...form,
      label: form.label.trim() || undefined,
      state: form.state.trim() || undefined,
      country: form.country.trim() || "IN",
    });
    setSaving(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setEditingId(null);
    setForm(emptyForm);
    setMessage({ type: "success", text: "Address updated." });
    loadAddresses();
  };

  const startEdit = (a: Address) => {
    setEditingId(a._id);
    setForm({
      label: a.label ?? "",
      name: a.name,
      address: a.address,
      city: a.city,
      state: a.state ?? "",
      zip: a.zip,
      phone: a.phone,
      country: a.country ?? "IN",
    });
    setShowAdd(false);
    setMessage(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAdd(false);
    setForm(emptyForm);
    setMessage(null);
  };

  const handleSetDefault = async (id: string) => {
    const res = await addressApi.setDefault(id);
    if (!res.error) loadAddresses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    setDeletingId(id);
    const res = await addressApi.delete(id);
    setDeletingId(null);
    if (!res.error) loadAddresses();
  };

  if (loading) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <h1 className="text-2xl font-bold text-slate-900">Addresses</h1>
        <p className="mt-2 text-slate-500">Manage your delivery addresses.</p>
        <LoadingState message="Loading addresses..." className="mt-8" />
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Addresses</h1>
          <p className="mt-2 text-slate-500">Manage your delivery addresses. Use them at checkout for faster ordering.</p>
        </div>
        {!showAdd && !editingId && (
          <Button type="button" variant="primary" onClick={() => { setShowAdd(true); setMessage(null); setForm(emptyForm); }}>
            Add address
          </Button>
        )}
      </div>

      {message && (
        <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          {message.text}
        </div>
      )}

      {showAdd && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">New address</h2>
          <form onSubmit={handleSaveAdd} className="space-y-4">
            <div>
              <Label>Label (optional)</Label>
              <Input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Home, Office" />
            </div>
            <div>
              <Label required>Full name</Label>
              <Input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label required>Address</Label>
              <Input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label required>City</Label>
                <Input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              </div>
              <div>
                <Label>State / Province</Label>
                {form.country === "IN" ? (
                  <select
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <Input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label required>ZIP / Postal code</Label>
                <Input type="text" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} required />
              </div>
              <div>
                <Label>Country</Label>
                <select
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label required>Phone</Label>
              <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving..." : "Save address"}</Button>
              <Button type="button" variant="secondary" onClick={cancelEdit}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {editingId && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Edit address</h2>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <Label>Label (optional)</Label>
              <Input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Home, Office" />
            </div>
            <div>
              <Label required>Full name</Label>
              <Input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label required>Address</Label>
              <Input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label required>City</Label>
                <Input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              </div>
              <div>
                <Label>State / Province</Label>
                {form.country === "IN" ? (
                  <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <Input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label required>ZIP / Postal code</Label>
                <Input type="text" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} required />
              </div>
              <div>
                <Label>Country</Label>
                <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label required>Phone</Label>
              <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving..." : "Update"}</Button>
              <Button type="button" variant="secondary" onClick={cancelEdit}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {addresses.length === 0 && !showAdd && !editingId ? (
        <EmptyState
          message="No addresses saved yet"
          className="mt-8"
          action={
            <Button type="button" variant="primary" onClick={() => setShowAdd(true)}>
              Add your first address
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {addresses.map((a) => (
            <Card key={a._id} className="relative">
              {a.isDefault && (
                <span className="absolute right-3 top-3 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Default</span>
              )}
              <div className="pr-20">
                {a.label && <p className="text-sm font-medium text-slate-500">{a.label}</p>}
                <p className="mt-1 font-medium text-slate-900">{a.name}</p>
                <p className="mt-1 text-sm text-slate-600">{a.address}</p>
                <p className="text-sm text-slate-600">{a.city}{a.state ? `, ${a.state}` : ""} {a.zip}</p>
                <p className="text-sm text-slate-600">{a.country}</p>
                <p className="mt-1 text-sm text-slate-600">Phone: {a.phone}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {!a.isDefault && (
                  <Button type="button" variant="secondary" className="text-xs" onClick={() => handleSetDefault(a._id)}>Set default</Button>
                )}
                <Button type="button" variant="secondary" className="text-xs" onClick={() => startEdit(a)}>Edit</Button>
                <Button type="button" variant="secondary" className="text-xs text-red-600 hover:bg-red-50" onClick={() => handleDelete(a._id)} disabled={deletingId === a._id}>
                  {deletingId === a._id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
