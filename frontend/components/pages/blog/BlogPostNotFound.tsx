import { PageLayout, BackLink } from "@/components/ui";

export function BlogPostNotFound() {
  return (
    <PageLayout withLayout={false}>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <BackLink href="/blog" label="Back to Blog" />
        <p className="mt-4 text-slate-600">Blog is not available at the moment.</p>
      </div>
    </PageLayout>
  );
}
