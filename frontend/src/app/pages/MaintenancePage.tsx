/**
 * MaintenancePage — maintenance requests table
 * Dashboard Flaws principles: status pills, priority dots, monospace IDs, hairline grid
 */

import React, { useState, useEffect, useCallback } from "react";
import { Search, Plus, Edit, Trash2, X, Check, Loader2, AlertCircle, Wrench, Hash } from "lucide-react";
import { apiFetch } from "../lib/api";

interface MaintenanceRequest {
  id: number; unit_id: number; tenant_id: number;
  category: "Plumbing" | "Electrical" | "HVAC" | "Appliance" | "Other";
  priority: "Low" | "Medium" | "High" | "Emergency";
  status: "Open" | "In Progress" | "Resolved";
  description: string; submitted_date: string;
  resolved_date: string | null; assigned_to: string | null;
}
interface FormData { unit_id: string; tenant_id: string; category: string; priority: string; status: string; description: string; assigned_to: string; }
const EMPTY: FormData = { unit_id: "", tenant_id: "", category: "Plumbing", priority: "Medium", status: "Open", description: "", assigned_to: "" };

const PRIORITY_DOT: Record<string, string> = { Low: "bg-[#808080]", Medium: "bg-[#3280fa]", High: "bg-amber-500", Emergency: "bg-red-500" };
const STATUS_PILL: Record<string, { bg: string; text: string; dot: string }> = {
  "Open":        { bg: "bg-[rgba(245,158,11,0.1)]",  text: "text-amber-400",   dot: "bg-amber-500"  },
  "In Progress": { bg: "bg-[rgba(47,168,114,0.1)]",  text: "text-[#2fa872]",  dot: "bg-[#2fa872]"  },
  "Resolved":    { bg: "bg-[rgba(148,163,184,0.1)]", text: "text-[#808080]",  dot: "bg-[#808080]"  },
};

