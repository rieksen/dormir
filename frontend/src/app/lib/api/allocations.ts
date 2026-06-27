/**
 * Allocations API client
 */

import { apiFetch } from "../api";
import type { Allocation, AllocationCreate, AllocationUpdate } from "../types";

export async function listAllocations(): Promise<Allocation[]> {
  return apiFetch<Allocation[]>("/allocations/");
}

export async function getAllocation(id: number): Promise<Allocation> {
  return apiFetch<Allocation>(`/allocations/${id}`);
}

export async function createAllocation(data: AllocationCreate): Promise<Allocation> {
  return apiFetch<Allocation>("/allocations/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAllocation(id: number, data: AllocationUpdate): Promise<Allocation> {
  return apiFetch<Allocation>(`/allocations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAllocation(id: number): Promise<void> {
  await apiFetch<void>(`/allocations/${id}`, { method: "DELETE" });
}
