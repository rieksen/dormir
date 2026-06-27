/**
 * Fees API client for Dormir API
 */

import { apiFetch } from "../api";
import type { Fee } from "../types";

export async function listFees(): Promise<Fee[]> {
  return apiFetch<Fee[]>("/fees/");
}

export async function getFee(id: number): Promise<Fee> {
  return apiFetch<Fee>(`/fees/${id}`);
}

export async function updateFee(id: number, data: Partial<Fee>): Promise<Fee> {
  return apiFetch<Fee>(`/fees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteFee(id: number): Promise<void> {
  await apiFetch<void>(`/fees/${id}`, { method: "DELETE" });
}
