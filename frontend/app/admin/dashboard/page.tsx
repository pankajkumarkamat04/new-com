"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, adminOrdersApi, usersApi } from "@/lib/api";
import type { Order } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import { Card, Badge, Button } from "@/components/ui";

type ChartRange = "daily" | "monthly" | "yearly";

type ChartPoint = {
  key: string;
  label: string;
  orders: number;
  sales: number;
};

const buildChartPoints = (orders: Order[], range: ChartRange): ChartPoint[] => {
  if (!orders.length) return [];

  const now = new Date();
  const start = new Date(now);

  if (range === "daily") {
    start.setDate(start.getDate() - 6);
  } else if (range === "monthly") {
    start.setMonth(start.getMonth() - 11);
  } else {
    start.setFullYear(start.getFullYear() - 4);
  }

  const map = new Map<string, ChartPoint>();

  for (const order of orders) {
    const created = new Date(order.createdAt);
    if (Number.isNaN(created.getTime()) || created < start) continue;

    let key: string;
    let label: string;

    if (range === "daily") {
      key = created.toISOString().slice(0, 10);
      label = created.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } else if (range === "monthly") {
      key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
      label = created.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
    } else {
      key = String(created.getFullYear());
      label = key;
    }

    const existing = map.get(key);
    if (existing) {
      existing.orders += 1;
      existing.sales += order.total;
    } else {
      map.set(key, {
        key,
        label,
        orders: 1,
        sales: order.total,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
};

export default function AdminDashboardPage() {
  const { formatCurrency } = useSettings();
  const [admin, setAdmin] = useState<{ name: string; email: string; phone?: string } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    todaySales: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersForCharts, setOrdersForCharts] = useState<Order[]>([]);
  const [orderRange, setOrderRange] = useState<ChartRange>("daily");
  const [salesRange, setSalesRange] = useState<ChartRange>("daily");

  useEffect(() => {
    adminApi.getMe().then((res) => {
      if (res.data?.admin) setAdmin(res.data.admin);
    });
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);

        const [usersRes, ordersRes, pendingRes] = await Promise.all([
          usersApi.list({ page: 1, limit: 1 }),
          adminOrdersApi.list({ status: "all", page: 1, limit: 500 }),
          adminOrdersApi.list({ status: "pending", page: 1, limit: 1 }),
        ]);

        const totalUsers = usersRes.data?.pagination?.total ?? 0;
        const totalOrders = ordersRes.data?.pagination?.total ?? 0;
        const pendingOrders = pendingRes.data?.pagination?.total ?? 0;
        const orders = ordersRes.data?.data ?? [];

        const today = new Date();
        const todayKey = today.toISOString().slice(0, 10);
        let todaySales = 0;

        for (const order of orders) {
          const created = new Date(order.createdAt);
          if (Number.isNaN(created.getTime())) continue;
          const key = created.toISOString().slice(0, 10);
          if (key === todayKey && order.status !== "cancelled") {
            todaySales += order.total;
          }
        }

        setStats({
          totalUsers,
          totalOrders,
          pendingOrders,
          todaySales,
        });

        setRecentOrders(orders.slice(0, 5));
        setOrdersForCharts(orders);
      } catch {
        setStats({
          totalUsers: 0,
          totalOrders: 0,
          pendingOrders: 0,
          todaySales: 0,
        });
        setRecentOrders([]);
        setOrdersForCharts([]);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const orderChartPoints = buildChartPoints(ordersForCharts, orderRange);
  const salesChartPoints = buildChartPoints(ordersForCharts, salesRange);

  const maxOrders = orderChartPoints.reduce((max, point) => Math.max(max, point.orders), 0);
  const maxSales = salesChartPoints.reduce((max, point) => Math.max(max, point.sales), 0);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {admin?.name || "Admin"}!
        </h1>
        <p className="mt-1 text-slate-600">
          Manage your platform from here.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-slate-500">Total Users</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {statsLoading ? "…" : stats.totalUsers.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">Registered users in the system</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-slate-500">Total Orders</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {statsLoading ? "…" : stats.totalOrders.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">All orders placed so far</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-slate-500">Pending Orders</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {statsLoading ? "…" : stats.pendingOrders.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">Orders awaiting processing</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-slate-500">Today Sales</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {statsLoading ? "…" : formatCurrency(stats.todaySales)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Total sales amount for today</p>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Management</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/products"
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-amber-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900">Product Management</p>
              <p className="text-sm text-slate-500">Add, edit, and delete products</p>
            </div>
          </Link>

          <Link
            href="/admin/orders"
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-amber-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900">Order Management</p>
              <p className="text-sm text-slate-500">View and manage all orders</p>
            </div>
          </Link>

          <Link
            href="/admin/settings/general"
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-amber-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900">Store Settings</p>
              <p className="text-sm text-slate-500">Update general and SEO settings</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <Card className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
          <Button as="link" href="/admin/orders" variant="primary" className="bg-slate-900 hover:bg-slate-800">
            View all
          </Button>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-slate-500">No recent orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => {
                  const shortId = order._id.slice(-6);
                  const customerName =
                    typeof order.userId === "object" && order.userId && "name" in order.userId
                      ? order.userId.name || "Customer"
                      : "Customer";

                  return (
                    <tr key={order._id} className="align-middle">
                      <td className="py-2 pr-4 text-xs font-mono text-slate-700">#{shortId}</td>
                      <td className="py-2 pr-4 text-sm text-slate-800">{customerName}</td>
                      <td className="py-2 pr-4 text-sm text-slate-900">{formatCurrency(order.total)}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="neutral">{order.status}</Badge>
                      </td>
                      <td className="py-2 pr-4 text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="text-xs font-medium text-amber-600 hover:text-amber-700"
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
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Orders Chart */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Orders Overview</h2>
            <div className="flex gap-1 rounded-full bg-slate-100 p-1 text-xs font-medium text-slate-600">
              {(["daily", "monthly", "yearly"] as ChartRange[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setOrderRange(range)}
                  className={`rounded-full px-2 py-0.5 capitalize transition ${
                    orderRange === range ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          {orderChartPoints.length === 0 ? (
            <p className="text-sm text-slate-500">Not enough data to display orders chart.</p>
          ) : (
            <div className="flex h-40 items-end gap-2">
              {orderChartPoints.map((point) => {
                const height =
                  maxOrders > 0 ? Math.max(8, Math.round((point.orders / maxOrders) * 100)) : 0;
                return (
                  <div key={point.key} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-amber-500"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-slate-500">{point.label}</span>
                    <span className="text-[10px] font-semibold text-slate-800">
                      {point.orders}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Daily Sales Chart */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Sales Overview</h2>
            <div className="flex gap-1 rounded-full bg-slate-100 p-1 text-xs font-medium text-slate-600">
              {(["daily", "monthly", "yearly"] as ChartRange[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setSalesRange(range)}
                  className={`rounded-full px-2 py-0.5 capitalize transition ${
                    salesRange === range ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          {salesChartPoints.length === 0 ? (
            <p className="text-sm text-slate-500">Not enough data to display sales chart.</p>
          ) : (
            <div className="flex h-40 items-end gap-2">
              {salesChartPoints.map((point) => {
                const height =
                  maxSales > 0 ? Math.max(8, Math.round((point.sales / maxSales) * 100)) : 0;
                return (
                  <div key={point.key} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-emerald-500"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-slate-500">{point.label}</span>
                    <span className="text-[10px] font-semibold text-slate-800">
                      {formatCurrency(point.sales)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Links */}
      <Card className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick Links</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/" className="text-amber-600 hover:underline">
            Home
          </Link>
          <Link href="/admin/dashboard" className="text-amber-600 hover:underline">
            Dashboard
          </Link>
          <Link href="/admin/products" className="text-amber-600 hover:underline">
            Products
          </Link>
          <Link href="/admin/orders" className="text-amber-600 hover:underline">
            Orders
          </Link>
          <Link href="/admin/settings/general" className="text-amber-600 hover:underline">
            Settings
          </Link>
        </div>
      </Card>
    </div>
  );
}
