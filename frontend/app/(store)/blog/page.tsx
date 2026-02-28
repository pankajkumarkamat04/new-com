import { blogApi, settingsApi } from "@/lib/api";
import type { BlogPost, PublicSettings } from "@/lib/types";
import { BlogListContent, BlogDisabledMessage } from "@/components/pages/blog";

export const dynamic = "force-dynamic";

export default async function BlogListPage() {
  const [postsRes, publicRes] = await Promise.all([
    blogApi.list({ limit: 20 }),
    settingsApi.getPublic(),
  ]);

  const publicData = (publicRes.data?.data || null) as PublicSettings | null;
  const blogEnabled = (publicData?.general as { blogEnabled?: boolean } | undefined)?.blogEnabled !== false;
  const posts: BlogPost[] = postsRes.data?.data ?? [];

  if (!blogEnabled) {
    return <BlogDisabledMessage />;
  }

  return <BlogListContent posts={posts} />;
}
