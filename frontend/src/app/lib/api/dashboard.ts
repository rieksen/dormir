/**
 * Dashboard API client for new Dormir backend
 */

import { apiFetch } from "../api";
import type {
  DashboardSummary,
  CampusOccupancy,
  RecentPayment,
  RecentBooking,
} from "../types";

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/dashboard/summary");
}

export async function fetchCampusOccupancy(): Promise<CampusOccupancy[]> {
  return apiFetch<CampusOccupancy[]>("/dashboard/occupancy");
}

export async function fetchRecentPayments(limit = 10): Promise<RecentPayment[]> {
  return apiFetch<RecentPayment[]>(`/dashboard/recent-payments?limit=${limit}`);
}

export async function fetchRecentBookings(limit = 10): Promise<RecentBooking[]> {
  return apiFetch<RecentBooking[]>(`/dashboard/recent-bookings?limit=${limit}`);
}
