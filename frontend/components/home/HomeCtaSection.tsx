import Link from "next/link";

export function HomeCtaSection() {
  return (
    <section className="bg-emerald-600 py-16">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white">Ready to start shopping?</h2>
        <p className="mx-auto mt-4 max-w-xl text-emerald-100">
          Join thousands of happy customers. Create your free account today.
        </p>
        <Link
          href="/user/signup"
          className="mt-8 inline-block rounded-xl bg-white px-8 py-4 font-semibold text-emerald-600 transition hover:bg-emerald-50"
        >
          Get Started
        </Link>
      </div>
    </section>
  );
}

