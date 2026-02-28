"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminOrdersApi } from "@/lib/api";
import type { Order } from "@/lib/types";
import { getDisplayPaymentStatus } from "@/lib/orderUtils";
import { useSettings } from "@/contexts/SettingsContext";
import { LoadingState, EmptyState, Badge, Button } from "@/components/ui";

const STATUS_OPTIONS = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled", "failed"] as const;

export default function AdminOrdersPage() {
  const { formatCurrency } = useSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminOrdersApi
      .list({ status })
      .then((res) => {
        if (cancelled) return;
        setLoading(false);
        if (res.data?.data) {
          setOrders(res.data.data);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-600">View and manage customer orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "all" ? "All" : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading orders..." />
      ) : orders.length === 0 ? (
        <EmptyState message="No orders found for this filter." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Order</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Payment</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Transaction</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => {
                const user =
                  typeof order.userId === "string"
                    ? null
                    : (order.userId as { _id: string; name: string; email?: string; phone?: string });
                return (
                  <tr key={order._id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-slate-900">
                        #{order._id.slice(-8).toUpperCase()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-sm text-slate-900">
                        {user?.name || order.shippingAddress.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {user?.email || ""} {user?.phone ? `· ${user.phone}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-slate-900">{formatCurrency(order.total)}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-600 capitalize">
                      {order.paymentMethod || "—"}
                    </td>
                    <td className="px-4 py-3 align-top text-xs">
                      <span className={getDisplayPaymentStatus(order) === "paid" ? "text-emerald-600 font-medium" : getDisplayPaymentStatus(order) === "cod" ? "text-amber-600" : getDisplayPaymentStatus(order) === "failed" ? "text-red-600" : "text-slate-500"}>
                        {getDisplayPaymentStatus(order) === "paid" ? "Paid" : getDisplayPaymentStatus(order) === "cod" ? "COD" : getDisplayPaymentStatus(order) === "failed" ? "Failed" : "Pending"}
                      </span>
                      {order.paymentGatewayPaymentId && (
                        <div className="mt-0.5 font-mono text-[10px] text-slate-400 truncate max-w-[100px]" title={order.paymentGatewayPaymentId}>
                          {order.paymentGatewayPaymentId.slice(0, 12)}…
                        </div>
                      )}
                      {!order.paymentGatewayPaymentId && order.paymentGatewayOrderId && (
                        <div className="mt-0.5 font-mono text-[10px] text-slate-400 truncate max-w-[100px]" title={order.paymentGatewayOrderId}>
                          {order.paymentGatewayOrderId.slice(0, 12)}…
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
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
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-600">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

