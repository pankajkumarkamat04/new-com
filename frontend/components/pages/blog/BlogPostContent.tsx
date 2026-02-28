import { getMediaUrl } from "@/lib/api";
import { PageLayout, BackLink } from "@/components/ui";
import type { BlogPost } from "@/lib/types";

type BlogPostContentProps = {
  post: BlogPost;
};

export function BlogPostContent({ post }: BlogPostContentProps) {
  return (
    <PageLayout withLayout={false}>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <BackLink href="/blog" label="Back to Blog" />

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
      </div>
    </PageLayout>
  );
}
