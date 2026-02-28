"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ordersApi, addressApi } from "@/lib/api";
import { PageLayout, Card, Button } from "@/components/ui";

const STORAGE_KEY = "checkout_cashfree_payload";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const cfOrderId = searchParams.get("cf_order_id") || searchParams.get("order_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cfOrderId) {
      setStatus("error");
      setError("Missing order reference. Return from the payment page or try checkout again.");
      return;
    }
    let mounted = true;
    const run = async () => {
      try {
        const raw = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
        if (!raw) {
          if (mounted) {
            setStatus("error");
            setError("Checkout session expired. Please place your order again from the cart.");
          }
          return;
        }
        const payload = JSON.parse(raw) as {
          shippingAddress: { name: string; address: string; city: string; state?: string; zip: string; phone: string; country?: string; customFields?: { key: string; label: string; value: string }[] };
          paymentMethod?: string;
          couponCode?: string;
          shippingMethodId?: string;
          shippingAmount?: number;
          cashfreePayment?: { order_id: string };
          saveAddressForLater?: boolean;
        };
        payload.cashfreePayment = { order_id: cfOrderId };
        const res = await ordersApi.placeOrder(payload);
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch (_) {}
        if (!mounted) return;
        if (res.error) {
          setStatus("error");
          setError(res.error);
          return;
        }
        if (res.data?.data?._id) {
          setOrderId(res.data.data._id);
          setStatus("success");
          if (payload.saveAddressForLater && payload.shippingAddress?.name && payload.shippingAddress?.address && payload.shippingAddress?.city && payload.shippingAddress?.zip && payload.shippingAddress?.phone) {
            try {
              await addressApi.create({
                name: payload.shippingAddress.name,
                address: payload.shippingAddress.address,
                city: payload.shippingAddress.city,
                state: payload.shippingAddress.state,
                zip: payload.shippingAddress.zip,
                phone: payload.shippingAddress.phone,
                country: payload.shippingAddress.country || "IN",
                customFields: payload.shippingAddress.customFields,
              });
            } catch (_) {}
          }
        } else {
          setStatus("error");
          setError("Order could not be completed.");
        }
      } catch (e) {
        if (mounted) {
          setStatus("error");
          setError(e instanceof Error ? e.message : "Something went wrong.");
        }
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [cfOrderId]);

  if (status === "loading") {
    return (
      <PageLayout>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Card padding="large" className="mx-auto max-w-md text-center">
            <p className="text-slate-600">Confirming your payment and placing order...</p>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (status === "error") {
    return (
      <PageLayout>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Card padding="large" className="mx-auto max-w-md border-red-200 bg-red-50 text-center">
            <h1 className="text-xl font-bold text-red-800">Payment confirmation failed</h1>
            <p className="mt-2 text-red-700">{error}</p>
            <Button as="link" href="/checkout" variant="primary" className="mt-6">
              Back to Checkout
            </Button>
            <Link href="/cart" className="mt-4 block text-sm text-slate-500 hover:underline">
              View Cart
            </Link>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Card padding="large" className="mx-auto max-w-md border-emerald-200 bg-emerald-50 text-center">
          <h1 className="text-2xl font-bold text-emerald-800">Order Placed</h1>
          <p className="mt-2 text-emerald-700">Thank you for your order. Your payment was successful.</p>
          {orderId && <p className="mt-2 text-sm text-slate-600">Order ID: {orderId}</p>}
          <Button as="link" href="/user/orders" variant="primary" className="mt-6">
            View My Orders
          </Button>
          <Link href="/shop" className="mt-4 block text-sm text-slate-500 hover:underline">
            Continue Shopping
          </Link>
        </Card>
      </div>
    </PageLayout>
  );
}
