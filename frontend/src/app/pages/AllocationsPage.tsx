/**
 * AllocationsPage — Bed assignments management
 * The "truth layer" for occupancy tracking
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Plus, Edit, X, Check, Loader2, AlertCircle, Key, Users, Bed as BedIcon,
} from "lucide-react";
import { listAllocations, createAllocation, updateAllocation } from "../lib/api/allocations";
import { listBookings } from "../lib/api/bookings";
import { listStudents } from "../lib/api/students";
import { listRooms, listBeds } from "../lib/api/rooms";
import { listPeriods } from "../lib/api/periods";
import type { Allocation, AllocationCreate, AllocationStatus, Student, Room, AcademicPeriod, Booking, Bed } from "../lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AllocationFormData {
  booking_id: string;
  bed_id: string;
  student_id: string;
  period_id: string;
  allocated_on: string;
}

const EMPTY_FORM: AllocationFormData = {
  booking_id: "",
  bed_id: "",
  student_id: "",
  period_id: "",
  allocated_on: new Date().toISOString().split("T")[0],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const STATUS_STYLES: Record<AllocationStatus, string> = {
  active: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200",
  vacated: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200",
  transferred: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200",
};

function Badge({ status }: { status: AllocationStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AllocationStatus | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<AllocationFormData>(EMPTY_FORM);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allocData, bookData, studData, roomData, periodData] = await Promise.all([
        listAllocations(),
        listBookings(),
        listStudents(),
        listRooms(),
        listPeriods(),
      ]);
      setAllocations(allocData);
      setBookings(bookData);
      setStudents(studData);
      setRooms(roomData);
      setPeriods(periodData);
    } catch (err: any) {
      setError(err.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const studentMap = useMemo(
    () => new Map(students.map(s => [s.id, `${s.first_name} ${s.last_name}`])),
    [students]
  );

  const roomMap = useMemo(
    () => new Map(rooms.map(r => [r.id, r.room_number])),
    [rooms]
  );

  const periodMap = useMemo(
    () => new Map(periods.map(p => [p.id, p.name])),
    [periods]
  );

  const bedMap = useMemo(
    () => new Map(beds.map(b => [b.id, { label: b.label, roomId: b.room_id }])),
    [beds]
  );

  // Get bed display string
  const getBedDisplay = (bedId: number) => {
    const bedInfo = bedMap.get(bedId);
    if (!bedInfo) return `Bed #${bedId}`;
    const roomNum = roomMap.get(bedInfo.roomId) ?? bedInfo.roomId;
    return `Room ${roomNum} - Bed ${bedInfo.label}`;
  };

  const filtered = allocations.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const studentName = studentMap.get(a.student_id) ?? "";
    const bedDisplay = getBedDisplay(a.bed_id);
    return (
      studentName.toLowerCase().includes(term) ||
      bedDisplay.toLowerCase().includes(term)
    );
  });

  const handleOpenModal = () => {
    setFormData(EMPTY_FORM);
    setSelectedBooking(null);
    setAvailableBeds([]);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData(EMPTY_FORM);
    setSelectedBooking(null);
    setAvailableBeds([]);
  };

  const handleBookingSelect = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === parseInt(bookingId));
    if (!booking) return;

    setSelectedBooking(booking);
    setFormData({
      ...formData,
      booking_id: bookingId,
      student_id: String(booking.student_id),
      period_id: String(booking.period_id),
    });

    // Load available beds for this room
    try {
      const roomBeds = await listBeds(booking.room_id);
      // Filter out already allocated beds
      const occupiedBedIds = allocations
        .filter(a => a.status === "active" && a.period_id === booking.period_id)
        .map(a => a.bed_id);
      const available = roomBeds.filter(b => !occupiedBedIds.includes(b.id));
      setAvailableBeds(available);
      setBeds(prev => [...new Map([...prev, ...roomBeds].map(b => [b.id, b])).values()]);
    } catch (err) {
      console.error("Failed to load beds:", err);
      setAvailableBeds([]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.booking_id || !formData.bed_id) {
      alert("Please select booking and bed");
      return;
    }
    setSaving(true);
    try {
      const payload: AllocationCreate = {
        booking_id: parseInt(formData.booking_id),
        bed_id: parseInt(formData.bed_id),
        student_id: parseInt(formData.student_id),
        period_id: parseInt(formData.period_id),
        allocated_on: formData.allocated_on,
        status: "active",
      };
      await createAllocation(payload);
      await loadData();
      handleCloseModal();
    } catch (err: any) {
      alert(err.message ?? "Failed to create allocation");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: AllocationStatus) => {
    try {
      await updateAllocation(id, { status });
      await loadData();
    } catch (err: any) {
      alert(err.message ?? "Failed to update allocation");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={28} className="text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading allocations…</p>
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

  const confirmedBookings = bookings.filter(b => b.status === "confirmed");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Allocations</h1>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          <Plus size={16} />
          New Allocation
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by student or bed…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AllocationStatus | "all")}
          className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="vacated">Vacated</option>
          <option value="transferred">Transferred</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", value: allocations.filter(a => a.status === "active").length, bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600" },
          { label: "Vacated", value: allocations.filter(a => a.status === "vacated").length, bg: "bg-slate-50 dark:bg-slate-800", text: "text-slate-600" },
          { label: "Total", value: allocations.length, bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600" },
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
            {searchTerm || statusFilter !== "all" ? "No allocations match your filters" : "No allocations yet"}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((allocation) => (
              <div key={allocation.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {studentMap.get(allocation.student_id) ?? `Student #${allocation.student_id}`}
                      </p>
                      <Badge status={allocation.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <BedIcon size={11} />
                        {getBedDisplay(allocation.bed_id)}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span>{periodMap.get(allocation.period_id) ?? "Unknown Period"}</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span>Allocated: {formatDate(allocation.allocated_on)}</span>
                    </div>
                  </div>
                  {allocation.status === "active" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusUpdate(allocation.id, "vacated")}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                      >
                        Mark Vacated
                      </button>
                    </div>
                  )}
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
                New Allocation
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X size={18} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirmed Booking *
                </label>
                <select
                  value={formData.booking_id}
                  onChange={(e) => handleBookingSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                >
                  <option value="">Select confirmed booking</option>
                  {confirmedBookings.map(b => {
                    const student = students.find(s => s.id === b.student_id);
                    const room = rooms.find(r => r.id === b.room_id);
                    return (
                      <option key={b.id} value={b.id}>
                        {student ? `${student.first_name} ${student.last_name}` : `Student #${b.student_id}`} → Room {room?.room_number ?? b.room_id}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              {selectedBooking && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Available Bed *
                    </label>
                    <select
                      value={formData.bed_id}
                      onChange={(e) => setFormData({ ...formData, bed_id: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    >
                      <option value="">Select bed</option>
                      {availableBeds.map(bed => (
                        <option key={bed.id} value={bed.id}>
                          Bed {bed.label}
                        </option>
                      ))}
                    </select>
                    {availableBeds.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">No available beds in this room</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Allocation Date *
                    </label>
                    <input
                      type="date"
                      value={formData.allocated_on}
                      onChange={(e) => setFormData({ ...formData, allocated_on: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                  </div>
                </>
              )}
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
                disabled={saving || !formData.bed_id}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Create Allocation
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