const INPUT = "w-full px-3 py-2 bg-[#0e120e] border border-[#272b27] rounded-lg text-[13px] text-[#f0f0f0] placeholder-[#808080] focus:outline-none focus:ring-1 focus:ring-[#2fa872] focus:border-[#2fa872] transition-colors";
const LABEL = "block text-[11px] font-semibold text-[#808080] uppercase tracking-wide mb-1";

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("All");
  const [addOpen, setAddOpen]   = useState(false);
  const [editReq, setEditReq]   = useState<MaintenanceRequest | null>(null);
  const [delReq, setDelReq]     = useState<MaintenanceRequest | null>(null);
  const [form, setForm]         = useState<FormData>(EMPTY);

  useEffect(() => { if (addOpen) setForm(EMPTY); }, [addOpen]);

  const fetchRequests = useCallback(async () => {
    setLoading(true); setError(null);
    try { setRequests(await apiFetch<MaintenanceRequest[]>("/maintenance/")); }
    catch (e: any) { setError(e.message ?? "Failed to load requests"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleCreate = async () => {
    if (!form.unit_id || !form.tenant_id || !form.description) return;
    setSaving(true);
    try {
      const r = await apiFetch<MaintenanceRequest>("/maintenance/", { method: "POST", body: JSON.stringify({ unit_id: Number(form.unit_id), tenant_id: Number(form.tenant_id), category: form.category, priority: form.priority, description: form.description, assigned_to: form.assigned_to || null }) });
      setRequests(prev => [...prev, r]); setAddOpen(false); setForm(EMPTY);
    } catch (e: any) { setError(e.message ?? "Failed to create"); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (id: number) => {
    setSaving(true);
    try {
      const r = await apiFetch<MaintenanceRequest>(`/maintenance/${id}`, { method: "PATCH", body: JSON.stringify({ unit_id: form.unit_id ? Number(form.unit_id) : undefined, tenant_id: form.tenant_id ? Number(form.tenant_id) : undefined, category: form.category || undefined, priority: form.priority || undefined, status: form.status || undefined, description: form.description || undefined, assigned_to: form.assigned_to || null }) });
      setRequests(prev => prev.map(x => x.id === id ? r : x)); setEditReq(null);
    } catch (e: any) { setError(e.message ?? "Failed to update"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    setSaving(true);
    try { await apiFetch(`/maintenance/${id}`, { method: "DELETE" }); setRequests(prev => prev.filter(r => r.id !== id)); setDelReq(null); }
    catch (e: any) { setError(e.message ?? "Failed to delete"); }
    finally { setSaving(false); }
  };

  const rows = requests.filter(r => {
    const q = search.toLowerCase();
    return (search === "" || r.unit_id.toString().includes(search) || r.description.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)) && (filter === "All" || r.status === filter);
  });

  if (loading) return <div className="flex flex-col items-center justify-center py-24 gap-3"><Loader2 size={24} className="text-[#2fa872] animate-spin" /><p className="text-xs text-[#808080]">Loading requests…</p></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold text-[#808080] uppercase tracking-[0.6px] mb-1">Operations</p>
          <h1 className="text-[22px] font-semibold text-[#f0f0f0] tracking-[-0.22px]">Maintenance</h1>
          <p className="text-[13px] text-[#808080] mt-0.5">Requests and repairs tracking</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 bg-[#f0f0f0] hover:bg-white text-[#0e120e] px-3 py-1.5 rounded-[6px] font-medium text-[11px] transition-colors">
          Add <Plus size={13} />
        </button>
      </div>

      {/* Error */}
      {error && <div className="flex items-center gap-2 px-4 py-3 bg-[rgba(220,38,38,0.08)] border border-[rgba(220,38,38,0.2)] rounded-lg text-red-400 text-[12px]"><AlertCircle size={14} className="flex-shrink-0" /><span className="flex-1">{error}</span><button onClick={() => setError(null)}><X size={13} /></button></div>}

      {/* Stats chips */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { label: "Open",        value: requests.filter(r => r.status === "Open").length },
          { label: "In Progress", value: requests.filter(r => r.status === "In Progress").length },
          { label: "Resolved",    value: requests.filter(r => r.status === "Resolved").length },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2.5 bg-[#141714] border border-[#212521] rounded-[10px] px-4 py-2.5">
            <span className="font-['Courier_Prime',monospace] text-[18px] text-[#f0f0f0]">{value}</span>
            <span className="text-[11px] text-[#808080] font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Filter + search */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center bg-[#141714] border border-[#212521] rounded-[8px] p-0.5">
          {["All", "Open", "In Progress", "Resolved"].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-[6px] text-[11px] font-semibold transition-all ${filter === s ? "bg-[#2fa872] text-white" : "text-[#808080] hover:text-[#f0f0f0]"}`}>{s}</button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Unit, category, description…" className="w-full pl-9 pr-3 py-2 bg-[#141714] border border-[#212521] rounded-lg text-[13px] text-[#f0f0f0] placeholder-[#808080] focus:outline-none focus:ring-1 focus:ring-[#2fa872] transition-colors" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#141714] border border-[#212521] rounded-t-[12px] overflow-hidden">
        <div className="grid grid-cols-[60px_60px_1fr_100px_100px_100px_120px_80px] border-b border-[#212521] bg-[#111511]">
          {["ID","Unit","Description","Category","Priority","Status","Assigned",""].map((col, i) => (
            <div key={i} className={`flex items-center gap-1.5 px-3 py-2.5 ${i > 0 ? "border-l border-[#212521]" : ""}`}>
              {col === "ID" && <Hash size={12} className="text-[#808080]" />}
              {col === "Description" && <Wrench size={12} className="text-[#808080]" />}
              {col && <span className="text-[11px] font-semibold text-[#f0f0f0]">{col}</span>}
            </div>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-[13px] text-[#808080]">No requests match your filters</div>
        ) : rows.map((r, idx) => {
          const pill = STATUS_PILL[r.status] ?? STATUS_PILL["Open"];
          return (
            <div key={r.id} className={`grid grid-cols-[60px_60px_1fr_100px_100px_100px_120px_80px] border-t border-[#1a1f1a] hover:bg-[#1a1f1a] transition-colors group ${idx % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : ""}`}>
              <div className="flex items-center px-3 py-2.5"><span className="font-['Courier_Prime',monospace] text-[12px] text-[#808080]">{r.id}</span></div>
              <div className="flex items-center px-3 py-2.5 border-l border-[#1e231e]"><span className="font-['Courier_Prime',monospace] text-[12px] text-[#f0f0f0]">{r.unit_id}</span></div>
              <div className="flex items-center px-3 py-2.5 border-l border-[#1e231e] min-w-0"><p className="text-[12px] text-[#c8c8c8] truncate">{r.description}</p></div>
              <div className="flex items-center px-3 py-2.5 border-l border-[#1e231e]"><span className="text-[11px] text-[#808080]">{r.category}</span></div>
              <div className="flex items-center px-3 py-2.5 border-l border-[#1e231e]">
                <div className="inline-flex items-center gap-1 border border-[#272b27] rounded-[14px] px-2 py-0.5">
                  <span className={`w-[5px] h-[5px] rounded-[1px] flex-shrink-0 ${PRIORITY_DOT[r.priority] ?? "bg-[#808080]"}`} />
                  <span className="text-[10px] font-semibold text-[#f0f0f0]">{r.priority}</span>
                </div>
              </div>
              <div className="flex items-center px-3 py-2.5 border-l border-[#1e231e]">
                <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${pill.bg}`}>
                  <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${pill.dot}`} />
                  <span className={`text-[11px] font-semibold ${pill.text}`}>{r.status}</span>
                </div>
              </div>
              <div className="flex items-center px-3 py-2.5 border-l border-[#1e231e]"><span className="text-[11px] text-[#808080] truncate">{r.assigned_to ?? "—"}</span></div>
              <div className="flex items-center justify-center gap-1 px-2 py-2.5 border-l border-[#1e231e] opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setForm({ unit_id: String(r.unit_id), tenant_id: String(r.tenant_id), category: r.category, priority: r.priority, status: r.status, description: r.description, assigned_to: r.assigned_to ?? "" }); setEditReq(r); }} className="p-1.5 hover:bg-[#1f381f] rounded transition-colors"><Edit size={12} className="text-[#808080] hover:text-[#2fa872]" /></button>
                <button onClick={() => setDelReq(r)} className="p-1.5 hover:bg-[rgba(220,38,38,0.1)] rounded transition-colors"><Trash2 size={12} className="text-[#808080] hover:text-red-400" /></button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-[#808080] px-1">{rows.length} of {requests.length} requests</p>

      {/* Add / Edit modal */}
      {(addOpen || editReq) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-[#0e120e] border border-[#272b27] rounded-[12px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0e120e] border-b border-[#212521] px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-[14px] font-semibold text-[#f0f0f0]">{editReq ? `Edit Request #${editReq.id}` : "Add Maintenance Request"}</h2>
              <button onClick={() => { setAddOpen(false); setEditReq(null); }} className="p-1.5 hover:bg-[#1a1f1a] rounded-lg"><X size={14} className="text-[#808080]" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3.5">
              <div><label className={LABEL}>Unit ID</label><input type="number" value={form.unit_id} onChange={e => setForm({...form, unit_id: e.target.value})} placeholder="e.g. 101" className={INPUT} /></div>
              <div><label className={LABEL}>Tenant ID</label><input type="number" value={form.tenant_id} onChange={e => setForm({...form, tenant_id: e.target.value})} placeholder="e.g. 1" className={INPUT} /></div>
              <div><label className={LABEL}>Category</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={INPUT}>{["Plumbing","Electrical","HVAC","Appliance","Other"].map(v => <option key={v}>{v}</option>)}</select></div>
              <div><label className={LABEL}>Priority</label><select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className={INPUT}>{["Low","Medium","High","Emergency"].map(v => <option key={v}>{v}</option>)}</select></div>
              {editReq && <div><label className={LABEL}>Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={INPUT}>{["Open","In Progress","Resolved"].map(v => <option key={v}>{v}</option>)}</select></div>}
              <div className="col-span-2"><label className={LABEL}>Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} placeholder="Describe the issue…" className={INPUT + " resize-none"} /></div>
              <div className="col-span-2"><label className={LABEL}>Assigned To (optional)</label><input type="text" value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})} placeholder="Technician name" className={INPUT} /></div>
            </div>
            <div className="sticky bottom-0 bg-[#0e120e] border-t border-[#212521] px-5 py-4 flex gap-2.5 z-10">
              <button onClick={() => { setAddOpen(false); setEditReq(null); }} className="flex-1 py-2.5 bg-[#1a1f1a] hover:bg-[#212521] text-[#c8c8c8] text-[12px] font-semibold rounded-[8px] transition-colors">Cancel</button>
              <button onClick={() => editReq ? handleUpdate(editReq.id) : handleCreate()} disabled={saving} className="flex-1 py-2.5 bg-[#2fa872] hover:bg-[#27a065] text-white text-[12px] font-semibold rounded-[8px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} {editReq ? "Save Changes" : "Save Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {delReq && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-[#0e120e] border border-[#272b27] rounded-[12px] shadow-2xl max-w-sm w-full p-5">
            <div className="w-10 h-10 bg-[rgba(220,38,38,0.1)] border border-[rgba(220,38,38,0.2)] rounded-[10px] flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-400" />
            </div>
            <h3 className="text-[14px] font-semibold text-[#f0f0f0] mb-1">Delete Request #{delReq.id}?</h3>
            <p className="text-[12px] text-[#808080] mb-5">Unit {delReq.unit_id} — {delReq.description.substring(0, 60)}{delReq.description.length > 60 ? "…" : ""}. This cannot be undone.</p>
            <div className="flex gap-2.5">
              <button onClick={() => setDelReq(null)} className="flex-1 py-2.5 bg-[#1a1f1a] text-[#c8c8c8] text-[12px] font-semibold rounded-[8px]">Cancel</button>
              <button onClick={() => handleDelete(delReq.id)} disabled={saving} className="flex-1 py-2.5 bg-[rgba(220,38,38,0.15)] border border-[rgba(220,38,38,0.3)] hover:bg-[rgba(220,38,38,0.25)] text-red-400 text-[12px] font-semibold rounded-[8px] flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}