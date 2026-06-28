import { apiFetch } from "../api";
import type { ActiveStudent, StudentRegistration, Booking } from "../types";

export async function listStudents(): Promise<ActiveStudent[]> {
  return apiFetch<ActiveStudent[]>("/students");
}

export async function registerStudent(data: StudentRegistration): Promise<{
  student: Omit<ActiveStudent, "booking_id" | "bed_id" | "room_id" | "room_number" | "bed_number" | "semester" | "year">;
  booking: Booking;
  payment: { id: number; booking_id: number; amount: number; status: string; confirmed_at: string | null };
}> {
  return apiFetch("/students/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function checkoutStudent(studentId: number): Promise<Booking> {
  return apiFetch<Booking>(`/students/${studentId}/checkout`, { method: "POST" });
}
