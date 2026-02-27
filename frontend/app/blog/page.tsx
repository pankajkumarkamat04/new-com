"use client";

import { useEffect, useState } from "react";
import { blogApi } from "@/lib/api";
import type { BlogPost } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import { PageLayout, LoadingState, EmptyState } from "@/components/ui";
import { BlogCard } from "@/components/shared";

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
      <PageLayout>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <EmptyState message="Blog is not available at the moment." />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Blog</h1>

        {loading ? (
          <LoadingState message="Loading posts..." />
        ) : posts.length === 0 ? (
          <EmptyState message="No blog posts yet." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <BlogCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
