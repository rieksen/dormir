/**
 * Payments API client for Dormir API
 */

import { apiFetch } from "../api";
import type { Payment, PaymentCreate } from "../types";

export async function listPayments(): Promise<Payment[]> {
  return apiFetch<Payment[]>("/payments/");
}

export async function getPayment(id: number): Promise<Payment> {
  return apiFetch<Payment>(`/payments/${id}`);
}

export async function createPayment(data: PaymentCreate): Promise<Payment> {
  return apiFetch<Payment>("/payments/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePayment(id: number, data: Partial<Payment>): Promise<Payment> {
  return apiFetch<Payment>(`/payments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deletePayment(id: number): Promise<void> {
  await apiFetch<void>(`/payments/${id}`, { method: "DELETE" });
}
