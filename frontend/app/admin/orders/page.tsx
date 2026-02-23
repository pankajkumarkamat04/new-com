"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminOrdersApi, type Order } from "@/lib/api";

const STATUS_OPTIONS = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

export default function AdminOrdersPage() {
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
        <div className="py-12 text-center text-slate-600">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          No orders found for this filter.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Order</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Total</th>
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
                      <div className="font-semibold text-slate-900">${order.total.toFixed(2)}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
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

