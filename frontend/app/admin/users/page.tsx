"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@/lib/api";
import type { UserItem } from "@/lib/types";
import { Card, Input, Label, Button, LoadingState, EmptyState } from "@/components/ui";

export default function AdminUsersPage() {
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchUsers();
  }, [mounted, pagination.page, search]);

  const fetchUsers = () => {
    setLoading(true);
    usersApi
      .list({ search: search || undefined, page: pagination.page, limit: pagination.limit })
      .then((res) => {
        setLoading(false);
        if (res.data?.data) setUsers(res.data.data);
        if (res.data?.pagination) setPagination(res.data.pagination);
      });
  };

  const resetForm = () => {
    setForm({ name: "", email: "", phone: "" });
    setEditing(null);
    setShowForm(false);
    setError("");
  };

  const handleEdit = (user: UserItem) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email || "",
      phone: user.phone || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setError("");
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
    };
    if (!payload.name) {
      setError("Name is required");
      setSubmitting(false);
      return;
    }
    if (!payload.email && !payload.phone) {
      setError("Either email or phone is required");
      setSubmitting(false);
      return;
    }
    const res = await usersApi.update(editing._id, payload);
    setSubmitting(false);
    if (res.error) setError(res.error);
    else {
      fetchUsers();
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    const res = await usersApi.delete(id);
    if (!res.error) fetchUsers();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPagination((p) => ({ ...p, page: 1 }));
  };

  if (!mounted) return null;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            variant="amber"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-48 text-sm sm:w-64"
          />
          <Button type="submit" variant="primaryAmber" className="text-sm">
            Search
          </Button>
        </form>
      </div>

      {showForm && editing && (
        <Card className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Edit User</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label required>Name</Label>
              <Input variant="amber" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input variant="amber" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input variant="amber" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <p className="text-xs text-slate-500">At least one of email or phone is required.</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" variant="primaryAmber" disabled={submitting}>
                {submitting ? "Saving..." : "Update"}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <LoadingState message="Loading users..." />
      ) : users.length === 0 ? (
        <EmptyState message={search ? "No users match your search." : "No users yet."} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">{user.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">{user.email || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">{user.phone || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Button type="button" variant="link" onClick={() => handleEdit(user)} className="mr-2 text-amber-600">
                      Edit
                    </Button>
                    <Button type="button" variant="linkRed" onClick={() => handleDelete(user._id)}>
                      Delete
                    </Button>
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page <= 1}
              className="text-sm"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
              disabled={pagination.page >= pagination.pages}
              className="text-sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
