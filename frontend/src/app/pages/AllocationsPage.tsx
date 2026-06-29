/**
 * AllocationsPage — bed-level occupancy map
 * Dashboard Flaws principles: grid layout, colour-dot gender tags, monospace counts, hairline borders
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Loader2, AlertCircle, Home, Users, Key } from "lucide-react";
import { apiFetch } from "../lib/api";

interface OccupancyBed  { bed_id: number; bed_number: number; is_occupied: boolean; student_name: string | null; }
interface OccupancyRoom { room_id: number; room_number: string; gender: string; occupied_beds: number; available_beds: number; total_beds: number; beds: OccupancyBed[]; }

async function fetchOccupancy(): Promise<OccupancyRoom[]> { return apiFetch<OccupancyRoom[]>("/reports/occupancy"); }

const GENDER_DOT: Record<string, string> = { Male: "bg-[#3280fa]", Female: "bg-[#c45296]", Unassigned: "bg-[#808080]" };

export default function AllocationsPage() {
  const [rooms, setRooms]       = useState<OccupancyRoom[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [searchTerm, setSearch] = useState("");
  const [filter, setFilter]     = useState<"all" | "occupied" | "available">("all");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setRooms(await fetchOccupancy()); }
    catch (e: any) { setError(e.message ?? "Failed to load occupancy"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return rooms.filter(r => {
      if (!r.room_number.toLowerCase().includes(t)) return false;
      if (filter === "occupied") return r.occupied_beds > 0;
      if (filter === "available") return r.available_beds > 0;
      return true;
    });
  }, [rooms, searchTerm, filter]);

  const totalBeds    = rooms.reduce((s, r) => s + r.total_beds, 0);
  const totalOccupied = rooms.reduce((s, r) => s + r.occupied_beds, 0);

  if (loading) return <div className="flex flex-col items-center justify-center py-24 gap-3"><Loader2 size={24} className="text-[#2fa872] animate-spin" /><p className="text-xs text-[#808080]">Loading allocations…</p></div>;
  if (error)   return <div className="flex flex-col items-center justify-center py-24 gap-4"><AlertCircle size={28} className="text-red-500" /><p className="text-sm text-[#808080] text-center max-w-sm">{error}</p><button onClick={load} className="px-4 py-2 bg-[#2fa872] text-white text-xs font-semibold rounded-lg">Retry</button></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold text-[#808080] uppercase tracking-[0.6px] mb-1">Hostel</p>
        <h1 className="text-[22px] font-semibold text-[#f0f0f0] tracking-[-0.22px]">Allocations</h1>
        <p className="text-[13px] text-[#808080] mt-0.5">Bed-level occupancy across all rooms</p>
      </div>

      {/* Stat chips */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { label: "Rooms",     value: rooms.length,              icon: Home  },
          { label: "Occupied",  value: totalOccupied,             icon: Users },
          { label: "Available", value: totalBeds - totalOccupied, icon: Key   },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-2.5 bg-[#141714] border border-[#212521] rounded-[10px] px-4 py-2.5">
            <span className="font-['Courier_Prime',monospace] text-[18px] text-[#f0f0f0]">{value}</span>
            <span className="text-[11px] text-[#808080] font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Filter + Search row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center bg-[#141714] border border-[#212521] rounded-[8px] p-0.5">
          {(["all", "occupied", "available"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-[6px] text-[11px] font-semibold capitalize transition-all ${filter === f ? "bg-[#2fa872] text-white" : "text-[#808080] hover:text-[#f0f0f0]"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none" />
          <input type="text" placeholder="Room number…" value={searchTerm} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-[#141714] border border-[#212521] rounded-lg text-[13px] text-[#f0f0f0] placeholder-[#808080] focus:outline-none focus:ring-1 focus:ring-[#2fa872] focus:border-[#2fa872] transition-colors" />
        </div>
      </div>

      {/* Room grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[13px] text-[#808080]">No rooms match your filters</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(room => {
            const pct = room.total_beds ? Math.round((room.occupied_beds / room.total_beds) * 100) : 0;
            return (
              <div key={room.room_id} className="bg-[#141714] border border-[#212521] rounded-[10px] p-4 hover:border-[#272b27] transition-colors">
                {/* Room header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold text-[#f0f0f0]">{room.room_number}</p>
                    <div className="inline-flex items-center gap-1 border border-[#272b27] rounded-[14px] px-2 py-0.5">
                      <span className={`w-[5px] h-[5px] rounded-[1px] flex-shrink-0 ${GENDER_DOT[room.gender] ?? "bg-[#808080]"}`} />
                      <span className="text-[10px] font-semibold text-[#f0f0f0]">{room.gender}</span>
                    </div>
                  </div>
                  <span className="font-['Courier_Prime',monospace] text-[12px] text-[#808080]">{room.occupied_beds}/{room.total_beds}</span>
                </div>

                {/* Occupancy bar */}
                <div className="mb-3">
                  <div className="h-1 bg-[#212521] rounded-full overflow-hidden">
                    <div className="h-full bg-[#2fa872] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Bed list */}
                <div className="space-y-1.5">
                  {room.beds.map(bed => (
                    <div key={bed.bed_id} className={`flex items-center justify-between px-3 py-2 rounded-[8px] border ${bed.is_occupied ? "border-[#272b27] bg-[rgba(255,255,255,0.02)]" : "border-[#1f381f] bg-[rgba(47,168,114,0.04)]"}`}>
                      <span className="text-[11px] font-semibold text-[#808080]">Bed {bed.bed_number}</span>
                      {bed.is_occupied
                        ? <span className="text-[11px] font-medium text-[#c8c8c8] truncate max-w-[140px]">{bed.student_name}</span>
                        : <div className="inline-flex items-center gap-1"><span className="w-[5px] h-[5px] rounded-full bg-[#2fa872]" /><span className="text-[11px] font-semibold text-[#2fa872]">Available</span></div>
                      }
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}