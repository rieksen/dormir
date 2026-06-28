/**
 * RoomsPage — seeded rooms, price editing only
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Edit, X, Check, Loader2, AlertCircle, Building2, Bed,
} from "lucide-react";
import { listRooms, updateRoomPrice } from "../lib/api/rooms";
import type { Room, RoomGender } from "../lib/types";

const formatCurrency = (v: number) => `UGX ${v.toLocaleString()}`;

const GENDER_STYLES: Record<RoomGender, string> = {
  Male: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200",
  Female: "bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 ring-1 ring-pink-200",
  Unassigned: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
};

function GenderBadge({ gender }: { gender: RoomGender }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${GENDER_STYLES[gender]}`}>
      {gender}
    </span>
  );
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Price edit modal
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [saving, setSaving] = useState(false);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRooms(await listRooms());
    } catch (err: any) {
      setError(err.message ?? "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  const filtered = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return rooms.filter(r => r.room_number.toLowerCase().includes(t));
  }, [rooms, searchTerm]);

  const totalBeds = rooms.reduce((s, r) => s + r.occupied_beds + r.available_beds, 0);
  const occupiedBeds = rooms.reduce((s, r) => s + r.occupied_beds, 0);

  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setPriceInput(String(room.price_per_bed));
  };

  const handleSavePrice = async () => {
    if (!editingRoom) return;
    const price = parseInt(priceInput);
    if (isNaN(price) || price < 0) { alert("Enter a valid price"); return; }
    setSaving(true);
    try {
      const updated = await updateRoomPrice(editingRoom.id, price);
      setRooms(prev => prev.map(r => r.id === updated.id ? updated : r));
      setEditingRoom(null);
    } catch (err: any) {
      alert(err.message ?? "Failed to update price");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 size={28} className="text-primary animate-spin" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading rooms…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <AlertCircle size={32} className="text-red-500" />
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-sm">{error}</p>
      <button onClick={loadRooms} className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-sm font-semibold rounded-lg shadow-sm active:scale-[0.98] transition-all">
        Retry
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Rooms</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Rooms", value: rooms.length, bg: "bg-white dark:bg-slate-900", text: "text-blue-600" },
          { label: "Occupied Beds", value: occupiedBeds, bg: "bg-white dark:bg-slate-900", text: "text-amber-600" },
          { label: "Available Beds", value: totalBeds - occupiedBeds, bg: "bg-white dark:bg-slate-900", text: "text-primary" },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-lg border border-slate-150/80 dark:border-slate-800/80 p-4 shadow-sm`}>
            <p className={`text-xl font-bold ${stat.text}`}>{stat.value}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-450 mt-1.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search by room number…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
        />
      </div>

      {/* Room grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(room => {
          const total = room.occupied_beds + room.available_beds;
          const pct = total ? Math.round((room.occupied_beds / total) * 100) : 0;
          return (
            <div key={room.id} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150/80 dark:border-slate-800/80 shadow-sm p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-accent dark:bg-accent/10 rounded-lg flex items-center justify-center">
                    <Building2 size={15} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{room.room_number}</p>
                    <GenderBadge gender={room.gender} />
                  </div>
                </div>
                <button
                  onClick={() => openEdit(room)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-805 rounded-lg transition-colors"
                  title="Edit price"
                >
                  <Edit size={14} className="text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              {/* Bed indicators */}
              <div className="flex gap-1.5 mb-3">
                {room.beds.map(bed => (
                  <div
                    key={bed.bed_id}
                    title={`Bed ${bed.bed_number}: ${bed.is_occupied ? "Occupied" : "Available"}`}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold ${
                      bed.is_occupied
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-650 dark:text-amber-400 border border-amber-200/20"
                        : "bg-accent dark:bg-accent/10 text-primary border border-primary/10"
                    }`}
                  >
                    <Bed size={13} />
                  </div>
                ))}
              </div>

              {/* Occupancy bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>{room.occupied_beds}/{total} beds</span>
                  <span className="font-semibold">{pct}%</span>
                </div>
                <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                {formatCurrency(room.price_per_bed)}<span className="font-normal text-slate-400"> /bed</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Price edit modal */}
      {editingRoom && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150 dark:border-slate-800 shadow-2xl w-full max-w-sm">
            <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Edit Price — {editingRoom.room_number}
              </h2>
              <button onClick={() => setEditingRoom(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X size={15} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Price per Bed (UGX)
                </label>
                <input
                  type="number"
                  min="0"
                  value={priceInput}
                  onChange={e => setPriceInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingRoom(null)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrice}
                disabled={saving}
                className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-semibold text-sm rounded-lg flex items-center gap-2 disabled:opacity-50 shadow-sm active:scale-[0.98] transition-all"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}