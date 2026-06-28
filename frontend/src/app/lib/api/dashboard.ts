import { apiFetch } from "../api";
import type { DashboardSummary, RecentPayment, RecentBooking, Payment, ActiveStudent } from "../types";

interface ReportsSummary {
  total_students: number;
  revenue_collected: number;
  pending: number;
  occupied_beds: number;
  total_beds: number;
  current_prices: { room_id: number; room_number: string; price_per_bed: number }[];
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const [reportsSummary, pendingPayments] = await Promise.all([
    apiFetch<ReportsSummary>("/reports/summary"),
    apiFetch<Payment[]>("/payments/pending").catch(() => []),
  ]);
  const totalBeds = reportsSummary.total_beds;
  const occupiedBeds = reportsSummary.occupied_beds;
  return {
    total_students: reportsSummary.total_students,
    total_rooms: reportsSummary.current_prices.length,
    total_beds: totalBeds,
    occupied_beds: occupiedBeds,
    available_beds: totalBeds - occupiedBeds,
    occupancy_rate: totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0,
    pending_bookings: pendingPayments.length,
    confirmed_bookings: Math.max(0, reportsSummary.total_students - pendingPayments.length),
    revenue_collected: reportsSummary.revenue_collected,
    outstanding: reportsSummary.pending,
  };
}

export async function fetchRecentPayments(limit = 10): Promise<RecentPayment[]> {
  try {
    const pending = await apiFetch<Payment[]>("/payments/pending");
    return pending.slice(0, limit).map(p => ({
      student_name: p.student_name,
      room_number: p.room_number,
      bed_number: p.bed_number,
      amount: p.amount,
      status: "pending",
      confirmed_at: null,
    }));
  } catch (e) {
    return [];
  }
}

export async function fetchRecentBookings(limit = 10): Promise<RecentBooking[]> {
  try {
    const students = await apiFetch<ActiveStudent[]>("/students");
    const sorted = [...students].sort((a, b) => b.booking_id - a.booking_id);
    return sorted.slice(0, limit).map(s => ({
      student_name: s.full_name,
      room_number: s.room_number,
      bed_number: s.bed_number,
      semester: s.semester,
      year: s.year,
      status: "active",
    }));
  } catch (e) {
    return [];
  }
}
