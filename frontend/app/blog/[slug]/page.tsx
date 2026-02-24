"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { blogApi, getMediaUrl } from "@/lib/api";
import type { BlogPost } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function BlogDetailPage() {
  const { blogEnabled } = useSettings();
  const params = useParams();
  const slug = params?.slug as string;

  const [mounted, setMounted] = useState(false);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !slug) return;
    if (!blogEnabled) {
      setLoading(false);
      setError("Blog is not available at the moment.");
      return;
    }
    setLoading(true);
    setError(null);
    blogApi.getBySlug(slug).then((res) => {
      setLoading(false);
      if (res.data?.data) {
        setPost(res.data.data);
      } else {
        setError(res.error || "Post not found.");
      }
    });
  }, [mounted, slug, blogEnabled]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/blog"
          className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
        >
          <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </Link>

        {loading ? (
          <div className="py-16 text-center text-slate-600">Loading post...</div>
        ) : error || !post ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center text-slate-600">
            <p>{error || "Post not found."}</p>
          </div>
        ) : (
          <article>
            <h1 className="text-3xl font-bold text-slate-900">{post.title}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString()
                : new Date(post.createdAt).toLocaleDateString()}
            </p>
            {post.tags && post.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
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
            {post.image && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <img
                  src={getMediaUrl(post.image)}
                  alt={post.title}
                  className="h-full w-full max-h-[400px] object-cover"
                />
              </div>
            )}
            <div className="prose prose-slate mt-8 max-w-none whitespace-pre-wrap">
              {post.content}
            </div>
          </article>
        )}
      </div>
      <Footer />
    </div>
  );
}

