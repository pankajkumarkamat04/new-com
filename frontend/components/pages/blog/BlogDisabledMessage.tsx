import { PageLayout, EmptyState } from "@/components/ui";

export function BlogDisabledMessage() {
  return (
    <PageLayout withLayout={false}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState message="Blog is not available at the moment." />
      </div>
    </PageLayout>
  );
}
