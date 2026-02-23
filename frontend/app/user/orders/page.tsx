"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ordersApi, type Order } from "@/lib/api";
import { useSettings } from "@/contexts/SettingsContext";

export default function UserOrdersPage() {
  const { formatCurrency } = useSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getMyOrders().then((res) => {
      setLoading(false);
      if (res.data?.data) setOrders(res.data.data);
    });
  }, []);

  if (loading) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        <p className="mt-2 text-slate-500">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        <p className="mt-2 text-slate-500">View and track your orders.</p>
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-16">
          <p className="text-slate-500">No orders yet</p>
          <Link href="/shop" className="mt-4 text-emerald-600 hover:underline">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
      <p className="mt-2 text-slate-500">View and track your orders.</p>

      <div className="mt-8 space-y-6">
        {orders.map((order) => (
          <div
            key={order._id}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  Order #{order._id.slice(-8).toUpperCase()}
                </p>
                <p className="text-sm text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item(s)
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">{formatCurrency(order.total)}</p>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    order.status === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : order.status === "delivered"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="text-sm font-medium text-slate-600">Shipping to</p>
              <p className="text-slate-700">
                {order.shippingAddress.name}, {order.shippingAddress.address},{" "}
                {order.shippingAddress.city}
                {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}{" "}
                {order.shippingAddress.zip}
              </p>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              {order.items.map((item, i) => (
                <li key={i}>
                  {item.name} × {item.quantity} — {formatCurrency(item.price * item.quantity)}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end">
              <Link
                href={`/user/orders/${order._id}`}
                className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
