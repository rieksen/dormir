/**
 * TypeScript types for Dormir API domain models
 */

// ── Core Domain ───────────────────────────────────────────────────────────────

export type Gender = "male" | "female";

export interface Student {
  id: number;
  student_number: string;
  first_name: string;
  last_name: string;
  gender: Gender;
  phone: string;
  email?: string;
  school: string;
  course?: string;
  year_of_study?: number;
}

export interface StudentCreate {
  student_number: string;
  first_name: string;
  last_name: string;
  gender: Gender;
  phone: string;
  email?: string;
  school: string;
  course?: string;
  year_of_study?: number;
}

export interface StudentUpdate {
  student_number?: string;
  first_name?: string;
  last_name?: string;
  gender?: Gender;
  phone?: string;
  email?: string;
  school?: string;
  course?: string;
  year_of_study?: number;
}

export type RoomType = "single" | "double";
export type RoomStatus = "available" | "full" | "maintenance";

export interface Room {
  id: number;
  campus_id: number;
  room_number: string;
  room_type: RoomType;
  price_per_bed: number;
  floor?: number;
  status: RoomStatus;
}

export interface RoomCreate {
  campus_id: number;
  room_number: string;
  room_type: RoomType;
  price_per_bed: number;
  floor?: number;
  status?: RoomStatus;
}

export interface RoomUpdate {
  campus_id?: number;
  room_number?: string;
  room_type?: RoomType;
  price_per_bed?: number;
  floor?: number;
  status?: RoomStatus;
}

export interface Bed {
  id: number;
  room_id: number;
  label: string; // "A" or "B"
}

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface Booking {
  id: number;
  student_id: number;
  room_id: number;
  period_id: number;
  amount_paid: number;
  paid_on: string; // date
  status: BookingStatus;
}

export interface BookingCreate {
  student_id: number;
  room_id: number;
  period_id: number;
  amount_paid: number;
  paid_on: string;
  status?: BookingStatus;
}

export interface BookingUpdate {
  status?: BookingStatus;
  amount_paid?: number;
  paid_on?: string;
}

export type AllocationStatus = "active" | "vacated" | "transferred";

export interface Allocation {
  id: number;
  booking_id: number;
  bed_id: number;
  student_id: number;
  period_id: number;
  allocated_on: string; // date
  status: AllocationStatus;
}

export interface AllocationCreate {
  booking_id: number;
  bed_id: number;
  student_id: number;
  period_id: number;
  allocated_on: string;
  status?: AllocationStatus;
}

export interface AllocationUpdate {
  status?: AllocationStatus;
  bed_id?: number;
}

export interface Campus {
  id: number;
  name: string;
  location?: string;
}

export interface AcademicPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface Fee {
  id: number;
  student_id: number;
  allocation_id?: number; // optional - may not exist for fees not linked to allocation
  period_id: number;
  amount_due: number;
  due_date: string; // date
  balance?: number; // calculated on frontend from payments
}

export interface Payment {
  id: number;
  fee_id: number;
  amount_paid: number;
  paid_on: string; // date
  method: string;
  reference?: string;
}

export interface PaymentCreate {
  fee_id: number;
  amount_paid: number;
  paid_on: string;
  method: string;
  reference?: string;
}

// ── Dashboard Types ───────────────────────────────────────────────────────────

export interface DashboardSummary {
  total_students: number;
  total_rooms: number;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
  rooms_under_maintenance: number;
  active_period_id?: number;
  active_period_name?: string;
  pending_bookings: number;
  confirmed_bookings: number;
  total_fees_due: number;
  total_collected: number;
  outstanding_balance: number;
}

export interface CampusOccupancy {
  campus_id: number;
  campus_name: string;
  total_beds: number;
  occupied_beds: number;
  occupancy_rate: number;
}

export interface RecentPayment {
  student_name: string;
  amount_paid: number;
  paid_on: string;
  method: string;
}

export interface RecentBooking {
  student_name: string;
  room_number: string;
  period_name: string;
  status: string;
  paid_on: string;
}
