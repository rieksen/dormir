/**
 * Bookings API client
 */

import { apiFetch } from "../api";
import type { Booking, BookingCreate, BookingUpdate } from "../types";

export async function listBookings(): Promise<Booking[]> {
  return apiFetch<Booking[]>("/bookings/");
}

export async function getBooking(id: number): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${id}`);
}

export async function createBooking(data: BookingCreate): Promise<Booking> {
  return apiFetch<Booking>("/bookings/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateBooking(id: number, data: BookingUpdate): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteBooking(id: number): Promise<void> {
  await apiFetch<void>(`/bookings/${id}`, { method: "DELETE" });
}
