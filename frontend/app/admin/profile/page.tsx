"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Card, Input, Label, Button, LoadingState } from "@/components/ui";

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
        <LoadingState message="Loading profile..." />
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
          <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
            Edit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" variant="primaryAmber" onClick={handleSave}>
              Save
            </Button>
          </div>
        )}
      </div>

      <Card className="max-w-xl mx-auto">
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
              <Label className="text-xs uppercase tracking-wide">Name</Label>
              <Input variant="amber" type="text" value={form.name} onChange={(e) => handleChange("name", e.target.value)} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide">Email</Label>
              <Input variant="amber" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide">Phone</Label>
              <Input variant="amber" type="tel" value={form.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide">Role</Label>
              <Input type="text" value="Admin" disabled className="cursor-not-allowed bg-slate-50 text-sm text-slate-500" />
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
