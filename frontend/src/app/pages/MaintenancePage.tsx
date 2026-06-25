/**
 * MaintenancePage — wired to FastAPI backend
 *
 * Drop this file into src/app/pages/MaintenancePage.tsx and import it in App.tsx:
 *   import MaintenancePage from "./pages/MaintenancePage";
 *
 * Set VITE_API_URL in your .env:
 *   VITE_API_URL=http://localhost:8000
 *
 * The component manages maintenance request CRUD operations via REST API.
 * All existing UI (mobile cards, desktop table, add/edit/delete modals) is preserved.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Plus, Edit, Trash2, X, Check, Loader2, AlertCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface MaintenanceRequest {
  id: number;
  unit_id: number;
  tenant_id: number;
  category: "Plumbing" | "Electrical" | "HVAC" | "Appliance" | "Other";
  priority: "Low" | "Medium" | "High" | "Emergency";
  status: "Open" | "In Progress" | "Resolved";
  description: string;
  submitted_date: string;
  resolved_date: string | null;
  assigned_to: string | null;
}

interface MaintenanceRequestFormData {
  unit_id: string;
  tenant_id: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  assigned_to: string;
}

const EMPTY_FORM: MaintenanceRequestFormData = {
  unit_id: "",
  tenant_id: "",
  category: "Plumbing",
  priority: "Medium",
  status: "Open",
  description: "",
  assigned_to: "",
};

// ── API helpers ───────────────────────────────────────────────────────────────

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
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Status Badge Colors ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-700/50",
  "In Progress": "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-700/50",
  Resolved: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-700/50",
};

const PRIORITY_STYLES: Record<string, string> = {
  Low: "bg-slate-50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700/50",
  Medium: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-700/50",
  High: "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 ring-1 ring-orange-200 dark:ring-orange-700/50",
  Emergency: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-700/50",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${PRIORITY_STYLES[priority] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}>
      {priority}
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

// ── Main component ────────────────────────────────────────────────────────────

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  // modals
  const [addOpen, setAddOpen] = useState(false);
  const [editRequest, setEditRequest] = useState<MaintenanceRequest | null>(null);
  const [delRequest, setDelRequest] = useState<MaintenanceRequest | null>(null);

  const [form, setForm] = useState<MaintenanceRequestFormData>(EMPTY_FORM);

  // Reset form when opening add modal
  useEffect(() => {
    if (addOpen) {
      setForm(EMPTY_FORM);
    }
  }, [addOpen]);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<MaintenanceRequest[]>("/maintenance/");
      setRequests(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load maintenance requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.unit_id || !form.tenant_id || !form.category || !form.priority || !form.description) return;
    setSaving(true);
    try {
      const created = await apiFetch<MaintenanceRequest>("/maintenance/", {
        method: "POST",
        body: JSON.stringify({
          unit_id: Number(form.unit_id),
          tenant_id: Number(form.tenant_id),
          category: form.category,
          priority: form.priority,
          description: form.description,
          assigned_to: form.assigned_to || null,
        }),
      });
      setRequests((prev) => [...prev, created]);
      setAddOpen(false);
      setForm(EMPTY_FORM);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create request");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number, data: Partial<MaintenanceRequestFormData>) => {
    setSaving(true);
    try {
      const updated = await apiFetch<MaintenanceRequest>(`/maintenance/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          unit_id: data.unit_id !== undefined ? Number(data.unit_id) : undefined,
          tenant_id: data.tenant_id !== undefined ? Number(data.tenant_id) : undefined,
          category: data.category,
          priority: data.priority,
          status: data.status,
          description: data.description,
          assigned_to: data.assigned_to || null,
        }),
      });
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setEditRequest(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update request");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setSaving(true);
    try {
      await apiFetch(`/maintenance/${id}`, { method: "DELETE" });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setDelRequest(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete request");
    } finally {
      setSaving(false);
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────

  const rows = requests.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = search === "" || 
      r.unit_id.toString().includes(search) || 
      r.tenant_id.toString().includes(search) ||
      r.description.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q);
    const matchFilter = filter === "All" || r.status === filter;
    return matchSearch && matchFilter;
  });

  // ── Shared input style ─────────────────────────────────────────────────────

  const inputCls = "w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 min-h-[44px]";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Maintenance Requests</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-3 py-2 text-xs active:scale-95 transition-all"
        >
          <Plus size={14} />Add Request
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="flex-shrink-0"><X size={14} /></button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by unit, tenant, category, or description…"
          className="w-full pl-9 pr-3 py-2.5 bg-slate-100 dark:bg-slate-800 border-0 rounded-2xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
        />
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {["All", "Open", "In Progress", "Resolved"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 min-h-[36px] ${filter === s ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
          >
            {s}
            {s !== "All" && (
              <span className="ml-1.5 opacity-70">
                {requests.filter((r) => r.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div data-testid="loading-skeleton" className="space-y-3 lg:hidden">
          {[1,2,3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 animate-pulse">
              <div className="flex justify-between mb-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-20" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map((j) => <div key={j} className="h-8 bg-slate-100 dark:bg-slate-800 rounded" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile cards */}
      {!loading && (
        <div className="lg:hidden space-y-3">
          {rows.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">
              No maintenance requests match your search.
            </div>
          ) : rows.map((r) => (
            <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">#{r.id}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Unit {r.unit_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  <button onClick={() => setEditRequest(r)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => setDelRequest(r)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{r.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <Pill label="Category" value={r.category} />
                <Pill label="Priority" value={r.priority} />
                <Pill label="Tenant" value={`T${r.tenant_id}`} />
              </div>
              <div className="pt-3 border-t border-slate-50 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                {r.assigned_to ? `Assigned to ${r.assigned_to}` : "Unassigned"}
              </div>
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
                {["ID", "Unit", "Tenant", "Category", "Priority", "Status", "Description", "Assigned To", ""].map((c, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">
                    No maintenance requests match your search.
                  </td>
                </tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">{r.id}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-400">{r.unit_id}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-400">T{r.tenant_id}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-400">{r.category}</td>
                  <td className="px-4 py-3.5"><PriorityBadge priority={r.priority} /></td>
                  <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">{r.description}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-400">{r.assigned_to || "—"}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditRequest(r)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                        <Edit size={13} />
                      </button>
                      <button onClick={() => setDelRequest(r)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Table footer: counts */}
          {rows.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Showing {rows.length} of {requests.length} requests
              </span>
              <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                <span><span className="font-bold text-amber-600">{requests.filter(r => r.status === "Open").length}</span> open</span>
                <span><span className="font-bold text-blue-600">{requests.filter(r => r.status === "In Progress").length}</span> in progress</span>
                <span><span className="font-bold text-emerald-600">{requests.filter(r => r.status === "Resolved").length}</span> resolved</span>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ── Add Request Modal ──────────────────────────────────────────────────── */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100]">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-center pt-3 sm:hidden">
              <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Add New Request</h2>
              <button onClick={() => { setAddOpen(false); setForm(EMPTY_FORM); }} className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-4">
              {([
                { label: "Unit ID", key: "unit_id", type: "number", ph: "e.g. 101" },
                { label: "Tenant ID", key: "tenant_id", type: "number", ph: "e.g. 1" },
              ] as const).map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.ph}
                    className={inputCls}
                  />
                </div>
              ))}
              {([
                { label: "Category", key: "category", opts: [["Plumbing","Plumbing"],["Electrical","Electrical"],["HVAC","HVAC"],["Appliance","Appliance"],["Other","Other"]] },
                { label: "Priority", key: "priority", opts: [["Low","Low"],["Medium","Medium"],["High","High"],["Emergency","Emergency"]] },
              ] as const).map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
                  <select value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={inputCls}>
                    {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the maintenance issue…"
                  rows={3}
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Assigned To (Optional)</label>
                <input
                  type="text"
                  value={form.assigned_to}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  placeholder="Technician name"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button onClick={() => { setAddOpen(false); setForm(EMPTY_FORM); }} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.unit_id || !form.tenant_id || !form.description}
                className="flex-1 py-3 bg-emerald-600 rounded-xl text-sm font-semibold text-white hover:bg-emerald-700 flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Request Modal ──────────────────────────────────────────────────── */}
      {editRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100]">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-center pt-3 sm:hidden">
              <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Edit Request #{editRequest.id}</h2>
              <button onClick={() => setEditRequest(null)} className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-4">
              {([
                { label: "Unit ID", key: "unit_id", type: "number", ph: "e.g. 101" },
                { label: "Tenant ID", key: "tenant_id", type: "number", ph: "e.g. 1" },
              ] as const).map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key] || (editRequest[f.key as keyof MaintenanceRequest]?.toString() ?? "")}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.ph}
                    className={inputCls}
                  />
                </div>
              ))}
              {([
                { label: "Category", key: "category", opts: [["Plumbing","Plumbing"],["Electrical","Electrical"],["HVAC","HVAC"],["Appliance","Appliance"],["Other","Other"]] },
                { label: "Priority", key: "priority", opts: [["Low","Low"],["Medium","Medium"],["High","High"],["Emergency","Emergency"]] },
                { label: "Status", key: "status", opts: [["Open","Open"],["In Progress","In Progress"],["Resolved","Resolved"]] },
              ] as const).map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
                  <select 
                    value={form[f.key] || (editRequest[f.key as keyof MaintenanceRequest]?.toString() ?? "")} 
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} 
                    className={inputCls}
                  >
                    {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <textarea
                  value={form.description || editRequest.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the maintenance issue…"
                  rows={3}
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Assigned To (Optional)</label>
                <input
                  type="text"
                  value={form.assigned_to || editRequest.assigned_to || ""}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  placeholder="Technician name"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button onClick={() => setEditRequest(null)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button
                onClick={() => handleUpdate(editRequest.id, form)}
                disabled={saving}
                className="flex-1 py-3 bg-emerald-600 rounded-xl text-sm font-semibold text-white hover:bg-emerald-700 flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ────────────────────────────────────────────────── */}
      {delRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] px-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Delete Request #{delRequest.id}?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-medium">Unit {delRequest.unit_id}</span> — <span className="truncate">{delRequest.description}</span>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDelRequest(null)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(delRequest.id)}
                disabled={saving}
                className="flex-1 py-3 bg-red-600 rounded-xl text-sm font-semibold text-white hover:bg-red-700 flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
