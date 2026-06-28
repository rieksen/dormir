/**
 * BookingsPage — active + historical bookings derived from student list
 * The backend exposes students with their active booking embedded.
 * Historical (checked-out) bookings are not queryable yet, so this page
 * shows all currently active bookings with checkout action.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Loader2, AlertCircle, Calendar, LogOut,
} from "lucide-react";
import { listStudents, checkoutStudent } from "../lib/api/students";
import type { ActiveStudent } from "../lib/types";

const formatCurrency = (v: number) => `UGX ${v.toLocaleString()}`;

export default function BookingsPage() {
  const [students, setStudents] = useState<ActiveStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [checkingOut, setCheckingOut] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStudents(await listStudents());
    } catch (err: any) {
      setError(err.message ?? "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCheckout = async (student: ActiveStudent) => {
    if (!confirm(`Check out ${student.full_name} and free bed ${student.bed_number} in ${student.room_number}?`)) return;
    setCheckingOut(student.id);
    try {
      await checkoutStudent(student.id);
      setStudents(prev => prev.filter(s => s.id !== student.id));
    } catch (err: any) {
      alert(err.message ?? "Checkout failed");
    } finally {
      setCheckingOut(null);
    }
  };

  const filtered = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return students.filter(s =>
      s.full_name.toLowerCase().includes(t) ||
      s.room_number.toLowerCase().includes(t) ||
      s.university.toLowerCase().includes(t)
    );
  }, [students, searchTerm]);  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 size={28} className="text-primary animate-spin" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading bookings…</p>
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Bookings</h1>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{students.length} active</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150/80 dark:border-slate-800/80 p-4 shadow-sm">
          <p className="text-xl font-bold text-primary">{students.length}</p>
          <p className="text-xs font-medium text-slate-550 dark:text-slate-400 mt-1.5">Active Bookings</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150/80 dark:border-slate-800/80 p-4 shadow-sm">
          <p className="text-xl font-bold text-blue-650 dark:text-blue-400">
            {students.filter(s => s.semester === "Sem1").length} / {students.filter(s => s.semester === "Sem2").length}
          </p>
          <p className="text-xs font-medium text-slate-550 dark:text-slate-400 mt-1.5">Sem 1 / Sem 2</p>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search by name, room, university…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Calendar size={32} className="mx-auto text-slate-300 dark:text-slate-650 mb-3" />
            <p className="text-sm text-slate-450 dark:text-slate-550">
              {searchTerm ? "No bookings match your search" : "No active bookings"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {filtered.map(student => (
              <div key={student.booking_id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{student.full_name}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-accent dark:bg-accent/15 text-primary ring-1 ring-primary/10">
                        active
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{student.room_number} · Bed {student.bed_number}</span>
                      <span>{student.semester} {student.year}</span>
                      <span>{student.university}</span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-505 mt-1">Booking #{student.booking_id}</p>
                  </div>
                  <button
                    onClick={() => handleCheckout(student)}
                    disabled={checkingOut === student.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-650 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {checkingOut === student.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <LogOut size={13} />}
                    Check Out
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}