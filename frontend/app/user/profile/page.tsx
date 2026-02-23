"use client";

import { useEffect, useState } from "react";
import { userApi } from "@/lib/api";

type UserProfile = { name: string; email?: string; phone?: string };

export default function UserProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState<UserProfile>({ name: "", email: "", phone: "" });

  useEffect(() => {
    userApi.getMe().then((res) => {
      setLoading(false);
      if (res.data?.user) {
        const u = res.data.user;
        setUser(u);
        setForm({ name: u.name, email: u.email ?? "", phone: u.phone ?? "" });
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setMessage({ type: "error", text: "Name is required" });
      return;
    }
    if (!form.email?.trim() && !form.phone?.trim()) {
      setMessage({ type: "error", text: "Either email or phone is required" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const res = await userApi.updateProfile({
      name: form.name.trim(),
      email: form.email?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
    });

    setSaving(false);

    if (res.error) {
      setMessage({ type: "error", text: res.error });
      return;
    }

    if (res.data?.user) {
      setUser(res.data.user);
      setForm({
        name: res.data.user.name,
        email: res.data.user.email ?? "",
        phone: res.data.user.phone ?? "",
      });
      setIsEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully" });
    }
  };

  const handleCancel = () => {
    if (user) {
      setForm({ name: user.name, email: user.email ?? "", phone: user.phone ?? "" });
    }
    setIsEditing(false);
    setMessage(null);
  };

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Profile
            </button>
          )}
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

        {isEditing ? (
          <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Optional if phone is provided"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Optional if email is provided"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-slate-500">Name</dt>
                <dd className="mt-1 text-slate-900">{user?.name || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Email</dt>
                <dd className="mt-1 text-slate-900">{user?.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Phone</dt>
                <dd className="mt-1 text-slate-900">{user?.phone || "—"}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
