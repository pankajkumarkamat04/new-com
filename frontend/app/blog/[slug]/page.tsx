"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { blogApi, getMediaUrl } from "@/lib/api";
import type { BlogPost } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import { PageLayout, BackLink, LoadingState, ErrorState } from "@/components/ui";

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
    <PageLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <BackLink href="/blog" label="Back to Blog" />

        {loading ? (
          <LoadingState message="Loading post..." />
        ) : error || !post ? (
          <ErrorState message={error || "Post not found."} />
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
            <div
              className="prose prose-slate mt-8 max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-medium [&_a]:text-amber-600 [&_a]:underline [&_a:hover]:text-amber-700"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        )}
      </div>
    </PageLayout>
  );
}
