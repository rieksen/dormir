/**
 * LeasesPage — wired to FastAPI backend
 *
 * Drop into src/app/pages/LeasesPage.tsx
 * Import in App.tsx: import LeasesPage from "./pages/LeasesPage";
 *
 * Requires VITE_API_URL in .env (e.g. http://localhost:8000)
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Eye, Edit, Trash2, X, Check, Loader2, AlertCircle,
  FileText, RefreshCw, CalendarDays,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lease {
  id: number;
  tenant: string;
  unit: string;
  start: string;
  end: string;
  rent: number;
  status: "Active" | "Expiring Soon" | "Expired";
  notes: string | null;
}

interface Summary {
  active: number;
  expiring: number;
  expired: number;
}

interface LeaseFormData {
  tenant: string;
  unit: string;
  start: string;
  end: string;
  rent: string;
  status: string;
  notes: string;
}

const EMPTY_FORM: LeaseFormData = {
  tenant: "", unit: "", start: "", end: "", rent: "", status: "Active", notes: "",
};

// ── API ───────────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (v: number) => `UGX ${v.toLocaleString()}`;

const AVATAR_COLORS = [
  "bg-emerald-500", "bg-blue-500", "bg-violet-500",
  "bg-amber-500",   "bg-pink-500", "bg-teal-500",
];

function Avatar({ name }: { name: string }) {
  const ini = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const color = AVATAR_COLORS[ini.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`w-7 h-7 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {ini}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  "Active":        "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-700/50",
  "Expiring Soon": "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-700/50",
  "Expired":       "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
};

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{value}</p>
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 min-h-[44px]";

// ── Lease Detail Drawer ───────────────────────────────────────────────────────

function LeaseDrawer({
  lease,
  onClose,
  onEdit,
  onRenew,
  onDelete,
  saving,
}: {
  lease: Lease;
  onClose: () => void;
  onEdit: () => void;
  onRenew: (id: number) => Promise<void>;
  onDelete: () => void;
  saving: boolean;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[90]" onClick={onClose} />
      <div className="fixed inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-96 bg-white dark:bg-slate-900 shadow-2xl z-[100] flex flex-col border-l border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Lease Detail</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Tenant hero */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
            <Avatar name={lease.tenant} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{lease.tenant}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Unit #{lease.unit}</p>
            </div>
            <Badge status={lease.status} />
          </div>

          {/* Term */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <div className="flex items-center gap-1.5 mb-1">
                <CalendarDays size={11} className="text-slate-400" />
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Start</p>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{lease.start}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <div className="flex items-center gap-1.5 mb-1">
                <CalendarDays size={11} className="text-slate-400" />
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">End</p>
              </div>
              <p className={`text-sm font-bold ${lease.status === "Expiring Soon" ? "text-amber-600" : lease.status === "Expired" ? "text-red-500" : "text-slate-800 dark:text-slate-200"}`}>
                {lease.end}
              </p>
            </div>
          </div>

          {/* Rent */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Monthly Rent</p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(lease.rent)}<span className="text-xs text-slate-400 dark:text-slate-500 font-normal">/mo</span>
            </p>
          </div>

          {/* Notes */}
          {lease.notes && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{lease.notes}</p>
            </div>
          )}

          {/* Renew CTA — shown for expiring/expired leases */}
          {(lease.status === "Expiring Soon" || lease.status === "Expired") && (
            <button
              onClick={() => onRenew(lease.id)}
              disabled={saving}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              Renew Lease · 12 months
            </button>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button onClick={onDelete} className="py-3 px-4 border border-red-200 dark:border-red-800 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center">
            <Trash2 size={14} />
          </button>
          <button onClick={onEdit} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5">
            <Edit size={14} />Edit
          </button>
          <button onClick={onClose} className="flex-1 py-3 bg-emerald-600 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 hover:bg-emerald-700">
            <FileText size={14} />Close
          </button>
        </div>
      </div>
    </>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────

function LeaseModal({
  title,
  form,
  setForm,
  onClose,
  onSave,
  saving,
}: {
  title: string;
  form: LeaseFormData;
  setForm: React.Dispatch<React.SetStateAction<LeaseFormData>>;
  onClose: () => void;
  onSave: () => Promise<void>;
  saving: boolean;
}) {
  const canSave = form.tenant && form.unit && form.start && form.end && form.rent;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100]">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tenant Name</label>
              <input value={form.tenant} onChange={(e) => setForm(p => ({ ...p, tenant: e.target.value }))} placeholder="e.g. Sarah Chen" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Unit #</label>
              <input value={form.unit} onChange={(e) => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="e.g. 101" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Start Date</label>
              <input value={form.start} onChange={(e) => setForm(p => ({ ...p, start: e.target.value }))} placeholder="e.g. Jan 1, 2025" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">End Date</label>
              <input value={form.end} onChange={(e) => setForm(p => ({ ...p, end: e.target.value }))} placeholder="e.g. Dec 31, 2025" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Rent (UGX/mo)</label>
              <input type="number" value={form.rent} onChange={(e) => setForm(p => ({ ...p, rent: e.target.value }))} placeholder="e.g. 2400" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))} className={inputCls}>
                {["Active", "Expiring Soon", "Expired"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Notes (optional)</label>
            <input value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Includes parking" className={inputCls} />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !canSave}
            className="flex-1 py-3 bg-emerald-600 rounded-xl text-sm font-semibold text-white hover:bg-emerald-700 flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save Lease
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────

function DeleteModal({ lease, onClose, onConfirm, saving }: {
  lease: Lease; onClose: () => void; onConfirm: () => Promise<void>; saving: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
          <Trash2 size={20} className="text-red-600" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Delete this lease?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          {lease.tenant} · Unit #{lease.unit} · {lease.start} – {lease.end}. This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={saving} className="flex-1 py-3 bg-red-600 rounded-xl text-sm font-semibold text-white hover:bg-red-700 flex items-center justify-center gap-1.5 disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function LeasesPage() {
  const [leases,  setLeases]  = useState<Lease[]>([]);
  const [summary, setSummary] = useState<Summary>({ active: 0, expiring: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [saving,  setSaving]  = useState(false);

  const [filter, setFilter] = useState("All");

  const [detailLease, setDetailLease] = useState<Lease | null>(null);
  const [addOpen,     setAddOpen]     = useState(false);
  const [editLease,   setEditLease]   = useState<Lease | null>(null);
  const [delLease,    setDelLease]    = useState<Lease | null>(null);

  const [form, setForm] = useState<LeaseFormData>(EMPTY_FORM);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, sum] = await Promise.all([
        apiFetch<Lease[]>("/leases/"),
        apiFetch<Summary>("/leases/summary"),
      ]);
      setLeases(data);
      setSummary(sum);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load leases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refreshSummary = async () => {
    const sum = await apiFetch<Summary>("/leases/summary");
    setSummary(sum);
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    setSaving(true);
    try {
      const created = await apiFetch<Lease>("/leases/", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          rent: Number(form.rent),
          notes: form.notes || null,
        }),
      });
      setLeases(prev => [...prev, created]);
      await refreshSummary();
      setAddOpen(false);
      setForm(EMPTY_FORM);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create lease");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editLease) return;
    setSaving(true);
    try {
      const updated = await apiFetch<Lease>(`/leases/${editLease.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          rent: Number(form.rent),
          notes: form.notes || null,
        }),
      });
      setLeases(prev => prev.map(l => l.id === editLease.id ? updated : l));
      if (detailLease?.id === editLease.id) setDetailLease(updated);
      await refreshSummary();
      setEditLease(null);
      setForm(EMPTY_FORM);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update lease");
    } finally {
      setSaving(false);
    }
  };

  // Renew: extend end date by 12 months, set status back to Active
  const handleRenew = async (id: number) => {
    const lease = leases.find(l => l.id === id);
    if (!lease) return;
    setSaving(true);
    try {
      // Parse end date and add 12 months
      const endDate = new Date(lease.end);
      endDate.setFullYear(endDate.getFullYear() + 1);
      const newEnd = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      const updated = await apiFetch<Lease>(`/leases/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ end: newEnd, status: "Active" }),
      });
      setLeases(prev => prev.map(l => l.id === id ? updated : l));
      if (detailLease?.id === id) setDetailLease(updated);
      await refreshSummary();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to renew lease");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!delLease) return;
    setSaving(true);
    try {
      await apiFetch(`/leases/${delLease.id}`, { method: "DELETE" });
      setLeases(prev => prev.filter(l => l.id !== delLease.id));
      if (detailLease?.id === delLease.id) setDetailLease(null);
      await refreshSummary();
      setDelLease(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete lease");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (lease: Lease) => {
    setForm({
      tenant: lease.tenant,
      unit:   lease.unit,
      start:  lease.start,
      end:    lease.end,
      rent:   String(lease.rent),
      status: lease.status,
      notes:  lease.notes ?? "",
    });
    setDetailLease(null);
    setEditLease(lease);
  };

  // ── Filter ───────────────────────────────────────────────────────────────────

  const rows = filter === "All" ? leases : leases.filter(l => l.status === filter);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Leases</h1>
        <button
          onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-3 py-2 text-xs active:scale-95 transition-all"
        >
          <Plus size={14} />New Lease
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 animate-pulse h-20" />)
        ) : (
          <>
            <div className="bg-emerald-50 dark:bg-emerald-900/25 rounded-2xl p-4">
              <p className="text-2xl font-bold text-emerald-600">{summary.active}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Active</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/25 rounded-2xl p-4">
              <p className="text-2xl font-bold text-amber-600">{summary.expiring}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Expiring Soon</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4">
              <p className="text-2xl font-bold text-slate-500 dark:text-slate-400">{summary.expired}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Expired</p>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {["All", "Active", "Expiring Soon", "Expired"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 min-h-[36px] ${filter === s ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
          >
            {s}
            {s !== "All" && (
              <span className="ml-1.5 opacity-70">{leases.filter(l => l.status === s).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-16" />
                </div>
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-20" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(j => <div key={j} className="h-8 bg-slate-100 dark:bg-slate-800 rounded" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile cards */}
      {!loading && (
        <div className="lg:hidden space-y-3">
          {rows.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">No leases found.</div>
          ) : rows.map(l => (
            <div
              key={l.id}
              onClick={() => setDetailLease(l)}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-sm cursor-pointer active:scale-[0.99] transition-all ${l.status === "Expiring Soon" ? "border-amber-200 dark:border-amber-800" : l.status === "Expired" ? "border-slate-200 dark:border-slate-700" : "border-slate-100 dark:border-slate-800"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={l.tenant} />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{l.tenant}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Unit #{l.unit}</p>
                  </div>
                </div>
                <Badge status={l.status} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Pill label="Start" value={l.start.split(",")[0]} />
                <Pill label="End"   value={l.end.split(",")[0]} />
                <Pill label="Rent"  value={formatCurrency(l.rent)} />
              </div>
              {/* Quick renew button for expiring/expired */}
              {(l.status === "Expiring Soon" || l.status === "Expired") && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRenew(l.id); }}
                  disabled={saving}
                  className="mt-3 w-full py-2 bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-60"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  Renew · 12 months
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Desktop table */}
      {!loading && (
        <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                {["Tenant", "Unit", "Start", "End", "Rent", "Status", ""].map((c, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">No leases found.</td>
                </tr>
              ) : rows.map(l => (
                <tr
                  key={l.id}
                  onClick={() => setDetailLease(l)}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer ${l.status === "Expiring Soon" ? "bg-amber-50/30 dark:bg-amber-900/10" : ""}`}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={l.tenant} />
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{l.tenant}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-bold font-mono">#{l.unit}</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">{l.start}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">{l.end}</td>
                  <td className="px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(l.rent)}<span className="text-xs text-slate-400 font-normal">/mo</span>
                  </td>
                  <td className="px-4 py-3.5"><Badge status={l.status} /></td>
                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setDetailLease(l)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                        <Eye size={13} />
                      </button>
                      {(l.status === "Expiring Soon" || l.status === "Expired") && (
                        <button
                          onClick={() => handleRenew(l.id)}
                          disabled={saving}
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-600 disabled:opacity-60"
                          title="Renew lease"
                        >
                          <RefreshCw size={13} />
                        </button>
                      )}
                      <button onClick={() => openEdit(l)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                        <Edit size={13} />
                      </button>
                      <button onClick={() => setDelLease(l)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Showing {rows.length} of {leases.length} leases
              </span>
              <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                <span><span className="font-bold text-emerald-600">{leases.filter(l => l.status === "Active").length}</span> active</span>
                <span><span className="font-bold text-amber-600">{leases.filter(l => l.status === "Expiring Soon").length}</span> expiring</span>
                <span><span className="font-bold text-slate-500">{leases.filter(l => l.status === "Expired").length}</span> expired</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Detail Drawer ─────────────────────────────────────────────────────── */}
      {detailLease && (
        <LeaseDrawer
          lease={detailLease}
          onClose={() => setDetailLease(null)}
          onEdit={() => openEdit(detailLease)}
          onRenew={handleRenew}
          onDelete={() => { setDelLease(detailLease); setDetailLease(null); }}
          saving={saving}
        />
      )}

      {/* ── Add Modal ─────────────────────────────────────────────────────────── */}
      {addOpen && (
        <LeaseModal
          title="New Lease"
          form={form}
          setForm={setForm}
          onClose={() => { setAddOpen(false); setForm(EMPTY_FORM); }}
          onSave={handleCreate}
          saving={saving}
        />
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────────── */}
      {editLease && (
        <LeaseModal
          title={`Edit — ${editLease.tenant}`}
          form={form}
          setForm={setForm}
          onClose={() => { setEditLease(null); setForm(EMPTY_FORM); }}
          onSave={handleUpdate}
          saving={saving}
        />
      )}

      {/* ── Delete Confirm ────────────────────────────────────────────────────── */}
      {delLease && (
        <DeleteModal
          lease={delLease}
          onClose={() => setDelLease(null)}
          onConfirm={handleDelete}
          saving={saving}
        />
      )}
    </div>
  );
}