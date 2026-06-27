/**
 * RoomsPage — wired to Dormir API backend
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Plus, Edit, Trash2, X, Check, Loader2, AlertCircle, Building2, Bed,
} from "lucide-react";
import { listRooms, createRoom, updateRoom, deleteRoom, listBeds } from "../lib/api/rooms";
import { listCampuses } from "../lib/api/campuses";
import type { Room, RoomCreate, RoomType, RoomStatus, Campus, Bed as BedType } from "../lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RoomFormData {
  campus_id: string;
  room_number: string;
  room_type: RoomType;
  price_per_bed: string;
  floor: string;
  status: RoomStatus;
}

const EMPTY_FORM: RoomFormData = {
  campus_id: "",
  room_number: "",
  room_type: "single",
  price_per_bed: "",
  floor: "",
  status: "available",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (v: number) => `UGX ${v.toLocaleString()}`;

const STATUS_STYLES: Record<RoomStatus, string> = {
  available: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200",
  full: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200",
  maintenance: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-1 ring-red-200",
};

function Badge({ status }: { status: RoomStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RoomFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roomsData, campusesData] = await Promise.all([
        listRooms(),
        listCampuses(),
      ]);
      setRooms(roomsData);
      setCampuses(campusesData);
    } catch (err: any) {
      setError(err.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const campusMap = useMemo(
    () => new Map(campuses.map(c => [c.id, c.name])),
    [campuses]
  );

  const filtered = rooms.filter((r) => {
    const term = searchTerm.toLowerCase();
    const campusName = campusMap.get(r.campus_id) ?? "";
    return (
      r.room_number.toLowerCase().includes(term) ||
      campusName.toLowerCase().includes(term) ||
      r.room_type.includes(term) ||
      r.status.includes(term)
    );
  });

  const handleOpenModal = (room?: Room) => {
    if (room) {
      setEditingId(room.id);
      setFormData({
        campus_id: String(room.campus_id),
        room_number: room.room_number,
        room_type: room.room_type,
        price_per_bed: String(room.price_per_bed),
        floor: room.floor ? String(room.floor) : "",
        status: room.status,
      });
    } else {
      setEditingId(null);
      setFormData(EMPTY_FORM);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    if (!formData.campus_id || !formData.room_number || !formData.price_per_bed) {
      alert("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      const payload: RoomCreate = {
        campus_id: parseInt(formData.campus_id),
        room_number: formData.room_number,
        room_type: formData.room_type,
        price_per_bed: parseInt(formData.price_per_bed),
        floor: formData.floor ? parseInt(formData.floor) : undefined,
        status: formData.status,
      };
      if (editingId) {
        await updateRoom(editingId, payload);
      } else {
        await createRoom(payload);
      }
      await loadData();
      handleCloseModal();
    } catch (err: any) {
      alert(err.message ?? "Failed to save room");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      await deleteRoom(id);
      await loadData();
    } catch (err: any) {
      alert(err.message ?? "Failed to delete room");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={28} className="text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading rooms…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle size={32} className="text-red-500" />
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-sm">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Rooms</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          <Plus size={16} />
          Add Room
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search by room number, campus, type…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: rooms.length, bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600" },
          { label: "Available", value: rooms.filter(r => r.status === "available").length, bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600" },
          { label: "Full", value: rooms.filter(r => r.status === "full").length, bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl p-4`}>
            <p className={`text-2xl font-bold ${stat.text}`}>{stat.value}</p>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500">
            {searchTerm ? "No rooms match your search" : "No rooms yet"}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((room) => (
              <div key={room.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Room {room.room_number}
                      </p>
                      <Badge status={room.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Building2 size={12} />
                        {campusMap.get(room.campus_id) ?? "Unknown Campus"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bed size={12} />
                        {room.room_type === "single" ? "Single (1 bed)" : "Double (2 beds)"}
                      </span>
                      {room.floor && (
                        <span>Floor {room.floor}</span>
                      )}
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(room.price_per_bed)}/bed
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenModal(room)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(room.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingId ? "Edit Room" : "Add Room"}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X size={18} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Campus *
                </label>
                <select
                  value={formData.campus_id}
                  onChange={(e) => setFormData({ ...formData, campus_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                >
                  <option value="">Select campus</option>
                  {campuses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Room Number *
                </label>
                <input
                  type="text"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="e.g. 101"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Room Type *
                </label>
                <select
                  value={formData.room_type}
                  onChange={(e) => setFormData({ ...formData, room_type: e.target.value as RoomType })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                >
                  <option value="single">Single (1 bed)</option>
                  <option value="double">Double (2 beds)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Price per Bed (UGX) *
                </label>
                <input
                  type="number"
                  value={formData.price_per_bed}
                  onChange={(e) => setFormData({ ...formData, price_per_bed: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="e.g. 500000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Floor
                </label>
                <input
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="e.g. 1"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as RoomStatus })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                >
                  <option value="available">Available</option>
                  <option value="full">Full</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    {editingId ? "Update" : "Create"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
