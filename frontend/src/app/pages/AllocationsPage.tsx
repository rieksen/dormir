/**
 * AllocationsPage — room occupancy view (bed-level allocation map)
 * Backed by GET /reports/occupancy
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Loader2, AlertCircle, Key,
} from "lucide-react";
import { apiFetch } from "../lib/api";

// ── Types matching /reports/occupancy ─────────────────────────────────────────

interface OccupancyBed {
  bed_id: number;
  bed_number: number;
  is_occupied: boolean;
  student_name: string | null;
}

interface OccupancyRoom {
  room_id: number;
  room_number: string;
  gender: string;
  occupied_beds: number;
  available_beds: number;
  total_beds: number;
  beds: OccupancyBed[];
}

async function fetchOccupancy(): Promise<OccupancyRoom[]> {
  return apiFetch<OccupancyRoom[]>("/reports/occupancy");
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AllocationsPage() {
  const [rooms, setRooms] = useState<OccupancyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "occupied" | "available">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRooms(await fetchOccupancy());
    } catch (err: any) {
      setError(err.message ?? "Failed to load occupancy");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return rooms.filter(r => {
      if (!r.room_number.toLowerCase().includes(t)) return false;
      if (filter === "occupied") return r.occupied_beds > 0;
      if (filter === "available") return r.occupied_beds < r.total_beds;
      return true;
    });
  }, [rooms, searchTerm, filter]);

  const totalBeds = rooms.reduce((s, r) => s + r.total_beds, 0);
  const totalOccupied = rooms.reduce((s, r) => s + r.occupied_beds, 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 size={28} className="text-primary animate-spin" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading allocations…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <AlertCircle size={32} className="text-red-500" />
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-sm">{error}</p>
      <button onClick={load} className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-sm font-semibold rounded-lg shadow-sm active:scale-[0.98] transition-all">Retry</button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Allocations</h1>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{totalOccupied}/{totalBeds} beds occupied</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150/80 dark:border-slate-800/80 p-4 shadow-sm">
          <p className="text-xl font-bold text-blue-650 dark:text-blue-400">{rooms.length}</p>
          <p className="text-xs font-medium text-slate-500 mt-1.5 font-semibold">Rooms</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150/80 dark:border-slate-800/80 p-4 shadow-sm">
          <p className="text-xl font-bold text-amber-600 dark:text-amber-450">{totalOccupied}</p>
          <p className="text-xs font-medium text-slate-500 mt-1.5 font-semibold">Occupied</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150/80 dark:border-slate-800/80 p-4 shadow-sm">
          <p className="text-xl font-bold text-primary">{totalBeds - totalOccupied}</p>
          <p className="text-xs font-medium text-slate-500 mt-1.5 font-semibold">Available</p>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "occupied", "available"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all active:scale-[0.98] ${
              filter === f
                ? "bg-primary text-white shadow-sm"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {f}
          </button>
        ))}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450" />
          <input
            type="text"
            placeholder="Room number…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
          />
        </div>
      </div>

      {/* Room allocation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(room => (
          <div key={room.room_id} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150/80 dark:border-slate-800/80 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{room.room_number}</p>
                <span className={`text-[10px] font-bold ${room.gender === "Male" ? "text-blue-650" : room.gender === "Female" ? "text-pink-650" : "text-slate-400"}`}>
                  {room.gender}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-450 dark:text-slate-500">
                <Key size={12} />
                {room.occupied_beds}/{room.total_beds}
              </div>
            </div>
            <div className="space-y-2">
              {room.beds.map(bed => (
                <div
                  key={bed.bed_id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs border ${
                    bed.is_occupied
                      ? "bg-amber-50 dark:bg-amber-955/20 border-amber-250/20 text-slate-750 dark:text-slate-300"
                      : "bg-accent dark:bg-accent/10 border-primary/10 text-slate-750 dark:text-slate-300"
                  }`}
                >
                  <span className="font-semibold">Bed {bed.bed_number}</span>
                  {bed.is_occupied
                    ? <span className="text-amber-700 dark:text-amber-400 font-semibold truncate max-w-[120px]">{bed.student_name}</span>
                    : <span className="text-primary font-semibold">Available</span>
                  }
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">No rooms match your filters</div>
      )}
    </div>
  );
}