/**
 * BookingsPage — wired to Dormir API backend
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Plus, Edit, X, Check, Loader2, AlertCircle, Calendar, CheckCircle, XCircle,
} from "lucide-react";
import { listBookings, createBooking, updateBooking } from "../lib/api/bookings";
import { listStudents } from "../lib/api/students";
import { listRooms } from "../lib/api/rooms";
import { listPeriods } from "../lib/api/periods";
import type { Booking, BookingCreate, BookingStatus, Student, Room, AcademicPeriod } from "../lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookingFormData {
  student_id: string;
  room_id: string;
  period_id: string;
  amount_paid: string;
  paid_on: string;
}

const EMPTY_FORM: BookingFormData = {
  student_id: "",
  room_id: "",
  period_id: "",
  amount_paid: "",
  paid_on: new Date().toISOString().split("T")[0],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (v: number) => `UGX ${v.toLocaleString()}`;

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200",
  confirmed: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200",
  cancelled: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200",
};

function Badge({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingsData, studentsData, roomsData, periodsData] = await Promise.all([
        listBookings(),
        listStudents(),
        listRooms(),
        listPeriods(),
      ]);
      setBookings(bookingsData);
      setStudents(studentsData);
      setRooms(roomsData);
      setPeriods(periodsData);
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

  const filtered = bookings.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const studentName = studentMap.get(b.student_id) ?? "";
    const roomNumber = roomMap.get(b.room_id) ?? "";
    return (
      studentName.toLowerCase().includes(term) ||
      roomNumber.toLowerCase().includes(term)
    );
  });

  const handleOpenModal = () => {
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    if (!formData.student_id || !formData.room_id || !formData.period_id || !formData.amount_paid) {
      alert("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      const payload: BookingCreate = {
        student_id: parseInt(formData.student_id),
        room_id: parseInt(formData.room_id),
        period_id: parseInt(formData.period_id),
        amount_paid: parseInt(formData.amount_paid),
        paid_on: formData.paid_on,
        status: "pending",
      };
      await createBooking(payload);
      await loadData();
      handleCloseModal();
    } catch (err: any) {
      alert(err.message ?? "Failed to create booking");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: BookingStatus) => {
    try {
      await updateBooking(id, { status });
      await loadData();
    } catch (err: any) {
      alert(err.message ?? "Failed to update booking");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={28} className="text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading bookings…</p>
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Bookings</h1>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          <Plus size={16} />
          New Booking
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by student or room…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BookingStatus | "all")}
          className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", value: bookings.filter(b => b.status === "pending").length, bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600" },
          { label: "Confirmed", value: bookings.filter(b => b.status === "confirmed").length, bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600" },
          { label: "Total", value: bookings.length, bg: "bg-slate-50 dark:bg-slate-800", text: "text-slate-600" },
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
            {searchTerm || statusFilter !== "all" ? "No bookings match your filters" : "No bookings yet"}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((booking) => (
              <div key={booking.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {studentMap.get(booking.student_id) ?? `Student #${booking.student_id}`}
                      </p>
                      <Badge status={booking.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>Room {roomMap.get(booking.room_id) ?? booking.room_id}</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span>{periodMap.get(booking.period_id) ?? "Unknown Period"}</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(booking.amount_paid)}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {formatDate(booking.paid_on)}
                      </span>
                    </div>
                  </div>
                  {booking.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusUpdate(booking.id, "confirmed")}
                        className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        title="Confirm"
                      >
                        <CheckCircle size={16} className="text-emerald-600" />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Cancel"
                      >
                        <XCircle size={16} className="text-red-600" />
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
                New Booking
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X size={18} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Student *
                </label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                >
                  <option value="">Select student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.student_number})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Room *
                </label>
                <select
                  value={formData.room_id}
                  onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                >
                  <option value="">Select room</option>
                  {rooms.filter(r => r.status === "available").map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number} ({r.room_type}) - {formatCurrency(r.price_per_bed)}/bed
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Academic Period *
                </label>
                <select
                  value={formData.period_id}
                  onChange={(e) => setFormData({ ...formData, period_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                >
                  <option value="">Select period</option>
                  {periods.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.is_active && "(Active)"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Booking Fee Paid (UGX) *
                </label>
                <input
                  type="number"
                  value={formData.amount_paid}
                  onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="e.g. 100000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date Paid *
                </label>
                <input
                  type="date"
                  value={formData.paid_on}
                  onChange={(e) => setFormData({ ...formData, paid_on: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
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
                    Creating…
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Create Booking
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
