"use client";

import { useEffect, useState } from "react";
import { adminsApi } from "@/lib/api";
import type { AdminItem } from "@/lib/types";

export default function AdminAdminsPage() {
  const [mounted, setMounted] = useState(false);
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminItem | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "admin" as "admin" | "superadmin",
    isActive: true,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchAdmins();
  }, [mounted, pagination.page, search]);

  const fetchAdmins = () => {
    setLoading(true);
    setAccessDenied(false);
    adminsApi
      .list({ search: search || undefined, page: pagination.page, limit: pagination.limit })
      .then((res) => {
        setLoading(false);
        if (res.error && res.error.includes("Superadmin")) {
          setAccessDenied(true);
          return;
        }
        if (res.data?.data) setAdmins(res.data.data);
        if (res.data?.pagination) setPagination(res.data.pagination);
      });
  };

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "admin",
      isActive: true,
    });
    setEditing(null);
    setShowForm(false);
    setError("");
  };

  const handleAdd = () => {
    setEditing(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "admin",
      isActive: true,
    });
    setShowForm(true);
  };

  const handleEdit = (admin: AdminItem) => {
    setEditing(admin);
    setForm({
      name: admin.name,
      email: admin.email,
      phone: admin.phone || "",
      password: "",
      role: (admin.role as "admin" | "superadmin") || "admin",
      isActive: admin.isActive !== false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const payload: { name: string; email: string; phone?: string; password?: string; role?: "admin" | "superadmin"; isActive?: boolean } = {
      name: form.name.trim(),
      email: form.email.trim(),
    };
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.password.trim()) payload.password = form.password.trim();
    payload.role = form.role;
    if (editing) payload.isActive = form.isActive;

    if (!payload.name || !payload.email) {
      setError("Name and email are required");
      setSubmitting(false);
      return;
    }

    if (!editing && !payload.password) {
      setError("Password is required for new admins");
      setSubmitting(false);
      return;
    }

    const res = editing
      ? await adminsApi.update(editing._id, payload)
      : await adminsApi.create(payload);

    setSubmitting(false);
    if (res.error) setError(res.error);
    else {
      fetchAdmins();
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this admin? This cannot be undone.")) return;
    const res = await adminsApi.delete(id);
    if (!res.error) fetchAdmins();
    else alert(res.error);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPagination((p) => ({ ...p, page: 1 }));
  };

  if (!mounted) return null;

  if (accessDenied) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-amber-800">Access Denied</h2>
          <p className="mt-2 text-sm text-amber-700">
            Only superadmins can manage other admins.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Admin Management</h1>
        <div className="flex flex-wrap gap-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-48 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 sm:w-64"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              Search
            </button>
          </form>
          <button
            onClick={handleAdd}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-500"
          >
            Add Admin
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {editing ? "Edit Admin" : "Add Admin"}
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
                <label className="mb-1 block text-sm font-medium text-slate-600">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                  disabled={!!editing}
                />
                {editing && <p className="mt-1 text-xs text-slate-500">Email cannot be changed</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Password {editing ? "(leave blank to keep)" : "*"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder={editing ? "••••••••" : "Min 6 characters"}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "superadmin" })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
              {editing && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-600">
                    Active
                  </label>
                </div>
              )}
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

      {loading ? (
        <div className="py-12 text-center text-slate-600">Loading admins...</div>
      ) : admins.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          {search ? "No admins match your search." : "No admins yet. Add one above."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {admins.map((admin) => (
                <tr key={admin._id}>
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">{admin.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">{admin.email}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">{admin.phone || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        admin.role === "superadmin" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {admin.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        admin.isActive !== false ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {admin.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                    {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(admin)}
                      className="mr-2 text-amber-600 hover:underline"
                    >
                      Edit
                    </button>
                    {admin.role !== "superadmin" && (
                      <button
                        onClick={() => handleDelete(admin._id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page <= 1}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
              disabled={pagination.page >= pagination.pages}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
