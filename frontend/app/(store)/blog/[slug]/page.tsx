import { notFound } from "next/navigation";
import { blogApi, settingsApi } from "@/lib/api";
import type { BlogPost, PublicSettings } from "@/lib/types";
import { BlogPostContent, BlogPostNotFound } from "@/components/pages/blog";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BlogDetailPage(props: PageProps) {
  const params = await props.params;
  const slug = params?.slug;

  if (!slug) {
    notFound();
  }

  const [postRes, publicRes] = await Promise.all([
    blogApi.getBySlug(slug),
    settingsApi.getPublic(),
  ]);

  const publicData = (publicRes.data?.data || null) as PublicSettings | null;
  const blogEnabled = (publicData?.general as { blogEnabled?: boolean } | undefined)?.blogEnabled !== false;
  const post = postRes.data?.data as BlogPost | undefined;

  if (!blogEnabled) {
    return <BlogPostNotFound />;
  }

  if (!post) {
    notFound();
  }

  return <BlogPostContent post={post} />;
}
