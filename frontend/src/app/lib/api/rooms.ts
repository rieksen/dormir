import { apiFetch } from "../api";
import type { Room, AvailableBed, Gender } from "../types";

export async function listRooms(): Promise<Room[]> {
  return apiFetch<Room[]>("/rooms");
}

export async function updateRoomPrice(roomId: number, pricePerBed: number): Promise<Room> {
  return apiFetch<Room>(`/rooms/${roomId}/price`, {
    method: "PUT",
    body: JSON.stringify({ price_per_bed: pricePerBed }),
  });
}

export async function listAvailableBeds(gender: Gender): Promise<AvailableBed[]> {
  return apiFetch<AvailableBed[]>(`/beds/available?gender=${gender}`);
}
