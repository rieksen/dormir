/**
 * UnitsPage — wired to FastAPI backend
 *
 * Drop this file into src/app/pages/UnitsPage.tsx and import it in App.tsx:
 *   import UnitsPage from "./pages/UnitsPage";
 *
 * Set VITE_API_URL in your .env:
 *   VITE_API_URL=http://localhost:8000
 *
 * The component replaces the static unitsData array with real API calls.
 * All existing UI (mobile cards, desktop table, add modal) is preserved.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Plus, Download, Eye, Edit, Trash2, X, Check, Loader2, AlertCircle,
} from "lucide-react";

import { apiFetch } from "../lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface Unit {
  id: number;
  number: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  status: "Occupied" | "Vacant" | "Maintenance";
  tenant: string | null;
}

interface UnitFormData {
  number: string;
  floor: string;
  bedrooms: string;
  bathrooms: string;
  rent: string;
  status: string;
}

const EMPTY_FORM: UnitFormData = {
  number: "",
  floor: "",
  bedrooms: "1",
  bathrooms: "1",
  rent: "",
  status: "Vacant",
};

// ── Primitive UI (mirrors App.tsx helpers so no import needed) ────────────────

const STATUS_STYLES: Record<string, string> = {
  Occupied:    "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-700/50",
  Vacant:      "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-700/50",
  Maintenance: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-700/50",
};

const AVATAR_COLORS = [
  "bg-emerald-500", "bg-blue-500", "bg-violet-500",
  "bg-amber-500",   "bg-pink-500", "bg-teal-500",
];

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}>
      {status}
    </span>
  );
}

function Avatar({ initials }: { initials: string }) {
  const color = AVATAR_COLORS[initials.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`w-7 h-7 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {initials}
    </div>
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

const formatCurrency = (v: number) => `UGX ${v.toLocaleString()}`;

function tenantInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("");
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditUnitModal({
  unit,
  onClose,
  onSave,
  saving,
}: {
  unit: Unit;
  onClose: () => void;
  onSave: (id: number, data: Partial<UnitFormData>) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState<UnitFormData>({
    number:    unit.number,
    floor:     String(unit.floor),
    bedrooms:  String(unit.bedrooms),
    bathrooms: String(unit.bathrooms),
    rent:      String(unit.rent),
    status:    unit.status,
  });

  const inputCls = "w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 min-h-[44px]";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100]">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Edit Unit #{unit.number}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          {([
            { label: "Unit #",  key: "number",    type: "text",   ph: "e.g. 501" },
            { label: "Floor",   key: "floor",     type: "number", ph: "e.g. 5"   },
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
            { label: "Bedrooms",  key: "bedrooms",  opts: [["0","Studio"],["1","1 Bed"],["2","2 Bed"],["3","3 Bed"]] },
            { label: "Bathrooms", key: "bathrooms", opts: [["1","1 Bath"],["2","2 Bath"],["3","3 Bath"]] },
            { label: "Status",    key: "status",    opts: [["Vacant","Vacant"],["Occupied","Occupied"],["Maintenance","Maintenance"]] },
          ] as const).map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
              <select value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={inputCls}>
                {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Rent (UGX/mo)</label>
            <input
              type="number"
              value={form.rent}
              onChange={(e) => setForm({ ...form, rent: e.target.value })}
              placeholder="e.g. 2400"
              className={inputCls}
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button
            onClick={() => onSave(unit.id, form)}
            disabled={saving}
            className="flex-1 py-3 bg-emerald-600 rounded-xl text-sm font-semibold text-white hover:bg-emerald-700 flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UnitsPage() {
  const [units,   setUnits]   = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [saving,  setSaving]  = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  // modals
  const [addOpen,  setAddOpen]  = useState(false);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [delUnit,  setDelUnit]  = useState<Unit | null>(null);

  const [form, setForm] = useState<UnitFormData>(EMPTY_FORM);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Unit[]>("/units/");
      setUnits(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load units");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.number || !form.floor || !form.rent) return;
    setSaving(true);
    try {
      const created = await apiFetch<Unit>("/units/", {
        method: "POST",
        body: JSON.stringify({
          number:    form.number,
          floor:     Number(form.floor),
          bedrooms:  Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
          rent:      Number(form.rent),
          status:    form.status,
        }),
      });
      setUnits((prev) => [...prev, created]);
      setAddOpen(false);
      setForm(EMPTY_FORM);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create unit");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number, data: Partial<UnitFormData>) => {
    setSaving(true);
    try {
      const updated = await apiFetch<Unit>(`/units/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          number:    data.number,
          floor:     data.floor !== undefined ? Number(data.floor) : undefined,
          bedrooms:  data.bedrooms !== undefined ? Number(data.bedrooms) : undefined,
          bathrooms: data.bathrooms !== undefined ? Number(data.bathrooms) : undefined,
          rent:      data.rent !== undefined ? Number(data.rent) : undefined,
          status:    data.status,
        }),
      });
      setUnits((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setEditUnit(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update unit");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setSaving(true);
    try {
      await apiFetch(`/units/${id}`, { method: "DELETE" });
      setUnits((prev) => prev.filter((u) => u.id !== id));
      setDelUnit(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete unit");
    } finally {
      setSaving(false);
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────

  const rows = units.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = search === "" || u.number.includes(search) || (u.tenant ?? "").toLowerCase().includes(q);
    const matchFilter = filter === "All" || u.status === filter;
    return matchSearch && matchFilter;
  });

  // ── Shared input style ─────────────────────────────────────────────────────

  const inputCls = "w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 min-h-[44px]";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Units</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const csv = ["id,number,floor,bedrooms,bathrooms,rent,status,tenant",
                ...units.map((u) => `${u.id},${u.number},${u.floor},${u.bedrooms},${u.bathrooms},${u.rent},${u.status},${u.tenant ?? ""}`)
              ].join("\n");
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
              a.download = "units.csv";
              a.click();
            }}
            className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
          >
            <Download size={13} />Export
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-3 py-2 text-xs active:scale-95 transition-all"
          >
            <Plus size={14} />Add Unit
          </button>
        </div>
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
          placeholder="Search units or tenants…"
          className="w-full pl-9 pr-3 py-2.5 bg-slate-100 dark:bg-slate-800 border-0 rounded-2xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
        />
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {["All", "Occupied", "Vacant", "Maintenance"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 min-h-[36px] ${filter === s ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
          >
            {s}
            {s !== "All" && (
              <span className="ml-1.5 opacity-70">
                {units.filter((u) => u.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 lg:hidden">
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
              No units match your search.
            </div>
          ) : rows.map((u) => (
            <div key={u.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">#{u.number}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Floor {u.floor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={u.status} />
                  <button onClick={() => setEditUnit(u)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => setDelUnit(u)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <Pill label="Size" value={u.bedrooms === 0 ? "Studio" : `${u.bedrooms}BR`} />
                <Pill label="Rent" value={formatCurrency(u.rent)} />
                <Pill label="Baths" value={`${u.bathrooms}BA`} />
              </div>
              {u.tenant && (
                <div className="flex items-center gap-2.5 pt-3 border-t border-slate-50 dark:border-slate-800">
                  <Avatar initials={tenantInitials(u.tenant)} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1 truncate">{u.tenant}</span>
                </div>
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
                {["Unit #", "Floor", "Size", "Rent", "Status", "Tenant", ""].map((c, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">
                    No units match your search.
                  </td>
                </tr>
              ) : rows.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">{u.number}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">Floor {u.floor}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-400">{u.bedrooms === 0 ? "Studio" : `${u.bedrooms}BR/${u.bathrooms}BA`}</td>
                  <td className="px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(u.rent)}<span className="text-xs text-slate-400 dark:text-slate-500 font-normal">/mo</span>
                  </td>
                  <td className="px-4 py-3.5"><Badge status={u.status} /></td>
                  <td className="px-4 py-3.5">
                    {u.tenant ? (
                      <div className="flex items-center gap-2">
                        <Avatar initials={tenantInitials(u.tenant)} />
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{u.tenant}</span>
                      </div>
                    ) : <span className="text-sm text-slate-300 dark:text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditUnit(u)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                        <Eye size={13} />
                      </button>
                      <button onClick={() => setEditUnit(u)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                        <Edit size={13} />
                      </button>
                      <button onClick={() => setDelUnit(u)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500">
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
                Showing {rows.length} of {units.length} units
              </span>
              <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                <span><span className="font-bold text-emerald-600">{units.filter(u => u.status === "Occupied").length}</span> occupied</span>
                <span><span className="font-bold text-amber-600">{units.filter(u => u.status === "Vacant").length}</span> vacant</span>
                <span><span className="font-bold text-red-600">{units.filter(u => u.status === "Maintenance").length}</span> maintenance</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add Unit Modal ───────────────────────────────────────────────────── */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100]">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-center pt-3 sm:hidden">
              <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Add New Unit</h2>
              <button onClick={() => { setAddOpen(false); setForm(EMPTY_FORM); }} className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-4">
              {([
                { label: "Unit #", key: "number", type: "text",   ph: "e.g. 501" },
                { label: "Floor",  key: "floor",  type: "number", ph: "e.g. 5"   },
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
                { label: "Bedrooms",  key: "bedrooms",  opts: [["0","Studio"],["1","1 Bed"],["2","2 Bed"],["3","3 Bed"]] },
                { label: "Bathrooms", key: "bathrooms", opts: [["1","1 Bath"],["2","2 Bath"],["3","3 Bath"]] },
                { label: "Status",    key: "status",    opts: [["Vacant","Vacant"],["Occupied","Occupied"],["Maintenance","Maintenance"]] },
              ] as const).map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
                  <select value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={inputCls}>
                    {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Rent (UGX/mo)</label>
                <input
                  type="number"
                  value={form.rent}
                  onChange={(e) => setForm({ ...form, rent: e.target.value })}
                  placeholder="e.g. 2400"
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
                disabled={saving || !form.number || !form.floor || !form.rent}
                className="flex-1 py-3 bg-emerald-600 rounded-xl text-sm font-semibold text-white hover:bg-emerald-700 flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      {editUnit && (
        <EditUnitModal
          unit={editUnit}
          onClose={() => setEditUnit(null)}
          onSave={handleUpdate}
          saving={saving}
        />
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
      {delUnit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] px-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Delete Unit #{delUnit.number}?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              This will permanently remove the unit
              {delUnit.tenant ? ` and its link to ${delUnit.tenant}` : ""}.
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDelUnit(null)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(delUnit.id)}
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