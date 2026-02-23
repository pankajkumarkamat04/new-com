"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";

type AdminProfile = { id?: string; name: string; email: string; phone?: string };

export default function AdminProfilePage() {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<AdminProfile | null>(null);

  useEffect(() => {
    adminApi.getMe().then((res) => {
      setLoading(false);
      if (res.data?.admin) {
        setAdmin(res.data.admin);
        setForm(res.data.admin);
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-slate-600">Loading profile...</p>
      </div>
    );
  }

  if (!admin || !form) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-slate-600">Could not load profile.</p>
      </div>
    );
  }

  const handleChange = (field: keyof AdminProfile, value: string) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleCancel = () => {
    setForm(admin);
    setEditing(false);
  };

  const handleSave = () => {
    // No backend update endpoint yet; keep it local for now.
    setAdmin(form);
    setEditing(false);
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
          <p className="text-sm text-slate-600">Your admin account details.</p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
            >
              Save
            </button>
          </div>
        )}
      </div>

      <div className="max-w-xl mx-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {!editing ? (
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Name</dt>
              <dd className="mt-1 text-lg font-medium text-slate-900">{admin.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
              <dd className="mt-1 text-lg font-medium text-slate-900">{admin.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone</dt>
              <dd className="mt-1 text-lg font-medium text-slate-900">{admin.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</dt>
              <dd className="mt-1 text-lg font-medium text-slate-900">Admin</dd>
            </div>
          </dl>
        ) : (
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Role
              </label>
              <input
                type="text"
                value="Admin"
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
