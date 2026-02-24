"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { blogApi } from "@/lib/api";
import type { BlogPost } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getMediaUrl } from "@/lib/api";

export default function BlogListPage() {
  const { blogEnabled } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !blogEnabled) return;
    setLoading(true);
    blogApi.list({ limit: 20 }).then((res) => {
      setLoading(false);
      if (res.data?.data) setPosts(res.data.data);
    });
  }, [mounted, blogEnabled]);

  if (!mounted) return null;

  if (!blogEnabled) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center text-slate-600">
            <p>Blog is not available at the moment.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Blog</h1>

        {loading ? (
          <div className="py-16 text-center text-slate-600">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-12 text-center text-slate-500">
            No blog posts yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post._id}
                href={`/blog/${encodeURIComponent(post.slug)}`}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300 hover:shadow-md"
              >
                {post.image && (
                  <div className="h-48 w-full overflow-hidden border-b border-slate-200 bg-slate-100">
                    <img
                      src={getMediaUrl(post.image)}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-lg font-semibold text-slate-900">{post.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString()
                      : new Date(post.createdAt).toLocaleDateString()}
                  </p>
                  {post.excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm text-slate-600">{post.excerpt}</p>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-emerald-600">
                    Read more
                    <svg
                      className="ml-1 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

