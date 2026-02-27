"use client";

import Link from "next/link";
import { getMediaUrl } from "@/lib/api";
import type { BlogPost } from "@/lib/types";

type BlogCardProps = {
  post: BlogPost;
  className?: string;
};

export default function BlogCard({ post, className = "" }: BlogCardProps) {
  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString()
    : new Date(post.createdAt).toLocaleDateString();

  return (
    <Link
      href={`/blog/${encodeURIComponent(post.slug)}`}
      className={`flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300 hover:shadow-md ${className}`.trim()}
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
        <p className="mt-1 text-xs text-slate-500">{dateStr}</p>
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
          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
