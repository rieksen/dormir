/**
 * Rooms API client
 */

import { apiFetch } from "../api";
import type { Room, RoomCreate, RoomUpdate, Bed } from "../types";

export async function listRooms(): Promise<Room[]> {
  return apiFetch<Room[]>("/rooms/");
}

export async function getRoom(id: number): Promise<Room> {
  return apiFetch<Room>(`/rooms/${id}`);
}

export async function createRoom(data: RoomCreate): Promise<Room> {
  return apiFetch<Room>("/rooms/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRoom(id: number, data: RoomUpdate): Promise<Room> {
  return apiFetch<Room>(`/rooms/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteRoom(id: number): Promise<void> {
  await apiFetch<void>(`/rooms/${id}`, { method: "DELETE" });
}

export async function listBeds(roomId: number): Promise<Bed[]> {
  return apiFetch<Bed[]>(`/rooms/${roomId}/beds`);
}
