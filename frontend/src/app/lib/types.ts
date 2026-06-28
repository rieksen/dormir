/**
 * TypeScript types matching the actual Dormir backend models.
 */

// ── Enums ─────────────────────────────────────────────────────────────────────

export type Gender = "Male" | "Female";
export type RoomGender = "Male" | "Female" | "Unassigned";
export type Semester = "Sem1" | "Sem2";
export type BookingStatus = "active" | "checked_out";
export type PaymentStatus = "pending" | "confirmed";
export type PaymentType = "booking" | "full_payment";

// ── Room / Bed ─────────────────────────────────────────────────────────────────

export interface RoomBed {
  bed_id: number;
  bed_number: number;
  is_occupied: boolean;
}

export interface Room {
  id: number;
  room_number: string;
  gender: RoomGender;
  price_per_bed: number;
  occupied_beds: number;
  available_beds: number;
  beds: RoomBed[];
}

export interface AvailableBed {
  id: number;
  room_id: number;
  room_number: string;
  room_gender: RoomGender;
  bed_number: number;
  price_per_bed: number;
  is_occupied: boolean;
}

// ── Student ────────────────────────────────────────────────────────────────────

/** Returned by GET /students — active students with booking/room context */
export interface ActiveStudent {
  id: number;
  full_name: string;
  phone: string;
  emergency_contact: string;
  university: string;
  course: string;
  year_of_study: number;
  course_duration: number;
  gender: Gender;
  semester_joined: Semester;
  year_joined: number;
  // booking context
  booking_id: number;
  bed_id: number;
  room_id: number;
  room_number: string;
  bed_number: number;
  semester: Semester;
  year: number;
}

/** Sent to POST /students/register */
export interface StudentRegistration {
  full_name: string;
  phone: string;
  emergency_contact: string;
  university: string;
  course: string;
  year_of_study: number;
  course_duration: number;
  gender: Gender;
  semester_joined: Semester;
  year_joined: number;
  bed_id: number;
}

// ── Booking ────────────────────────────────────────────────────────────────────

export interface Booking {
  id: number;
  student_id: number;
  bed_id: number;
  semester: Semester;
  year: number;
  status: BookingStatus;
}

// ── Payment ────────────────────────────────────────────────────────────────────

/** Returned by GET /payments/pending and POST /payments/{id}/confirm */
export interface Payment {
  id: number;
  booking_id: number;
  student_id: number;
  student_name: string;
  room_number: string;
  bed_number: number;
  semester: Semester;
  year: number;
  amount: number;
  status: PaymentStatus;
  payment_type: PaymentType | null;
  confirmed_at: string | null;
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  total_students: number;
  total_rooms: number;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
  pending_bookings: number;
  confirmed_bookings: number;
  revenue_collected: number;
  outstanding: number;
}

export interface RecentPayment {
  student_name: string;
  room_number: string;
  bed_number: number;
  amount: number;
  status: PaymentStatus;
  confirmed_at: string | null;
}

export interface RecentBooking {
  student_name: string;
  room_number: string;
  bed_number: number;
  semester: Semester;
  year: number;
  status: BookingStatus;
}