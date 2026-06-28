import { apiFetch } from "../api";
import type { Payment, PaymentType } from "../types";

export async function listPendingPayments(): Promise<Payment[]> {
  return apiFetch<Payment[]>("/payments/pending");
}

export async function confirmPayment(paymentId: number, paymentType: PaymentType): Promise<Payment> {
  return apiFetch<Payment>(`/payments/${paymentId}/confirm?payment_type=${paymentType}`, { method: "POST" });
}
