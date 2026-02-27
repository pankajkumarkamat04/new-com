"use client";

import { useEffect, useState } from "react";
import { blogApi, settingsApi, getMediaUrl } from "@/lib/api";
import type { BlogPost } from "@/lib/types";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import HtmlEditor from "@/components/admin/HtmlEditor";
import { Button, Badge, Card, LoadingState, EmptyState, Input, Label, Textarea } from "@/components/ui";

export default function AdminBlogsPage() {
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [blogEnabled, setBlogEnabled] = useState<boolean | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    image: "",
    tags: "" as string,
    isPublished: false,
    publishedAt: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    settingsApi.get().then((res) => {
      if (res.data?.data) {
        setBlogEnabled(!!(res.data.data as any).blogEnabled);
      } else {
        setBlogEnabled(false);
      }
    });
    fetchPosts();
  }, [mounted]);

  const fetchPosts = () => {
    setLoading(true);
    blogApi.adminList({ limit: 100 }).then((res) => {
      setLoading(false);
      if (res.data?.data) setPosts(res.data.data);
    });
  };

  const resetForm = () => {
    setForm({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      image: "",
      tags: "",
      isPublished: false,
      publishedAt: "",
    });
    setEditing(null);
    setShowForm(false);
    setShowMediaPicker(false);
    setError("");
  };

  const handleEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      image: post.image || "",
      tags: (post.tags || []).join(", "),
      isPublished: post.isPublished,
      publishedAt: post.publishedAt ? post.publishedAt.slice(0, 10) : "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.content.trim()) {
      setError("Content is required");
      return;
    }

    setSubmitting(true);
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim() || undefined,
      content: form.content,
      image: form.image.trim() || undefined,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      isPublished: form.isPublished,
      publishedAt: form.publishedAt || undefined,
    };

    if (editing) {
      const res = await blogApi.adminUpdate(editing._id, payload);
      setSubmitting(false);
      if (res.error) setError(res.error);
      else {
        fetchPosts();
        resetForm();
      }
    } else {
      const res = await blogApi.adminCreate(payload);
      setSubmitting(false);
      if (res.error) setError(res.error);
      else {
        fetchPosts();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    const res = await blogApi.adminDelete(id);
    if (!res.error) fetchPosts();
  };

  if (!mounted) return null;

  if (blogEnabled === false) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Blogs</h1>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <p className="text-lg font-medium text-emerald-800">Blog Module is Disabled</p>
          <p className="mt-2 text-sm text-emerald-700">
            Enable it in{" "}
            <a href="/admin/settings/general" className="font-semibold underline">
              General Settings
            </a>{" "}
            under the Features section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Blogs</h1>
        <Button variant="primaryAmber" onClick={() => { resetForm(); setShowForm(true); }}>
          Add Post
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {editing ? "Edit Blog Post" : "Add Blog Post"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label required>Title</Label>
                <Input variant="amber" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <Label>Slug</Label>
                <Input variant="amber" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="leave empty to auto-generate from title" />
              </div>
            </div>
            <div>
              <Label>Excerpt</Label>
              <Textarea variant="amber" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} placeholder="Short summary shown in listings" className="text-sm" />
            </div>
            <div>
              <Label required>Content</Label>
              <HtmlEditor
                value={form.content}
                onChange={(html) => setForm({ ...form, content: html })}
                placeholder="Write your blog post (supports bold, lists, links, headings...)"
                minHeight="280px"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-[auto,1fr]">
              <div>
                <Label>Featured Image</Label>
                <div className="flex items-center gap-3">
                  {form.image && (
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      <img src={getMediaUrl(form.image)} alt="Blog" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button as="button" type="button" variant="secondary" onClick={() => setShowMediaPicker(true)}>
                      {form.image ? "Change" : "Select"} Image
                    </Button>
                    {form.image && (
                      <Button as="button" type="button" variant="secondary" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setForm((prev) => ({ ...prev, image: "" }))}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Label>Tags</Label>
                <Input variant="amber" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Comma-separated (e.g. news, tips, sale)" className="text-sm" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Label className="mb-0">Published</Label>
              </div>
              <div>
                <Label>Publish Date</Label>
                <Input variant="amber" type="date" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} className="text-sm" />
                <p className="mt-1 text-xs text-slate-500">
                  If empty, current date will be used when marking as published.
                </p>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" variant="primaryAmber" disabled={submitting}>
                {submitting ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url) =>
          setForm((prev) => ({
            ...prev,
            image: url,
          }))
        }
        title="Select blog image"
        type="image"
      />

      {loading ? (
        <LoadingState message="Loading posts..." />
      ) : posts.length === 0 ? (
        <EmptyState message='No blog posts yet. Click "Add Post" to create one.' />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Published</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {posts.map((post) => (
                <tr key={post._id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                    {post.title}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {post.slug}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge variant={post.isPublished ? "success" : "draft"}>
                      {post.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <Button as="button" variant="link" onClick={() => handleEdit(post)} className="mr-2 text-amber-600">
                      Edit
                    </Button>
                    <Button as="button" variant="linkRed" onClick={() => handleDelete(post._id)}>
                      Delete
                    </Button>
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

