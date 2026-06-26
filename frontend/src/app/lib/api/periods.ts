/**
 * Academic Periods API client
 */

import { apiFetch } from "../api";
import type { AcademicPeriod } from "../types";

export async function listPeriods(): Promise<AcademicPeriod[]> {
  return apiFetch<AcademicPeriod[]>("/periods/");
}

export async function getActivePeriod(): Promise<AcademicPeriod | null> {
  const periods = await listPeriods();
  return periods.find(p => p.is_active) ?? null;
}
