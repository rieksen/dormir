/**
 * BookingsPage — active bookings as a true data table
 * Dashboard Flaws design principles: hairline grid, monospace numerics, status pills
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Loader2, AlertCircle, LogOut,
  Hash, Home, User, GraduationCap, Calendar,
} from "lucide-react";
import { listStudents, checkoutStudent } from "../lib/api/students";
import type { ActiveStudent } from "../lib/types";

export default function BookingsPage() {
  const [students, setStudents]       = useState<ActiveStudent[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [searchTerm, setSearchTerm]   = useState("");
  const [checkingOut, setCheckingOut] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setStudents(await listStudents()); }
    catch (e: any) { setError(e.message ?? "Failed to load bookings"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCheckout = async (s: ActiveStudent) => {
    if (!confirm(`Check out ${s.full_name} and free Bed ${s.bed_number} in ${s.room_number}?`)) return;
    setCheckingOut(s.id);
    try { await checkoutStudent(s.id); setStudents(prev => prev.filter(x => x.id !== s.id)); }
    catch (e: any) { alert(e.message ?? "Checkout failed"); }
    finally { setCheckingOut(null); }
  };

  const filtered = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return students.filter(s =>
      s.full_name.toLowerCase().includes(t) ||
      s.room_number.toLowerCase().includes(t) ||
      s.university.toLowerCase().includes(t)
    );
  }, [students, searchTerm]);

  const sem1 = students.filter(s => s.semester === "Sem1").length;
  const sem2 = students.filter(s => s.semester === "Sem2").length;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 size={24} className="text-[#2fa872] animate-spin" />
      <p className="text-xs text-[#808080]">Loading bookings…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <AlertCircle size={28} className="text-red-500" />
      <p className="text-sm text-[#808080] text-center max-w-sm">{error}</p>
      <button onClick={load} className="px-4 py-2 bg-[#2fa872] text-white text-xs font-semibold rounded-lg">Retry</button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <p className="text-[10px] font-semibold text-[#808080] uppercase tracking-[0.6px] mb-1">Hostel</p>
        <h1 className="text-[22px] font-semibold text-[#f0f0f0] tracking-[-0.22px]">Bookings</h1>
        <p className="text-[13px] text-[#808080] mt-0.5">Active occupancy records with check-out</p>
      </div>

      {/* Stat chips */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { label: "Active", value: students.length },
          { label: "Sem 1", value: sem1 },
          { label: "Sem 2", value: sem2 },
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
        <input
          type="text"
          placeholder="Search by name, room, university…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-[#141714] border border-[#212521] rounded-lg text-[13px] text-[#f0f0f0] placeholder-[#808080] focus:outline-none focus:ring-1 focus:ring-[#2fa872] focus:border-[#2fa872] transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#141714] border border-[#212521] rounded-t-[12px] overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[60px_2fr_1fr_1fr_2fr_90px] border-b border-[#212521] bg-[#111511]">
          {[
            { label: "Booking #", icon: Hash },
            { label: "Student", icon: User },
            { label: "Room / Bed", icon: Home },
            { label: "Period", icon: Calendar },
            { label: "University", icon: GraduationCap },
            { label: "" },
          ].map((col, i) => (
            <div key={i} className={`flex items-center gap-1.5 px-4 py-2.5 ${i > 0 ? "border-l border-[#212521]" : ""}`}>
              {col.icon && <col.icon size={13} className="text-[#808080] flex-shrink-0" />}
              {col.label && <span className="text-[11px] font-semibold text-[#f0f0f0]">{col.label}</span>}
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-[13px] text-[#808080]">
            {searchTerm ? "No bookings match your search" : "No active bookings"}
          </div>
        ) : (
          filtered.map((s, idx) => (
            <div
              key={s.booking_id}
              className={`grid grid-cols-[60px_2fr_1fr_1fr_2fr_90px] border-t border-[#1a1f1a] hover:bg-[#1a1f1a] transition-colors ${idx % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : ""}`}
            >
              {/* Booking ID */}
              <div className="flex items-center px-4 py-2.5">
                <span className="font-['Courier_Prime',monospace] text-[13px] text-[#808080]">{s.booking_id}</span>
              </div>

              {/* Student */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-l border-[#1e231e]">
                <div className="w-6 h-6 rounded-full bg-[#1f381f] flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-bold text-[#2fa872]">
                    {s.full_name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[#f0f0f0] truncate">{s.full_name}</p>
                  <div className="inline-flex items-center gap-1 border border-[#272b27] rounded-[14px] px-2 py-0.5 mt-0.5">
                    <span className={`w-[5px] h-[5px] rounded-[1px] flex-shrink-0 ${s.gender === "Male" ? "bg-[#3280fa]" : "bg-[#c45296]"}`} />
                    <span className="text-[10px] font-semibold text-[#f0f0f0]">{s.gender}</span>
                  </div>
                </div>
              </div>

              {/* Room / Bed */}
              <div className="flex items-center px-4 py-2.5 border-l border-[#1e231e]">
                <div>
                  <p className="text-[12px] font-medium text-[#f0f0f0]">{s.room_number}</p>
                  <p className="text-[11px] text-[#808080]">Bed {s.bed_number}</p>
                </div>
              </div>

              {/* Period — status pill */}
              <div className="flex items-center px-4 py-2.5 border-l border-[#1e231e]">
                <div className="inline-flex items-center gap-1.5 bg-[rgba(47,168,114,0.1)] rounded-full px-2.5 py-1">
                  <span className="w-[5px] h-[5px] rounded-full bg-[#2fa872] flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-[#2fa872]">{s.semester} {s.year}</span>
                </div>
              </div>

              {/* University */}
              <div className="flex items-center px-4 py-2.5 border-l border-[#1e231e] min-w-0">
                <p className="text-[12px] text-[#f0f0f0] truncate">{s.university}</p>
              </div>

              {/* Action */}
              <div className="flex items-center justify-center px-2 py-2.5 border-l border-[#1e231e]">
                <button
                  onClick={() => handleCheckout(s)}
                  disabled={checkingOut === s.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[rgba(220,38,38,0.08)] border border-[rgba(220,38,38,0.2)] hover:bg-[rgba(220,38,38,0.15)] text-red-400 font-semibold text-[11px] rounded-[6px] transition-colors disabled:opacity-40"
                >
                  {checkingOut === s.id
                    ? <Loader2 size={11} className="animate-spin" />
                    : <LogOut size={11} />}
                  Check Out
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <p className="text-[11px] text-[#808080] px-1">{filtered.length} of {students.length} bookings</p>
    </div>
  );
}