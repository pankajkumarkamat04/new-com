import { PageLayout, EmptyState } from "@/components/ui";
import { BlogCard } from "@/components/shared";
import type { BlogPost } from "@/lib/types";

type BlogListContentProps = {
  posts: BlogPost[];
};

export function BlogListContent({ posts }: BlogListContentProps) {
  return (
    <PageLayout withLayout={false}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Blog</h1>
        {posts.length === 0 ? (
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
