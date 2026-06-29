/**
 * StudentsPage — active students table, Dashboard Flaws design principles applied
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Plus, LogOut, X, Check,
  Loader2, AlertCircle, Phone, BookOpen, Home,
  GraduationCap, Users, User,
} from "lucide-react";
import { listStudents, registerStudent, checkoutStudent } from "../lib/api/students";
import { listAvailableBeds } from "../lib/api/rooms";
import type { ActiveStudent, StudentRegistration, Gender, Semester, AvailableBed } from "../lib/types";

const fmt = (v: number) => `UGX ${v.toLocaleString()}`;

interface RegFormData {
  full_name: string; phone: string; emergency_contact: string;
  university: string; course: string; year_of_study: string;
  course_duration: string; gender: Gender; semester_joined: Semester;
  year_joined: string; bed_id: string;
}
const EMPTY: RegFormData = {
  full_name: "", phone: "", emergency_contact: "", university: "",
  course: "", year_of_study: "", course_duration: "", gender: "Male",
  semester_joined: "Sem1", year_joined: String(new Date().getFullYear()), bed_id: "",
};

const LABEL = "block text-[11px] font-semibold text-[#808080] mb-1 uppercase tracking-wide";
const INPUT = "w-full px-3 py-2 bg-[#0e120e] border border-[#272b27] rounded-lg text-[13px] text-[#f0f0f0] placeholder-[#808080] focus:outline-none focus:ring-1 focus:ring-[#2fa872] focus:border-[#2fa872] transition-colors";

export default function StudentsPage() {
  const [students, setStudents]       = useState<ActiveStudent[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [searchTerm, setSearchTerm]   = useState("");
  const [showModal, setShowModal]     = useState(false);
  const [formData, setFormData]       = useState<RegFormData>(EMPTY);
  const [availableBeds, setBeds]      = useState<AvailableBed[]>([]);
  const [bedsLoading, setBedsLoading] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [checkingOut, setCheckingOut] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setStudents(await listStudents()); }
    catch (e: any) { setError(e.message ?? "Failed to load students"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!showModal) return;
    setBedsLoading(true);
    setFormData(f => ({ ...f, bed_id: "" }));
    listAvailableBeds(formData.gender)
      .then(setBeds).catch(() => setBeds([]))
      .finally(() => setBedsLoading(false));
  }, [showModal, formData.gender]);

  const handleCheckout = async (s: ActiveStudent) => {
    if (!confirm(`Check out ${s.full_name}?`)) return;
    setCheckingOut(s.id);
    try { await checkoutStudent(s.id); setStudents(prev => prev.filter(x => x.id !== s.id)); }
    catch (e: any) { alert(e.message ?? "Checkout failed"); }
    finally { setCheckingOut(null); }
  };

  const handleSubmit = async () => {
    const { full_name, phone, emergency_contact, university, course, year_of_study, course_duration, bed_id } = formData;
    if (!full_name || !phone || !emergency_contact || !university || !course || !year_of_study || !course_duration || !bed_id) {
      alert("Please fill all required fields and select a bed"); return;
    }
    setSaving(true);
    try {
      await registerStudent({
        full_name, phone, emergency_contact, university, course,
        year_of_study: parseInt(year_of_study), course_duration: parseInt(course_duration),
        gender: formData.gender, semester_joined: formData.semester_joined,
        year_joined: parseInt(formData.year_joined), bed_id: parseInt(bed_id),
      } as StudentRegistration);
      await load(); setShowModal(false); setFormData(EMPTY);
    } catch (e: any) { alert(e.message ?? "Registration failed"); }
    finally { setSaving(false); }
  };

  const filtered = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return students.filter(s =>
      s.full_name.toLowerCase().includes(t) ||
      s.room_number.toLowerCase().includes(t) ||
      s.university.toLowerCase().includes(t) ||
      s.course.toLowerCase().includes(t)
    );
  }, [students, searchTerm]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 size={24} className="text-[#2fa872] animate-spin" />
      <p className="text-xs text-[#808080]">Loading students…</p>
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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold text-[#808080] uppercase tracking-[0.6px] mb-1">Hostel</p>
          <h1 className="text-[22px] font-semibold text-[#f0f0f0] tracking-[-0.22px]">Students</h1>
          <p className="text-[13px] text-[#808080] mt-0.5">Active residents across all rooms</p>
        </div>
        <button
          onClick={() => { setFormData(EMPTY); setShowModal(true); }}
          className="flex items-center gap-2 bg-[#f0f0f0] hover:bg-white text-[#0e120e] px-3 py-1.5 rounded-[6px] font-medium text-[11px] transition-colors active:scale-[0.98]"
        >
          Register <Plus size={13} />
        </button>
      </div>

      {/* Stat chips */}
      <div className="flex items-center gap-3">
        {[
          { label: "Total", value: students.length, icon: Users },
          { label: "Male", value: students.filter(s => s.gender === "Male").length, icon: User },
          { label: "Female", value: students.filter(s => s.gender === "Female").length, icon: User },
        ].map(({ label, value, icon: Icon }) => (
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
          placeholder="Search by name, room, university, course…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-[#141714] border border-[#212521] rounded-lg text-[13px] text-[#f0f0f0] placeholder-[#808080] focus:outline-none focus:ring-1 focus:ring-[#2fa872] focus:border-[#2fa872] transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#141714] border border-[#212521] rounded-t-[12px] overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[2fr_1fr_1fr_2fr_1fr_80px] border-b border-[#212521] bg-[#111511]">
          {[
            { label: "Student", icon: User },
            { label: "Room / Bed", icon: Home },
            { label: "Semester", icon: GraduationCap },
            { label: "University · Course", icon: BookOpen },
            { label: "Phone", icon: Phone },
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
            {searchTerm ? "No students match your search" : "No active students"}
          </div>
        ) : (
          filtered.map((student, idx) => (
            <div
              key={student.id}
              className={`grid grid-cols-[2fr_1fr_1fr_2fr_1fr_80px] border-t border-[#1a1f1a] hover:bg-[#1a1f1a] transition-colors group ${idx % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : ""}`}
            >
              {/* Student name + gender tag */}
              <div className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-7 h-7 rounded-full bg-[#1f381f] flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-[#2fa872]">
                    {student.full_name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[#f0f0f0] truncate">{student.full_name}</p>
                  <div className={`inline-flex items-center gap-1 border border-[#272b27] rounded-[14px] px-2 py-0.5 mt-0.5 ${student.gender === "Male" ? "" : ""}`}>
                    <span className={`w-[6px] h-[6px] rounded-[2px] flex-shrink-0 ${student.gender === "Male" ? "bg-[#3280fa]" : "bg-[#c45296]"}`} />
                    <span className="text-[10px] font-semibold text-[#f0f0f0]">{student.gender}</span>
                  </div>
                </div>
              </div>

              {/* Room / Bed */}
              <div className="flex items-center px-4 py-2.5 border-l border-[#1e231e]">
                <div>
                  <p className="text-[12px] font-medium text-[#f0f0f0]">{student.room_number}</p>
                  <p className="text-[11px] text-[#808080]">Bed {student.bed_number}</p>
                </div>
              </div>

              {/* Semester */}
              <div className="flex items-center px-4 py-2.5 border-l border-[#1e231e]">
                <div className="inline-flex items-center gap-1.5 bg-[rgba(47,168,114,0.1)] rounded-full px-2.5 py-1">
                  <Check size={10} className="text-[#2fa872]" />
                  <span className="text-[11px] font-semibold text-[#2fa872]">{student.semester} {student.year}</span>
                </div>
              </div>

              {/* University · Course */}
              <div className="flex items-center px-4 py-2.5 border-l border-[#1e231e] min-w-0">
                <div className="min-w-0">
                  <p className="text-[12px] text-[#f0f0f0] truncate">{student.university}</p>
                  <p className="text-[11px] text-[#808080] truncate">{student.course} · Y{student.year_of_study}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center px-4 py-2.5 border-l border-[#1e231e]">
                <span className="text-[12px] text-[#808080] font-['Courier_Prime',monospace]">{student.phone}</span>
              </div>

              {/* Action */}
              <div className="flex items-center justify-center px-2 py-2.5 border-l border-[#1e231e]">
                <button
                  onClick={() => handleCheckout(student)}
                  disabled={checkingOut === student.id}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[rgba(220,38,38,0.08)] border border-[rgba(220,38,38,0.2)] hover:bg-[rgba(220,38,38,0.15)] text-red-400 font-semibold text-[11px] rounded-[6px] transition-colors disabled:opacity-40"
                  title="Check out"
                >
                  {checkingOut === student.id
                    ? <Loader2 size={11} className="animate-spin" />
                    : <LogOut size={11} />}
                  Out
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <p className="text-[11px] text-[#808080] px-1">{filtered.length} of {students.length} students</p>

      {/* Registration modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e120e] border border-[#272b27] rounded-[12px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0e120e] border-b border-[#212521] px-5 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-[15px] font-semibold text-[#f0f0f0]">Register Student</h2>
                <p className="text-[11px] text-[#808080] mt-0.5">Add a new resident to the hostel</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-[#1a1f1a] rounded-lg transition-colors">
                <X size={14} className="text-[#808080]" />
              </button>
            </div>
            <div className="p-5 space-y-3.5">
              <div>
                <label className={LABEL}>Full Name *</label>
                <input type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className={INPUT} placeholder="e.g. Akot Deng" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Phone *</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={INPUT} placeholder="+256…" />
                </div>
                <div>
                  <label className={LABEL}>Emergency Contact *</label>
                  <input type="tel" value={formData.emergency_contact} onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })} className={INPUT} placeholder="+256…" />
                </div>
              </div>
              <div>
                <label className={LABEL}>University *</label>
                <input type="text" value={formData.university} onChange={e => setFormData({ ...formData, university: e.target.value })} className={INPUT} placeholder="e.g. Makerere University" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Course *</label>
                  <input type="text" value={formData.course} onChange={e => setFormData({ ...formData, course: e.target.value })} className={INPUT} placeholder="e.g. Computer Science" />
                </div>
                <div>
                  <label className={LABEL}>Year of Study *</label>
                  <input type="number" min="1" max="7" value={formData.year_of_study} onChange={e => setFormData({ ...formData, year_of_study: e.target.value })} className={INPUT} placeholder="1–7" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Course Duration (yrs) *</label>
                  <input type="number" min="1" max="7" value={formData.course_duration} onChange={e => setFormData({ ...formData, course_duration: e.target.value })} className={INPUT} placeholder="e.g. 4" />
                </div>
                <div>
                  <label className={LABEL}>Year Joined *</label>
                  <input type="number" min="2020" max="2035" value={formData.year_joined} onChange={e => setFormData({ ...formData, year_joined: e.target.value })} className={INPUT} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Gender *</label>
                  <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value as Gender })} className={INPUT}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Semester Joined *</label>
                  <select value={formData.semester_joined} onChange={e => setFormData({ ...formData, semester_joined: e.target.value as Semester })} className={INPUT}>
                    <option value="Sem1">Sem 1</option>
                    <option value="Sem2">Sem 2</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL}>Assign Bed *</label>
                {bedsLoading ? (
                  <div className="flex items-center gap-2 text-[12px] text-[#808080] py-2">
                    <Loader2 size={13} className="animate-spin text-[#2fa872]" /> Loading beds…
                  </div>
                ) : (
                  <select value={formData.bed_id} onChange={e => setFormData({ ...formData, bed_id: e.target.value })} className={INPUT}>
                    <option value="">— Select a bed —</option>
                    {availableBeds.map(bed => (
                      <option key={bed.id} value={bed.id}>
                        {bed.room_number} · Bed {bed.bed_number} — {fmt(bed.price_per_bed)}/sem
                      </option>
                    ))}
                  </select>
                )}
                {!bedsLoading && availableBeds.length === 0 && (
                  <p className="text-[11px] text-amber-500 mt-1">No available beds for {formData.gender} students.</p>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 bg-[#0e120e] border-t border-[#212521] px-5 py-4 flex items-center justify-end gap-2.5 z-10">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-[#1a1f1a] hover:bg-[#212521] text-[#c8c8c8] text-[12px] font-semibold rounded-[8px] transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-[#2fa872] hover:bg-[#27936400] text-white text-[12px] font-semibold rounded-[8px] flex items-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]">
                {saving ? <><Loader2 size={13} className="animate-spin" />Registering…</> : <><Check size={13} />Register</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}