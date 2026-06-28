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

import { apiFetch } from "../lib/api";

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

// ── Status Badge Colors ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30",
  "In Progress": "bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary border border-primary/20 dark:border-primary/30",
  Resolved: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30",
};

const PRIORITY_STYLES: Record<string, string> = {
  Low: "bg-muted dark:bg-muted text-muted-foreground border border-border",
  Medium: "bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary border border-primary/20 dark:border-primary/30",
  High: "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border border-orange-200/50 dark:border-orange-800/30",
  Emergency: "bg-destructive/5 dark:bg-destructive/10 text-destructive dark:text-destructive border border-destructive/20 dark:border-destructive/30",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border border-border"}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${PRIORITY_STYLES[priority] ?? "bg-muted text-muted-foreground border border-border"}`}>
      {priority}
    </span>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-xs font-semibold text-foreground">{value}</p>
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

  const inputCls = "w-full px-3.5 py-2.5 bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Maintenance Requests</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg px-4 py-2.5 text-sm shadow-sm active:scale-[0.98] transition-all"
        >
          <Plus size={16} />
          Add Request
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-destructive/5 border border-destructive/20 rounded-lg text-destructive text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="flex-shrink-0 hover:opacity-70 transition-opacity">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by unit, tenant, category, or description…"
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
        />
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {["All", "Open", "In Progress", "Resolved"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filter === s 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s}
            {s !== "All" && (
              <span className="ml-2 opacity-80">
                {requests.filter((r) => r.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div data-testid="loading-skeleton" className="space-y-4 lg:hidden">
          {[1,2,3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
              <div className="flex justify-between mb-3">
                <div className="h-5 bg-muted rounded w-20" />
                <div className="h-6 bg-muted rounded w-24" />
              </div>
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-2/3 mb-4" />
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map((j) => <div key={j} className="h-10 bg-muted rounded" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile cards */}
      {!loading && (
        <div className="lg:hidden space-y-3">
          {rows.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 bg-muted rounded-lg mx-auto mb-3 flex items-center justify-center">
                <AlertCircle size={24} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No requests found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : rows.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-foreground font-mono">#{r.id}</span>
                  <span className="text-xs text-muted-foreground">Unit {r.unit_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  <button 
                    onClick={() => setEditRequest(r)} 
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => setDelRequest(r)} 
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Pill label="Category" value={r.category} />
                <Pill label="Priority" value={r.priority} />
                <Pill label="Tenant" value={`T${r.tenant_id}`} />
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {r.assigned_to ? `Assigned to ${r.assigned_to}` : "Unassigned"}
                </span>
                <PriorityBadge priority={r.priority} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop table */}
      {!loading && (
        <div className="hidden lg:block bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["ID", "Unit", "Tenant", "Category", "Priority", "Status", "Description", "Assigned To", ""].map((c, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 px-4">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-muted rounded-lg mb-3 flex items-center justify-center">
                        <AlertCircle size={24} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">No requests found</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-3.5 font-semibold text-foreground font-mono text-sm">{r.id}</td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground">{r.unit_id}</td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground">T{r.tenant_id}</td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground">{r.category}</td>
                  <td className="px-4 py-3.5"><PriorityBadge priority={r.priority} /></td>
                  <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground max-w-xs truncate">{r.description}</td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground">{r.assigned_to || "—"}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditRequest(r)} 
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => setDelRequest(r)} 
                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Table footer: counts */}
          {rows.length > 0 && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Showing {rows.length} of {requests.length} requests
              </span>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">
                  <span className="font-semibold text-amber-600 dark:text-amber-500">{requests.filter(r => r.status === "Open").length}</span> open
                </span>
                <span className="text-muted-foreground">
                  <span className="font-semibold text-primary">{requests.filter(r => r.status === "In Progress").length}</span> in progress
                </span>
                <span className="text-muted-foreground">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-500">{requests.filter(r => r.status === "Resolved").length}</span> resolved
                </span>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ── Add Request Modal ──────────────────────────────────────────────────── */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100]">
          <div className="bg-card border border-border w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-center pt-3 sm:hidden">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Add New Request</h2>
              <button 
                onClick={() => { setAddOpen(false); setForm(EMPTY_FORM); }} 
                className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              {([
                { label: "Unit ID", key: "unit_id", type: "number", ph: "e.g. 101" },
                { label: "Tenant ID", key: "tenant_id", type: "number", ph: "e.g. 1" },
              ] as const).map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-foreground mb-2">{f.label}</label>
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
                  <label className="block text-sm font-medium text-foreground mb-2">{f.label}</label>
                  <select value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={inputCls}>
                    {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the maintenance issue…"
                  rows={3}
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Assigned To (Optional)</label>
                <input
                  type="text"
                  value={form.assigned_to}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  placeholder="Technician name"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3 bg-muted/30">
              <button 
                onClick={() => { setAddOpen(false); setForm(EMPTY_FORM); }} 
                className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.unit_id || !form.tenant_id || !form.description}
                className="flex-1 py-2.5 bg-primary rounded-lg text-sm font-medium text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Save Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Request Modal ──────────────────────────────────────────────────── */}
      {editRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100]">
          <div className="bg-card border border-border w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-center pt-3 sm:hidden">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Edit Request #{editRequest.id}</h2>
              <button 
                onClick={() => setEditRequest(null)} 
                className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              {([
                { label: "Unit ID", key: "unit_id", type: "number", ph: "e.g. 101" },
                { label: "Tenant ID", key: "tenant_id", type: "number", ph: "e.g. 1" },
              ] as const).map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-foreground mb-2">{f.label}</label>
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
                  <label className="block text-sm font-medium text-foreground mb-2">{f.label}</label>
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
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  value={form.description || editRequest.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the maintenance issue…"
                  rows={3}
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Assigned To (Optional)</label>
                <input
                  type="text"
                  value={form.assigned_to || editRequest.assigned_to || ""}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  placeholder="Technician name"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3 bg-muted/30">
              <button 
                onClick={() => setEditRequest(null)} 
                className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdate(editRequest.id, form)}
                disabled={saving}
                className="flex-1 py-2.5 bg-primary rounded-lg text-sm font-medium text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm transition-all"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ────────────────────────────────────────────────── */}
      {delRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
              <Trash2 size={22} className="text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Request #{delRequest.id}?</h3>
            <div className="text-sm text-muted-foreground mb-2">
              <span className="font-medium text-foreground">Unit {delRequest.unit_id}</span> — {delRequest.description.substring(0, 60)}{delRequest.description.length > 60 ? '...' : ''}
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDelRequest(null)} 
                className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(delRequest.id)}
                disabled={saving}
                className="flex-1 py-2.5 bg-destructive rounded-lg text-sm font-medium text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm transition-all"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
