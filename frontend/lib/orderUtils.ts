import type { Order } from "@/lib/types";

/** Resolve display payment status (handles missing paymentStatus on older orders; infers paid when gateway IDs present). */
export function getDisplayPaymentStatus(order: Order): "paid" | "pending" | "cod" | "failed" {
  const method = (order.paymentMethod || "").toLowerCase();
  const hasGatewayIds = !!(order.paymentGatewayOrderId || order.paymentGatewayPaymentId);
  if ((method === "razorpay" || method === "cashfree") && hasGatewayIds) {
    return "paid";
  }
  if (order.paymentStatus) return order.paymentStatus as "paid" | "pending" | "cod" | "failed";
  if (method === "cod") return "cod";
  return "pending";
}
