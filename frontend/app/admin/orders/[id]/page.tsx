"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { adminOrdersApi } from "@/lib/api";
import type { Order } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";

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
  const { formatCurrency } = useSettings();
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
        <p className="text-slate-600">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-slate-600">Order not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Go back
        </button>
      </div>
    );
  }

  const user =
    typeof order.userId === "string"
      ? null
      : (order.userId as { _id: string; name: string; email?: string; phone?: string });

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/orders" className="hover:underline">
          Orders
        </Link>
        <span>/</span>
        <span className="text-slate-700">Order #{order._id.slice(-8).toUpperCase()}</span>
      </div>

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
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${
              order.status === "pending"
                ? "bg-amber-100 text-amber-800"
                : order.status === "delivered"
                ? "bg-emerald-100 text-emerald-800"
                : order.status === "cancelled"
                ? "bg-red-100 text-red-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {order.status}
          </span>
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
            </select>
            <button
              type="button"
              onClick={handleStatusUpdate}
              disabled={updating || status === order.status}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {updating ? "Updating..." : "Update Status"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Items</h2>
            <ul className="divide-y divide-slate-100 text-sm">
              {order.items.map((item) => (
                <li key={item.productId} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
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
            <div className="mt-4 border-t border-slate-200 pt-4 text-right">
              <p className="text-sm text-slate-600">Total</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(order.total)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Payment</h2>
            <p className="text-sm text-slate-700">
              {paymentMethodLabel(order.paymentMethod)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
          </div>
        </div>
      </div>
    </div>
  );
}

