"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ordersApi } from "@/lib/api";
import type { Order } from "@/lib/types";
import { getDisplayPaymentStatus } from "@/lib/orderUtils";
import { useSettings } from "@/contexts/SettingsContext";
import { LoadingState, EmptyState, Badge, Button } from "@/components/ui";

const ORDERS_PER_PAGE = 5;

export default function UserOrdersPage() {
  const { formatCurrency } = useSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ORDERS_PER_PAGE);

  useEffect(() => {
    ordersApi.getMyOrders().then((res) => {
      setLoading(false);
      if (res.data?.data) setOrders(res.data.data);
    });
  }, []);

  const visibleOrders = orders.slice(0, visibleCount);
  const hasMore = visibleCount < orders.length;
  const viewMore = () => setVisibleCount((c) => c + ORDERS_PER_PAGE);

  if (loading) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        <p className="mt-2 text-slate-500">View and track your orders.</p>
        <LoadingState message="Loading orders..." className="mt-8" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        <p className="mt-2 text-slate-500">View and track your orders.</p>
        <EmptyState
          message="No orders yet"
          action={
            <Button as="link" href="/shop" variant="link" className="text-emerald-600">
              Start Shopping
            </Button>
          }
          className="mt-8"
        />
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
      <p className="mt-2 text-slate-500">View and track your orders.</p>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Order
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Items
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Total
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Payment
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Shipping to
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {visibleOrders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                    #{order._id.slice(-8).toUpperCase()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {order.items.length} item(s)
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    <span className="capitalize">{order.paymentMethod || "—"}</span>
                    <span className={`ml-1 ${getDisplayPaymentStatus(order) === "paid" ? "text-emerald-600" : getDisplayPaymentStatus(order) === "cod" ? "text-amber-600" : getDisplayPaymentStatus(order) === "failed" ? "text-red-600" : "text-slate-400"}`}>
                      {getDisplayPaymentStatus(order) === "paid" ? "· Paid" : getDisplayPaymentStatus(order) === "cod" ? "" : getDisplayPaymentStatus(order) === "failed" ? "· Failed" : "· Pending"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
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
                  <td className="max-w-[180px] truncate px-4 py-3 text-sm text-slate-600" title={`${order.shippingAddress.name}, ${order.shippingAddress.city}`}>
                    {order.shippingAddress.name}, {order.shippingAddress.city}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <Link
                      href={`/user/orders/${order._id}`}
                      className="font-medium text-emerald-600 hover:text-emerald-500 hover:underline"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <Button type="button" variant="secondary" onClick={viewMore}>
              View more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
