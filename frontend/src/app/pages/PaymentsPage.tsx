/**
 * PaymentsPage — wired to FastAPI backend
 *
 * Drop into src/app/pages/PaymentsPage.tsx
 * Import in App.tsx: import PaymentsPage from "./pages/PaymentsPage";
 *
 * Requires VITE_API_URL in .env (e.g. http://localhost:8000)
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Eye, Trash2, X, Check, Loader2, AlertCircle,
  MoreHorizontal, DollarSign, Clock, AlertTriangle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Payment {
  id: number;
  tenant: string;
  unit: string;
  amount: number;
  due: string;
  paid: string | null;
  status: "Paid" | "Pending" | "Overdue";
  notes: string | null;
}

interface Summary {
  collected: number;
  pending: number;
  overdue: number;
}

interface PaymentFormData {
  tenant: string;
  unit: string;
  amount: string;
  due: string;
  paid: string;
  status: string;
  notes: string;
}

const EMPTY_FORM: PaymentFormData = {
  tenant: "", unit: "", amount: "", due: "", paid: "", status: "Pending", notes: "",
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
  Paid:    "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-700/50",
  Pending: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-700/50",
  Overdue: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-700/50",
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

// ── Record Payment Modal (Add / Edit) ─────────────────────────────────────────

function PaymentModal({
  title,
  form,
  setForm,
  onClose,
  onSave,
  saving,
}: {
  title: string;
  form: PaymentFormData;
  setForm: React.Dispatch<React.SetStateAction<PaymentFormData>>;
  onClose: () => void;
  onSave: () => Promise<void>;
  saving: boolean;
}) {
  const canSave = form.tenant && form.unit && form.amount && form.due;

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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Amount (UGX)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 2400" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))} className={inputCls}>
                {["Pending", "Paid", "Overdue"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
              <input value={form.due} onChange={(e) => setForm(p => ({ ...p, due: e.target.value }))} placeholder="e.g. Jul 1, 2026" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Paid Date</label>
              <input value={form.paid} onChange={(e) => setForm(p => ({ ...p, paid: e.target.value }))} placeholder="e.g. Jul 1, 2026" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Notes (optional)</label>
            <input value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Paid via mobile money" className={inputCls} />
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
            Save Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Payment Detail Drawer ─────────────────────────────────────────────────────

function PaymentDrawer({
  payment,
  onClose,
  onMarkPaid,
  onEdit,
  onDelete,
  saving,
}: {
  payment: Payment;
  onClose: () => void;
  onMarkPaid: (id: number) => Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[90]" onClick={onClose} />
      <div className="fixed inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-96 bg-white dark:bg-slate-900 shadow-2xl z-[100] flex flex-col border-l border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Payment Detail</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Tenant + amount hero */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
            <Avatar name={payment.tenant} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{payment.tenant}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Unit #{payment.unit}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatCurrency(payment.amount)}</p>
              <Badge status={payment.status} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Due</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{payment.due}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Paid</p>
              <p className={`text-sm font-bold ${payment.paid ? "text-emerald-600" : "text-slate-400 dark:text-slate-500"}`}>
                {payment.paid ?? "—"}
              </p>
            </div>
          </div>

          {/* Notes */}
          {payment.notes && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{payment.notes}</p>
            </div>
          )}

          {/* Mark as paid CTA — only shown when not already paid */}
          {payment.status !== "Paid" && (
            <button
              onClick={() => onMarkPaid(payment.id)}
              disabled={saving}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Mark as Paid · {today}
            </button>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button onClick={onDelete} className="py-3 px-4 border border-red-200 dark:border-red-800 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center">
            <Trash2 size={14} />
          </button>
          <button onClick={onEdit} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5">
            Edit
          </button>
        </div>
      </div>
    </>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────

function DeleteModal({ payment, onClose, onConfirm, saving }: {
  payment: Payment; onClose: () => void; onConfirm: () => Promise<void>; saving: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
          <Trash2 size={20} className="text-red-600" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Delete this payment?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          {payment.tenant} · Unit #{payment.unit} · {formatCurrency(payment.amount)} — this cannot be undone.
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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary,  setSummary]  = useState<Summary>({ collected: 0, pending: 0, overdue: 0 });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);

  const [filter, setFilter] = useState("All");

  const [detailPayment, setDetailPayment] = useState<Payment | null>(null);
  const [addOpen,        setAddOpen]       = useState(false);
  const [editPayment,    setEditPayment]   = useState<Payment | null>(null);
  const [delPayment,     setDelPayment]    = useState<Payment | null>(null);

  const [form, setForm] = useState<PaymentFormData>(EMPTY_FORM);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, sum] = await Promise.all([
        apiFetch<Payment[]>("/payments/"),
        apiFetch<Summary>("/payments/summary"),
      ]);
      setPayments(data);
      setSummary(sum);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // refresh summary after any mutation
  const refreshSummary = async () => {
    const sum = await apiFetch<Summary>("/payments/summary");
    setSummary(sum);
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    setSaving(true);
    try {
      const created = await apiFetch<Payment>("/payments/", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          paid: form.paid || null,
          notes: form.notes || null,
        }),
      });
      setPayments(prev => [...prev, created]);
      await refreshSummary();
      setAddOpen(false);
      setForm(EMPTY_FORM);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editPayment) return;
    setSaving(true);
    try {
      const updated = await apiFetch<Payment>(`/payments/${editPayment.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          paid: form.paid || null,
          notes: form.notes || null,
        }),
      });
      setPayments(prev => prev.map(p => p.id === editPayment.id ? updated : p));
      if (detailPayment?.id === editPayment.id) setDetailPayment(updated);
      await refreshSummary();
      setEditPayment(null);
      setForm(EMPTY_FORM);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update payment");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (id: number) => {
    setSaving(true);
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    try {
      const updated = await apiFetch<Payment>(`/payments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Paid", paid: today }),
      });
      setPayments(prev => prev.map(p => p.id === id ? updated : p));
      if (detailPayment?.id === id) setDetailPayment(updated);
      await refreshSummary();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to mark as paid");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!delPayment) return;
    setSaving(true);
    try {
      await apiFetch(`/payments/${delPayment.id}`, { method: "DELETE" });
      setPayments(prev => prev.filter(p => p.id !== delPayment.id));
      if (detailPayment?.id === delPayment.id) setDetailPayment(null);
      await refreshSummary();
      setDelPayment(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete payment");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (payment: Payment) => {
    setForm({
      tenant: payment.tenant,
      unit:   payment.unit,
      amount: String(payment.amount),
      due:    payment.due,
      paid:   payment.paid ?? "",
      status: payment.status,
      notes:  payment.notes ?? "",
    });
    setDetailPayment(null);
    setEditPayment(payment);
  };

  // ── Filter ───────────────────────────────────────────────────────────────────

  const rows = filter === "All" ? payments : payments.filter(p => p.status === filter);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Payments</h1>
        <button
          onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-3 py-2 text-xs active:scale-95 transition-all"
        >
          <Plus size={14} />Record
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
          [1,2,3].map(i => (
            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 animate-pulse h-20" />
          ))
        ) : (
          <>
            <div className="bg-emerald-50 dark:bg-emerald-900/25 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={13} className="text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Collected</span>
              </div>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 truncate">{formatCurrency(summary.collected)}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/25 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={13} className="text-blue-600" />
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Pending</span>
              </div>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400 truncate">{formatCurrency(summary.pending)}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/25 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={13} className="text-red-600" />
                <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">Overdue</span>
              </div>
              <p className="text-lg font-bold text-red-700 dark:text-red-400 truncate">{formatCurrency(summary.overdue)}</p>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {["All", "Paid", "Pending", "Overdue"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 min-h-[36px] ${filter === s ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
          >
            {s}
            {s !== "All" && (
              <span className="ml-1.5 opacity-70">{payments.filter(p => p.status === s).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div className="space-y-1.5">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-28" />
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-16" />
                  </div>
                </div>
                <div className="text-right space-y-1.5">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-14 ml-auto" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile cards */}
      {!loading && (
        <div className="lg:hidden space-y-3">
          {rows.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">No payments found.</div>
          ) : rows.map(p => (
            <div
              key={p.id}
              onClick={() => setDetailPayment(p)}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-sm cursor-pointer active:scale-[0.99] transition-all ${p.status === "Overdue" ? "border-red-200 dark:border-red-800" : "border-slate-100 dark:border-slate-800"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={p.tenant} />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{p.tenant}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Unit #{p.unit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">{formatCurrency(p.amount)}</p>
                  <Badge status={p.status} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Pill label="Due"  value={p.due} />
                <Pill label="Paid" value={p.paid ?? "—"} />
              </div>
              {/* Quick mark-paid button for pending/overdue */}
              {p.status !== "Paid" && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleMarkPaid(p.id); }}
                  disabled={saving}
                  className="mt-3 w-full py-2 bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-60"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Mark as Paid
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
                {["Tenant", "Unit", "Amount", "Due", "Paid", "Status", ""].map((c, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">No payments found.</td>
                </tr>
              ) : rows.map(p => (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer ${p.status === "Overdue" ? "bg-red-50/30 dark:bg-red-900/10" : ""}`}
                  onClick={() => setDetailPayment(p)}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={p.tenant} />
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.tenant}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-bold font-mono">#{p.unit}</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">{p.due}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">{p.paid ?? "—"}</td>
                  <td className="px-4 py-3.5"><Badge status={p.status} /></td>
                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setDetailPayment(p)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <Eye size={13} />
                      </button>
                      {p.status !== "Paid" && (
                        <button
                          onClick={() => handleMarkPaid(p.id)}
                          disabled={saving}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600 disabled:opacity-60"
                          title="Mark as paid"
                        >
                          <Check size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <MoreHorizontal size={13} />
                      </button>
                      <button
                        onClick={() => setDelPayment(p)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"
                      >
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
                Showing {rows.length} of {payments.length} payments
              </span>
              <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                <span><span className="font-bold text-emerald-600">{payments.filter(p => p.status === "Paid").length}</span> paid</span>
                <span><span className="font-bold text-blue-600">{payments.filter(p => p.status === "Pending").length}</span> pending</span>
                <span><span className="font-bold text-red-600">{payments.filter(p => p.status === "Overdue").length}</span> overdue</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Detail Drawer ─────────────────────────────────────────────────────── */}
      {detailPayment && (
        <PaymentDrawer
          payment={detailPayment}
          onClose={() => setDetailPayment(null)}
          onMarkPaid={handleMarkPaid}
          onEdit={() => openEdit(detailPayment)}
          onDelete={() => { setDelPayment(detailPayment); setDetailPayment(null); }}
          saving={saving}
        />
      )}

      {/* ── Add Modal ─────────────────────────────────────────────────────────── */}
      {addOpen && (
        <PaymentModal
          title="Record Payment"
          form={form}
          setForm={setForm}
          onClose={() => { setAddOpen(false); setForm(EMPTY_FORM); }}
          onSave={handleCreate}
          saving={saving}
        />
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────────── */}
      {editPayment && (
        <PaymentModal
          title="Edit Payment"
          form={form}
          setForm={setForm}
          onClose={() => { setEditPayment(null); setForm(EMPTY_FORM); }}
          onSave={handleUpdate}
          saving={saving}
        />
      )}

      {/* ── Delete Confirm ────────────────────────────────────────────────────── */}
      {delPayment && (
        <DeleteModal
          payment={delPayment}
          onClose={() => setDelPayment(null)}
          onConfirm={handleDelete}
          saving={saving}
        />
      )}
    </div>
  );
}
