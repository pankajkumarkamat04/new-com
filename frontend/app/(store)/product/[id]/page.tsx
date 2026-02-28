import { notFound } from "next/navigation";
import { productApi } from "@/lib/api";
import type { Product } from "@/lib/types";
import { ProductDetailView } from "@/components/pages/product";
import { PageLayout, ErrorState, Button } from "@/components/ui";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage(props: PageProps) {
  const params = await props.params;
  const id = params?.id;

  if (!id) {
    notFound();
  }

  const res = await productApi.get(id);
  const product = res.data?.data as Product | undefined;

  if (!product) {
    return (
      <PageLayout withLayout={false}>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <ErrorState
            message={res.error || "Product not found."}
            action={
              <Button as="link" href="/shop" variant="primary">
                Back to Shop
              </Button>
            }
          />
        </div>
      </PageLayout>
    );
  }

  if (!product.isActive) {
    return (
      <PageLayout withLayout={false}>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <ErrorState
            message="This product is no longer available."
            action={
              <Button as="link" href="/shop" variant="primary">
                Back to Shop
              </Button>
            }
          />
        </div>
      </PageLayout>
    );
  }

  return <ProductDetailView product={product} />;
}
