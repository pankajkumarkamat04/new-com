"use client";

import { useRef } from "react";
import type { Order } from "@/lib/types";

type GstInvoiceProps = {
  order: Order;
  formatCurrency: (amount: number) => string;
  companyName: string;
  companyAddress: string;
  companyGstin: string;
  onPrint?: () => void;
  /** When true, only shows Print and Download buttons, hides the full invoice content */
  compact?: boolean;
  /** When true with compact, renders only the buttons (no box/card wrapper) */
  buttonsOnly?: boolean;
};

export function GstInvoice({
  order,
  formatCurrency,
  companyName,
  companyAddress,
  companyGstin,
  compact = false,
  buttonsOnly = false,
}: GstInvoiceProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) {
      handlePrint();
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GST Invoice - Order ${order._id.slice(-8).toUpperCase()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; padding: 24px; color: #111; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 20px; margin-bottom: 24px; border-bottom: 2px solid #111; padding-bottom: 8px; }
            .header { margin-bottom: 24px; }
            .header p { margin: 2px 0; }
            .flex { display: flex; justify-content: space-between; gap: 32px; margin-bottom: 24px; }
            .col { flex: 1; }
            .label { font-weight: 600; margin-bottom: 4px; font-size: 10px; text-transform: uppercase; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
            th { background: #f5f5f5; font-size: 10px; text-transform: uppercase; }
            .text-right { text-align: right; }
            .totals { margin-left: auto; width: 280px; }
            .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
            .totals .total { font-weight: bold; font-size: 14px; border-top: 1px solid #111; margin-top: 8px; padding-top: 8px; }
            .footer { margin-top: 32px; font-size: 11px; color: #666; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GST Invoice - Order ${order._id.slice(-8).toUpperCase()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; padding: 24px; color: #111; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 20px; margin-bottom: 24px; border-bottom: 2px solid #111; padding-bottom: 8px; }
            .header { margin-bottom: 24px; }
            .header p { margin: 2px 0; }
            .flex { display: flex; justify-content: space-between; gap: 32px; margin-bottom: 24px; }
            .col { flex: 1; }
            .label { font-weight: 600; margin-bottom: 4px; font-size: 10px; text-transform: uppercase; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
            th { background: #f5f5f5; font-size: 10px; text-transform: uppercase; }
            .text-right { text-align: right; }
            .totals { margin-left: auto; width: 280px; }
            .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
            .totals .total { font-weight: bold; font-size: 14px; border-top: 1px solid #111; margin-top: 8px; padding-top: 8px; }
            .footer { margin-top: 32px; font-size: 11px; color: #666; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const buyerGstin =
    order.shippingAddress.customFields?.find(
      (f) =>
        (f.key || "").toLowerCase() === "gstin" ||
        (f.label || "").toLowerCase() === "gstin"
    )?.value || "";

  const itemsSubtotal = order.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );
  const subtotal = order.subtotal ?? itemsSubtotal;
  const taxAmount = order.taxAmount ?? 0;
  const discount = order.discountAmount ?? 0;
  const total = order.total;

  const buttons = (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleDownload}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Download
      </button>
      <button
        type="button"
        onClick={handlePrint}
        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-500"
      >
        Print
      </button>
    </div>
  );

  const hiddenInvoiceContent = (
        <div ref={printRef} className="sr-only" aria-hidden="true">
          <h1 className="border-b-2 border-slate-900 pb-2 text-lg font-bold">TAX INVOICE</h1>
          <div className="flex flex-wrap gap-8 lg:flex-nowrap">
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Sold by</p>
              <p className="font-semibold text-slate-900">{companyName || "Company Name"}</p>
              {companyAddress && <p className="whitespace-pre-wrap">{companyAddress}</p>}
              {companyGstin && <p>GSTIN: {companyGstin}</p>}
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Bill to</p>
              <p className="font-semibold text-slate-900">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.address}</p>
              <p>{order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""} {order.shippingAddress.zip}</p>
              <p>Phone: {order.shippingAddress.phone}</p>
              {buyerGstin && <p>GSTIN: {buyerGstin}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-6 text-xs">
            <div><span className="text-slate-500">Invoice No:</span> INV-{order._id.slice(-8).toUpperCase()}</div>
            <div><span className="text-slate-500">Order No:</span> {order._id.slice(-8).toUpperCase()}</div>
            <div><span className="text-slate-500">Date:</span> {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
          </div>
          <table className="min-w-full border-collapse border border-slate-200 text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-600">#</th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-600">Item</th>
                <th className="border border-slate-200 px-3 py-2 text-right text-xs font-semibold uppercase text-slate-600">Qty</th>
                <th className="border border-slate-200 px-3 py-2 text-right text-xs font-semibold uppercase text-slate-600">Rate</th>
                <th className="border border-slate-200 px-3 py-2 text-right text-xs font-semibold uppercase text-slate-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={`${item.productId}::${item.variationName || ""}`}>
                  <td className="border border-slate-200 px-3 py-2">{idx + 1}</td>
                  <td className="border border-slate-200 px-3 py-2 font-medium">
                    {item.name}
                    {item.variationAttributes && item.variationAttributes.length > 0 && (
                      <span className="block text-xs font-normal text-slate-500">
                        {item.variationAttributes.map((a) => (a.name && a.value ? `${a.name}: ${a.value}` : "")).filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-right">{item.quantity}</td>
                  <td className="border border-slate-200 px-3 py-2 text-right">{formatCurrency(item.price)}</td>
                  <td className="border border-slate-200 px-3 py-2 text-right">{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ml-auto w-72">
            <div className="flex justify-between border-b border-slate-100 py-1"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {taxAmount > 0 && <div className="flex justify-between border-b border-slate-100 py-1"><span>Tax</span><span>{formatCurrency(taxAmount)}</span></div>}
            {discount > 0 && <div className="flex justify-between border-b border-slate-100 py-1"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}
            <div className="flex justify-between border-t border-slate-300 py-2 font-bold"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>
          <p className="mt-6 text-xs text-slate-500">Thank you for your order. This is a computer-generated invoice.</p>
        </div>
  );

  if (compact && buttonsOnly) {
    return (
      <>
        {buttons}
        {hiddenInvoiceContent}
      </>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        {!buttonsOnly && <h2 className="text-lg font-semibold text-slate-900">GST Invoice</h2>}
        {buttons}
      </div>
      {!compact && (
      <div
        ref={printRef}
        className="mt-4 space-y-4 text-sm text-slate-700"
        id="gst-invoice-print"
      >
        <h1 className="border-b-2 border-slate-900 pb-2 text-lg font-bold">TAX INVOICE</h1>
        <div className="flex flex-wrap gap-8 lg:flex-nowrap">
          <div className="flex-1">
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Sold by</p>
            <p className="font-semibold text-slate-900">{companyName || "Company Name"}</p>
            {companyAddress && <p className="whitespace-pre-wrap">{companyAddress}</p>}
            {companyGstin && <p>GSTIN: {companyGstin}</p>}
          </div>
          <div className="flex-1">
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Bill to</p>
            <p className="font-semibold text-slate-900">{order.shippingAddress.name}</p>
            <p>{order.shippingAddress.address}</p>
            <p>{order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""} {order.shippingAddress.zip}</p>
            <p>Phone: {order.shippingAddress.phone}</p>
            {buyerGstin && <p>GSTIN: {buyerGstin}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-6 text-xs">
          <div><span className="text-slate-500">Invoice No:</span> INV-{order._id.slice(-8).toUpperCase()}</div>
          <div><span className="text-slate-500">Order No:</span> {order._id.slice(-8).toUpperCase()}</div>
          <div><span className="text-slate-500">Date:</span> {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
        </div>
        <table className="min-w-full border-collapse border border-slate-200 text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-600">#</th>
              <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-600">Item</th>
              <th className="border border-slate-200 px-3 py-2 text-right text-xs font-semibold uppercase text-slate-600">Qty</th>
              <th className="border border-slate-200 px-3 py-2 text-right text-xs font-semibold uppercase text-slate-600">Rate</th>
              <th className="border border-slate-200 px-3 py-2 text-right text-xs font-semibold uppercase text-slate-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={`${item.productId}::${item.variationName || ""}`}>
                <td className="border border-slate-200 px-3 py-2">{idx + 1}</td>
                <td className="border border-slate-200 px-3 py-2 font-medium">
                  {item.name}
                  {item.variationAttributes && item.variationAttributes.length > 0 && (
                    <span className="block text-xs font-normal text-slate-500">
                      {item.variationAttributes.map((a) => (a.name && a.value ? `${a.name}: ${a.value}` : "")).filter(Boolean).join(" · ")}
                    </span>
                  )}
                </td>
                <td className="border border-slate-200 px-3 py-2 text-right">{item.quantity}</td>
                <td className="border border-slate-200 px-3 py-2 text-right">{formatCurrency(item.price)}</td>
                <td className="border border-slate-200 px-3 py-2 text-right">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ml-auto w-72">
          <div className="flex justify-between border-b border-slate-100 py-1"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          {taxAmount > 0 && <div className="flex justify-between border-b border-slate-100 py-1"><span>Tax</span><span>{formatCurrency(taxAmount)}</span></div>}
          {discount > 0 && <div className="flex justify-between border-b border-slate-100 py-1"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}
          <div className="flex justify-between border-t border-slate-300 py-2 font-bold"><span>Total</span><span>{formatCurrency(total)}</span></div>
        </div>
        <p className="mt-6 text-xs text-slate-500">Thank you for your order. This is a computer-generated invoice.</p>
      </div>
      )}
      {compact && !buttonsOnly && hiddenInvoiceContent}
    </div>
  );
}
