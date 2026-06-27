/**
 * Campuses API client
 */

import { apiFetch } from "../api";
import type { Campus } from "../types";

export async function listCampuses(): Promise<Campus[]> {
  return apiFetch<Campus[]>("/campuses/");
}

export async function getCampus(id: number): Promise<Campus> {
  return apiFetch<Campus>(`/campuses/${id}`);
}
