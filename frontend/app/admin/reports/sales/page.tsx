"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { reportsApi, settingsApi } from "@/lib/api";
import type { SalesReportResponse } from "@/lib/api";
import { useSettings } from "@/contexts/SettingsContext";
import type { Order } from "@/lib/types";
import { Card, Button, LoadingState, Badge } from "@/components/ui";

type GroupBy = "day" | "week" | "month";
type StatusFilter = "all" | "pending" | "paid" | "processing" | "confirmed" | "shipped" | "delivered" | "cancelled";

function getUserName(order: Order): string {
  const u = order.userId;
  if (typeof u === "object" && u?.name) return u.name;
  return "—";
}

export default function AdminSalesReportPage() {
  const { formatCurrency } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [report, setReport] = useState<SalesReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [groupBy, setGroupBy] = useState<GroupBy>("day");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    settingsApi.getModules().then((res) => {
      const enabledVal = !!(res.data?.data as { salesReportEnabled?: boolean })?.salesReportEnabled;
      setEnabled(enabledVal);
      if (!enabledVal) setLoading(false);
    });
  }, [mounted]);

  const fetchReport = () => {
    setReportLoading(true);
    reportsApi
      .getSalesReport({
        dateFrom,
        dateTo,
        status: statusFilter,
        groupBy,
      })
      .then((res) => {
        setReport(res.data?.data ?? null);
      })
      .finally(() => setReportLoading(false));
  };

  useEffect(() => {
    if (!mounted || !enabled) return;
    fetchReport();
  }, [mounted, enabled, dateFrom, dateTo, statusFilter, groupBy]);

  if (!mounted) return null;

  if (!enabled) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <Card className="border-amber-200 bg-amber-50/50 p-8 text-center">
          <h2 className="text-lg font-semibold text-amber-800">Sales Report is disabled</h2>
          <p className="mt-2 text-sm text-amber-700">
            Enable &quot;Advanced Sales Report&quot; in Settings → Modules to view this page.
          </p>
          <Button as="link" href="/admin/settings/modules" variant="primaryAmber" className="mt-4">
            Go to Module Settings
          </Button>
        </Card>
      </div>
    );
  }

  const summary = report?.summary ?? { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
  const rows = report?.rows ?? [];
  const orders = report?.orders ?? [];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Sales Report</h1>
        <p className="mt-1 text-slate-600">
          View revenue and orders by date range. Data is loaded from the reports API. Filter by status and group by day, week, or month.
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Filters</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Group by</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="processing">Processing</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <Button type="button" variant="secondary" onClick={fetchReport} disabled={reportLoading} className="text-sm">
            {reportLoading ? "Loading…" : "Refresh report"}
          </Button>
        </div>
      </Card>

      {reportLoading && !report ? (
        <LoadingState message="Loading sales report…" />
      ) : (
        <>
          {/* Summary cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-sm font-medium text-slate-500">Total Revenue</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(summary.totalRevenue)}</p>
              <p className="mt-1 text-xs text-slate-500">In selected date range and status</p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-slate-500">Total Orders</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary.totalOrders.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-500">Order count</p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-slate-500">Average Order Value</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(summary.avgOrderValue)}</p>
              <p className="mt-1 text-xs text-slate-500">Revenue ÷ orders</p>
            </Card>
          </div>

          {/* Breakdown by period */}
          <Card padding="none" className="mb-6">
            <div className="border-b border-slate-200 px-6 py-3">
              <h2 className="text-lg font-semibold text-slate-900">Sales by period</h2>
              <p className="text-sm text-slate-500">Revenue and order count grouped by {groupBy}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Period</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500">Orders</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                        No orders in the selected date range and filters.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.periodKey}>
                        <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">{row.periodLabel}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-slate-600">{row.orders}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-slate-900">
                          {formatCurrency(row.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* All orders in range */}
          <Card padding="none">
            <div className="border-b border-slate-200 px-6 py-3">
              <h2 className="text-lg font-semibold text-slate-900">All orders</h2>
              <p className="text-sm text-slate-500">Up to 500 most recent orders in the selected range (from reports API)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Customer</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No orders to display.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order._id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-slate-600">
                          {order._id.slice(-8)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">{getUserName(order)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-slate-900">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <Badge
                            variant={
                              order.status === "cancelled"
                                ? "danger"
                                : order.status === "delivered"
                                  ? "success"
                                  : "neutral"
                            }
                          >
                            {order.status || "pending"}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <Link
                            href={`/admin/orders/${order._id}`}
                            className="text-sm font-medium text-amber-600 hover:text-amber-700 hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
