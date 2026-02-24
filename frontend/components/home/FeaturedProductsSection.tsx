import Link from "next/link";
import type { Product } from "@/lib/api";

type Props = {
  products: Product[];
};

const CURRENCY = "INR";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 }).format(amount);

export function FeaturedProductsSection({ products }: Props) {
  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Featured Products</h2>
          <Link href="/shop" className="text-sm font-medium text-emerald-600 hover:text-emerald-500">
            View all →
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-500">
            No products yet. Check back soon!
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product._id}
                href={`/product/${product._id}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-48 w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-slate-400">
                    <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs font-medium uppercase text-emerald-600">{product.category || "Product"}</p>
                  <h3 className="mt-1 font-semibold text-slate-900 group-hover:text-emerald-600">
                    {product.name}
                  </h3>
                  <p className="mt-2 text-lg font-bold text-slate-900">{formatCurrency(product.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

