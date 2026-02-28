"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminOrdersApi } from "@/lib/api";
import type { Order } from "@/lib/types";
import { getDisplayPaymentStatus } from "@/lib/orderUtils";
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

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string | undefined) || "";
  const { formatCurrency, settings } = useSettings();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    adminOrdersApi.get(id).then((res) => {
      setLoading(false);
      if (res.data?.data) {
        setOrder(res.data.data);
        setStatus(res.data.data.status);
      }
    });
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!order) return;
    setUpdating(true);
    const res = await adminOrdersApi.updateStatus(order._id, status);
    setUpdating(false);
    if (res.data?.data) {
      setOrder(res.data.data);
      setStatus(res.data.data.status);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <LoadingState message="Loading order..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState
          message="Order not found."
          action={<Button type="button" variant="secondary" onClick={() => router.back()}>Go back</Button>}
        />
      </div>
    );
  }

  const user =
    typeof order.userId === "string"
      ? null
      : (order.userId as { _id: string; name: string; email?: string; phone?: string });

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <BackLink href="/admin/orders" label="Orders" />

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
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant={
              order.status === "pending"
                ? "warning"
                : order.status === "delivered"
                  ? "success"
                  : order.status === "cancelled" || order.status === "failed"
                    ? "danger"
                    : "neutral"
            }
          >
            {order.status}
          </Badge>
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
            <Button
              type="button"
              variant="primaryAmber"
              onClick={handleStatusUpdate}
              disabled={updating || status === order.status}
              className="text-xs py-1.5 px-3"
            >
              {updating ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>
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
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Payment & transaction</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Method</dt>
                <dd className="font-medium text-slate-900">{paymentMethodLabel(order.paymentMethod)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Status</dt>
                <dd>
                  <span className={`font-medium ${getDisplayPaymentStatus(order) === "paid" ? "text-emerald-600" : getDisplayPaymentStatus(order) === "cod" ? "text-amber-600" : getDisplayPaymentStatus(order) === "failed" ? "text-red-600" : "text-slate-600"}`}>
                    {getDisplayPaymentStatus(order) === "paid" ? "Paid" : getDisplayPaymentStatus(order) === "cod" ? "Cash on delivery" : getDisplayPaymentStatus(order) === "failed" ? "Failed" : "Pending"}
                  </span>
                </dd>
              </div>
              {order.paymentGatewayOrderId && (
                <div className="flex flex-col gap-0.5">
                  <dt className="text-slate-500">Gateway order ID</dt>
                  <dd className="font-mono text-xs text-slate-700 break-all">{order.paymentGatewayOrderId}</dd>
                </div>
              )}
              {order.paymentGatewayPaymentId && (
                <div className="flex flex-col gap-0.5">
                  <dt className="text-slate-500">Transaction ID</dt>
                  <dd className="font-mono text-xs text-slate-700 break-all">{order.paymentGatewayPaymentId}</dd>
                </div>
              )}
              {order.paidAt && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Paid at</dt>
                  <dd className="text-slate-700">{new Date(order.paidAt).toLocaleString()}</dd>
                </div>
              )}
            </dl>
          </Card>
          {(order.shippingMethodName != null || (order.shippingAmount ?? 0) > 0) && (
            <Card>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Shipping</h2>
              <p className="text-sm text-slate-700">
                {order.shippingMethodName || "Standard"} · {(order.shippingAmount ?? 0) > 0 ? formatCurrency(order.shippingAmount!) : "Free"}
              </p>
            </Card>
          )}
          <Card>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Customer</h2>
            {user ? (
              <div className="space-y-1 text-sm text-slate-700">
                <p className="font-medium text-slate-900">{user.name}</p>
                {user.email && <p>{user.email}</p>}
                {user.phone && <p>{user.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                {order.shippingAddress.name}
              </p>
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

