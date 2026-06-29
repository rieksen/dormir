/**
 * RoomsPage — room list with price editing
 * Dashboard Flaws principles: grid table, monospace price, colour-dot gender, hairline borders
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Edit, X, Check, Loader2, AlertCircle, Building2, Bed } from "lucide-react";
import { listRooms, updateRoomPrice } from "../lib/api/rooms";
import type { Room, RoomGender } from "../lib/types";

const fmt = (v: number) => `UGX ${v.toLocaleString()}`;
const GENDER_DOT: Record<RoomGender, string> = { Male: "bg-[#3280fa]", Female: "bg-[#c45296]", Unassigned: "bg-[#808080]" };

const INPUT = "w-full px-3 py-2 bg-[#0e120e] border border-[#272b27] rounded-lg text-[13px] text-[#f0f0f0] placeholder-[#808080] focus:outline-none focus:ring-1 focus:ring-[#2fa872] focus:border-[#2fa872] transition-colors";

export default function RoomsPage() {
  const [rooms, setRooms]         = useState<Room[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [searchTerm, setSearch]   = useState("");
  const [editingRoom, setEditing] = useState<Room | null>(null);
  const [priceInput, setPrice]    = useState("");
  const [saving, setSaving]       = useState(false);

  const loadRooms = useCallback(async () => {
    setLoading(true); setError(null);
    try { setRooms(await listRooms()); }
    catch (e: any) { setError(e.message ?? "Failed to load rooms"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  const filtered = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return rooms.filter(r => r.room_number.toLowerCase().includes(t));
  }, [rooms, searchTerm]);

  const totalBeds   = rooms.reduce((s, r) => s + r.occupied_beds + r.available_beds, 0);
  const occupiedBeds = rooms.reduce((s, r) => s + r.occupied_beds, 0);

  const handleSavePrice = async () => {
    if (!editingRoom) return;
    const price = parseInt(priceInput);
    if (isNaN(price) || price < 0) { alert("Enter a valid price"); return; }
    setSaving(true);
    try {
      const updated = await updateRoomPrice(editingRoom.id, price);
      setRooms(prev => prev.map(r => r.id === updated.id ? updated : r));
      setEditing(null);
    } catch (e: any) { alert(e.message ?? "Failed to update price"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex flex-col items-center justify-center py-24 gap-3"><Loader2 size={24} className="text-[#2fa872] animate-spin" /><p className="text-xs text-[#808080]">Loading rooms…</p></div>;
  if (error)   return <div className="flex flex-col items-center justify-center py-24 gap-4"><AlertCircle size={28} className="text-red-500" /><p className="text-sm text-[#808080] text-center max-w-sm">{error}</p><button onClick={loadRooms} className="px-4 py-2 bg-[#2fa872] text-white text-xs font-semibold rounded-lg">Retry</button></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold text-[#808080] uppercase tracking-[0.6px] mb-1">Hostel</p>
        <h1 className="text-[22px] font-semibold text-[#f0f0f0] tracking-[-0.22px]">Rooms</h1>
        <p className="text-[13px] text-[#808080] mt-0.5">Room inventory and per-bed pricing</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { label: "Rooms",     value: rooms.length             },
          { label: "Occupied",  value: occupiedBeds             },
          { label: "Available", value: totalBeds - occupiedBeds },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2.5 bg-[#141714] border border-[#212521] rounded-[10px] px-4 py-2.5">
            <span className="font-['Courier_Prime',monospace] text-[18px] text-[#f0f0f0]">{value}</span>
            <span className="text-[11px] text-[#808080] font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none" />
        <input type="text" placeholder="Search by room number…" value={searchTerm} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-[#141714] border border-[#212521] rounded-lg text-[13px] text-[#f0f0f0] placeholder-[#808080] focus:outline-none focus:ring-1 focus:ring-[#2fa872] focus:border-[#2fa872] transition-colors" />
      </div>

      {/* Table */}
      <div className="bg-[#141714] border border-[#212521] rounded-t-[12px] overflow-hidden">
        {/* Headers */}
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_2fr_44px] border-b border-[#212521] bg-[#111511]">
          {[
            { label: "Room", icon: Building2 },
            { label: "Gender" },
            { label: "Occupied" },
            { label: "Available" },
            { label: "Price / bed", icon: null },
            { label: "" },
          ].map((col, i) => (
            <div key={i} className={`flex items-center gap-1.5 px-4 py-2.5 ${i > 0 ? "border-l border-[#212521]" : ""}`}>
              {col.icon && <col.icon size={13} className="text-[#808080]" />}
              {col.label && <span className="text-[11px] font-semibold text-[#f0f0f0]">{col.label}</span>}
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-[13px] text-[#808080]">No rooms match your search</div>
        ) : filtered.map((room, idx) => {
          const total = room.occupied_beds + room.available_beds;
          const pct = total ? Math.round((room.occupied_beds / total) * 100) : 0;
          return (
            <div key={room.id} className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_2fr_44px] border-t border-[#1a1f1a] hover:bg-[#1a1f1a] transition-colors ${idx % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : ""}`}>
              {/* Room number */}
              <div className="flex items-center px-4 py-3">
                <p className="text-[12px] font-semibold text-[#f0f0f0]">{room.room_number}</p>
              </div>
              {/* Gender tag */}
              <div className="flex items-center px-4 py-3 border-l border-[#1e231e]">
                <div className="inline-flex items-center gap-1 border border-[#272b27] rounded-[14px] px-2 py-0.5">
                  <span className={`w-[5px] h-[5px] rounded-[1px] flex-shrink-0 ${GENDER_DOT[room.gender] ?? "bg-[#808080]"}`} />
                  <span className="text-[10px] font-semibold text-[#f0f0f0]">{room.gender}</span>
                </div>
              </div>
              {/* Occupied */}
              <div className="flex items-center px-4 py-3 border-l border-[#1e231e]">
                <span className="font-['Courier_Prime',monospace] text-[13px] text-[#f0f0f0]">{room.occupied_beds}</span>
              </div>
              {/* Available */}
              <div className="flex items-center px-4 py-3 border-l border-[#1e231e]">
                <div className="inline-flex items-center gap-1.5">
                  <span className="font-['Courier_Prime',monospace] text-[13px] text-[#2fa872]">{room.available_beds}</span>
                  <div className="h-1.5 w-16 bg-[#212521] rounded-full overflow-hidden">
                    <div className="h-full bg-[#2fa872] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
              {/* Price */}
              <div className="flex items-center px-4 py-3 border-l border-[#1e231e]">
                <div className="flex items-center gap-1.5">
                  <span className="font-['Courier_Prime',monospace] text-[12px] font-bold text-[#f0f0f0]">{fmt(room.price_per_bed)}</span>
                  <span className="text-[10px] text-[#808080]">/sem</span>
                  {/* Bed icons */}
                  <div className="flex gap-1 ml-2">
                    {room.beds.map(bed => (
                      <Bed key={bed.bed_id} size={11} className={bed.is_occupied ? "text-amber-500" : "text-[#2fa872]"} title={`Bed ${bed.bed_number}: ${bed.is_occupied ? "Occupied" : "Available"}`} />
                    ))}
                  </div>
                </div>
              </div>
              {/* Edit */}
              <div className="flex items-center justify-center border-l border-[#1e231e]">
                <button onClick={() => { setEditing(room); setPrice(String(room.price_per_bed)); }} className="p-2 hover:bg-[#1f381f] rounded-[6px] transition-colors" title="Edit price">
                  <Edit size={13} className="text-[#808080] hover:text-[#2fa872]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-[#808080] px-1">{filtered.length} of {rooms.length} rooms</p>

      {/* Price edit modal */}
      {editingRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e120e] border border-[#272b27] rounded-[12px] shadow-2xl w-full max-w-sm">
            <div className="border-b border-[#212521] px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-semibold text-[#f0f0f0]">Edit Price — {editingRoom.room_number}</h2>
                <p className="text-[11px] text-[#808080] mt-0.5">Update per-bed semester rate</p>
              </div>
              <button onClick={() => setEditing(null)} className="p-1.5 hover:bg-[#1a1f1a] rounded-lg transition-colors"><X size={14} className="text-[#808080]" /></button>
            </div>
            <div className="p-5">
              <label className="block text-[11px] font-semibold text-[#808080] uppercase tracking-wide mb-1.5">Price per Bed (UGX/semester)</label>
              <input type="number" min="0" value={priceInput} onChange={e => setPrice(e.target.value)} className={INPUT} />
            </div>
            <div className="border-t border-[#212521] px-5 py-4 flex items-center justify-end gap-2.5">
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-[#1a1f1a] hover:bg-[#212521] text-[#c8c8c8] text-[12px] font-semibold rounded-[8px] transition-colors">Cancel</button>
              <button onClick={handleSavePrice} disabled={saving} className="px-4 py-2 bg-[#2fa872] hover:bg-[#27a065] text-white text-[12px] font-semibold rounded-[8px] flex items-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}