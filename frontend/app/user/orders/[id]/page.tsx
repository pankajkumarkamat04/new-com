"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ordersApi } from "@/lib/api";
import type { Order } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import { GstInvoice } from "@/components/GstInvoice";
import { LoadingState, ErrorState, BackLink, Card, Badge, Button } from "@/components/ui";

function paymentMethodLabel(method: string | undefined): string {
  if (!method) return "—";
  const m = (method || "").toLowerCase();
  if (m === "cod") return "Cash on Delivery (COD)";
  if (m === "razorpay") return "Razorpay";
  if (m === "cashfree") return "Cashfree";
  return method;
}

export default function UserOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { formatCurrency, settings } = useSettings();
  const id = (params?.id as string | undefined) || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    ordersApi.getOrder(id).then((res) => {
      setLoading(false);
      if (res.data?.data) {
        setOrder(res.data.data);
      }
    });
  }, [id]);

  if (loading) {
    return (
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <LoadingState message="Loading order..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <ErrorState
          message="Order not found."
          action={<Button type="button" variant="secondary" onClick={() => router.back()}>Go back</Button>}
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
        <BackLink href="/user/orders" label="My Orders" />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Order #{order._id.slice(-8).toUpperCase()}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Placed on {new Date(order.createdAt).toLocaleString()}
              {order.paymentMethod && (
                <> · Payment: {paymentMethodLabel(order.paymentMethod)}</>
              )}
            </p>
          </div>
          <Badge
            variant={
              order.status === "pending"
                ? "warning"
                : order.status === "delivered"
                  ? "success"
                  : order.status === "cancelled"
                    ? "danger"
                    : "neutral"
            }
          >
            {order.status}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Items</h2>
              <ul className="divide-y divide-slate-100 text-sm">
                {order.items.map((item) => (
                  <li
                    key={`${item.productId}::${item.variationName || ""}`}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      {item.variationAttributes &&
                        item.variationAttributes.length > 0 && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.variationAttributes
                              .map(
                                (a) =>
                                  a.name && a.value
                                    ? `${a.name}: ${a.value}`
                                    : ""
                              )
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      <p className="text-xs text-slate-500">
                        {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="text-right text-sm font-semibold text-slate-900">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-slate-200 pt-4 space-y-1 text-right">
                {order.subtotal != null && order.subtotal !== order.total && (
                  <div className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span>Subtotal: {formatCurrency(order.subtotal)}</span>
                    {order.taxAmount != null && order.taxAmount > 0 && (
                      <span>Tax: {formatCurrency(order.taxAmount)}</span>
                    )}
                    {(order.shippingMethodName != null || (order.shippingAmount ?? 0) > 0) && (
                      <span>Shipping{order.shippingMethodName ? ` (${order.shippingMethodName})` : ""}: {(order.shippingAmount ?? 0) > 0 ? formatCurrency(order.shippingAmount!) : "Free"}</span>
                    )}
                    {(order.discountAmount ?? 0) > 0 && (
                      <span>Discount: -{formatCurrency(order.discountAmount!)}</span>
                    )}
                  </div>
                )}
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(order.total)}</p>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Shipping Address</h2>
              <div className="space-y-1 text-sm text-slate-700">
                <p>{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city}
                  {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}{" "}
                  {order.shippingAddress.zip}
                </p>
                <p>Phone: {order.shippingAddress.phone}</p>
              </div>
              {order.shippingAddress.customFields && order.shippingAddress.customFields.length > 0 && (
                <div className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-700">
                  <h3 className="mb-2 font-semibold text-slate-900">Additional Details</h3>
                  <dl className="space-y-1">
                    {order.shippingAddress.customFields.map((field, index) => (
                      <div key={index} className="flex gap-2">
                        <dt className="w-40 text-slate-500">{field.label || field.key}</dt>
                        <dd className="flex-1 text-slate-800">{field.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </Card>
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Download Invoice</h2>
              <div className="flex gap-2">
                <GstInvoice
                  order={order}
                  formatCurrency={formatCurrency}
                  companyName={settings?.siteName || "Company"}
                  companyAddress={settings?.contactAddress || ""}
                  companyGstin={settings?.companyGstin || ""}
                  compact
                  buttonsOnly
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
  );
}

