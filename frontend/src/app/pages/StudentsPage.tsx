/**
 * StudentsPage — active students with registration and checkout
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Plus, LogOut, X, Check,
  Loader2, AlertCircle, Phone, BookOpen, Home,
} from "lucide-react";
import { listStudents, registerStudent, checkoutStudent } from "../lib/api/students";
import { listAvailableBeds } from "../lib/api/rooms";
import type { ActiveStudent, StudentRegistration, Gender, Semester, AvailableBed } from "../lib/types";

const formatCurrency = (v: number) => `UGX ${v.toLocaleString()}`;

interface RegFormData {
  full_name: string;
  phone: string;
  emergency_contact: string;
  university: string;
  course: string;
  year_of_study: string;
  course_duration: string;
  gender: Gender;
  semester_joined: Semester;
  year_joined: string;
  bed_id: string;
}

const EMPTY_FORM: RegFormData = {
  full_name: "",
  phone: "",
  emergency_contact: "",
  university: "",
  course: "",
  year_of_study: "",
  course_duration: "",
  gender: "Male",
  semester_joined: "Sem1",
  year_joined: String(new Date().getFullYear()),
  bed_id: "",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<ActiveStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<RegFormData>(EMPTY_FORM);
  const [availableBeds, setAvailableBeds] = useState<AvailableBed[]>([]);
  const [bedsLoading, setBedsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStudents(await listStudents());
    } catch (err: any) {
      setError(err.message ?? "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  // Reload available beds when gender changes in modal
  useEffect(() => {
    if (!showModal) return;
    setBedsLoading(true);
    setFormData(f => ({ ...f, bed_id: "" }));
    listAvailableBeds(formData.gender)
      .then(setAvailableBeds)
      .catch(() => setAvailableBeds([]))
      .finally(() => setBedsLoading(false));
  }, [showModal, formData.gender]);

  const handleOpenModal = () => {
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData(EMPTY_FORM);
    setAvailableBeds([]);
  };

  const handleSubmit = async () => {
    const { full_name, phone, emergency_contact, university, course, year_of_study, course_duration, bed_id } = formData;
    if (!full_name || !phone || !emergency_contact || !university || !course || !year_of_study || !course_duration || !bed_id) {
      alert("Please fill all required fields and select a bed");
      return;
    }
    setSaving(true);
    try {
      const payload: StudentRegistration = {
        full_name,
        phone,
        emergency_contact,
        university,
        course,
        year_of_study: parseInt(year_of_study),
        course_duration: parseInt(course_duration),
        gender: formData.gender,
        semester_joined: formData.semester_joined,
        year_joined: parseInt(formData.year_joined),
        bed_id: parseInt(bed_id),
      };
      await registerStudent(payload);
      await loadStudents();
      handleCloseModal();
    } catch (err: any) {
      alert(err.message ?? "Failed to register student");
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async (student: ActiveStudent) => {
    if (!confirm(`Check out ${student.full_name}? This will free their bed.`)) return;
    try {
      await checkoutStudent(student.id);
      await loadStudents();
    } catch (err: any) {
      alert(err.message ?? "Failed to checkout student");
    }
  };

  const filtered = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return students.filter(s =>
      s.full_name.toLowerCase().includes(t) ||
      s.university.toLowerCase().includes(t) ||
      s.course.toLowerCase().includes(t) ||
      s.room_number.toLowerCase().includes(t)
    );
  }, [students, searchTerm]);  const inputCls = "w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary text-slate-900 dark:text-slate-100 min-h-[40px]";
  const labelCls = "block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5";

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 size={28} className="text-primary animate-spin" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading students…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <AlertCircle size={32} className="text-red-500" />
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-sm">{error}</p>
      <button onClick={loadStudents} className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-sm font-semibold rounded-lg shadow-sm active:scale-[0.98] transition-all">
        Retry
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Students</h1>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white px-3.5 py-2 rounded-lg font-semibold text-xs shadow-sm active:scale-[0.98] transition-all"
        >
          <Plus size={14} />Register
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: students.length, bg: "bg-white dark:bg-slate-900", text: "text-blue-650 dark:text-blue-400" },
          { label: "Male", value: students.filter(s => s.gender === "Male").length, bg: "bg-white dark:bg-slate-900", text: "text-indigo-650 dark:text-indigo-400" },
          { label: "Female", value: students.filter(s => s.gender === "Female").length, bg: "bg-white dark:bg-slate-900", text: "text-pink-650 dark:text-pink-400" },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-lg border border-slate-150/80 dark:border-slate-800/80 p-4 shadow-sm`}>
            <p className={`text-xl font-bold ${stat.text}`}>{stat.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-1.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search by name, university, course, room…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
        />
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500">
            {searchTerm ? "No students match your search" : "No active students"}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {filtered.map(student => (
              <div key={student.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{student.full_name}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${student.gender === "Male" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400"}`}>
                        {student.gender}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Home size={11} className="text-slate-400" />
                        {student.room_number} · Bed {student.bed_number}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen size={11} className="text-slate-400" />
                        {student.university} · {student.course} Y{student.year_of_study}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone size={11} className="text-slate-400" />
                        {student.phone}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-505 mt-1">
                      {student.semester} {student.year}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCheckout(student)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-650 font-semibold text-xs rounded-lg transition-colors flex-shrink-0"
                    title="Check out"
                  >
                    <LogOut size={13} />Check Out
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registration modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Register Student</h2>
              <button onClick={handleCloseModal} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X size={15} className="text-slate-550 dark:text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className={inputCls} placeholder="e.g. Akot Deng" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Phone *</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputCls} placeholder="+256…" />
                </div>
                <div>
                  <label className={labelCls}>Emergency Contact *</label>
                  <input type="tel" value={formData.emergency_contact} onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })} className={inputCls} placeholder="+256…" />
                </div>
              </div>
              <div>
                <label className={labelCls}>University *</label>
                <input type="text" value={formData.university} onChange={e => setFormData({ ...formData, university: e.target.value })} className={inputCls} placeholder="e.g. Makerere University" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Course *</label>
                  <input type="text" value={formData.course} onChange={e => setFormData({ ...formData, course: e.target.value })} className={inputCls} placeholder="e.g. Computer Science" />
                </div>
                <div>
                  <label className={labelCls}>Year of Study *</label>
                  <input type="number" min="1" max="7" value={formData.year_of_study} onChange={e => setFormData({ ...formData, year_of_study: e.target.value })} className={inputCls} placeholder="1–7" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Course Duration (yrs) *</label>
                  <input type="number" min="1" max="7" value={formData.course_duration} onChange={e => setFormData({ ...formData, course_duration: e.target.value })} className={inputCls} placeholder="e.g. 4" />
                </div>
                <div>
                  <label className={labelCls}>Year Joined *</label>
                  <input type="number" min="2020" max="2035" value={formData.year_joined} onChange={e => setFormData({ ...formData, year_joined: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Gender *</label>
                  <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value as Gender })} className={inputCls}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Semester Joined *</label>
                  <select value={formData.semester_joined} onChange={e => setFormData({ ...formData, semester_joined: e.target.value as Semester })} className={inputCls}>
                    <option value="Sem1">Sem 1</option>
                    <option value="Sem2">Sem 2</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Assign Bed *</label>
                {bedsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                    <Loader2 size={14} className="animate-spin" /> Loading available beds…
                  </div>
                ) : (
                  <select value={formData.bed_id} onChange={e => setFormData({ ...formData, bed_id: e.target.value })} className={inputCls}>
                    <option value="">— Select a bed —</option>
                    {availableBeds.map(bed => (
                      <option key={bed.id} value={bed.id}>
                        {bed.room_number} · Bed {bed.bed_number} — {formatCurrency(bed.price_per_bed)}/sem
                      </option>
                    ))}
                  </select>
                )}
                {!bedsLoading && availableBeds.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No available beds for {formData.gender} students.</p>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-end gap-3 z-10">
              <button onClick={handleCloseModal} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-lg">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-semibold text-sm rounded-lg flex items-center gap-2 disabled:opacity-50 shadow-sm active:scale-[0.98] transition-all">
                {saving ? <><Loader2 size={14} className="animate-spin" />Registering…</> : <><Check size={14} />Register</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}