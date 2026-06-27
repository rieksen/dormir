/**
 * TenantsPage — wired to FastAPI backend
 *
 * Drop into src/app/pages/TenantsPage.tsx
 * Import in App.tsx:  import TenantsPage from "./pages/TenantsPage";
 *
 * Requires VITE_API_URL in .env  (e.g. http://localhost:8000)
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Plus, Eye, Edit, Trash2, X, Check,
  Loader2, AlertCircle, Mail, Phone, FileText,
} from "lucide-react";

import { apiFetch } from "../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Tenant {
  id: number;
  name: string;
  email: string;
  phone: string;
  unit: string;
  lease_status: "Active" | "Expiring" | "Expired";
  move_in: string;
}

interface TenantFormData {
  name: string;
  email: string;
  phone: string;
  unit: string;
  lease_status: string;
  move_in: string;
}

const EMPTY_FORM: TenantFormData = {
  name: "", email: "", phone: "", unit: "", lease_status: "Active", move_in: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-emerald-500", "bg-blue-500", "bg-violet-500",
  "bg-amber-500",   "bg-pink-500", "bg-teal-500",
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const ini = initials(name);
  const color = AVATAR_COLORS[ini.charCodeAt(0) % AVATAR_COLORS.length];
  const sz = size === "lg" ? "w-12 h-12 text-base" : size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {ini}
    </div>
  );
}

const LEASE_STATUS_STYLES: Record<string, string> = {
  Active:   "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-700/50",
  Expiring: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-700/50",
  Expired:  "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
};

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${LEASE_STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"}`}>
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

// ── Tenant Profile Drawer ──────────────────────────────────────────────────────

function ProfileDrawer({
  tenant,
  onClose,
  onEdit,
  onDelete,
}: {
  tenant: Tenant;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[90]" onClick={onClose} />
      <div className="fixed inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-96 bg-white dark:bg-slate-900 shadow-2xl z-[100] flex flex-col border-l border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Tenant Profile</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Identity */}
          <div className="flex flex-col items-center text-center px-5 py-6 border-b border-slate-100 dark:border-slate-800">
            <Avatar name={tenant.name} size="lg" />
            <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">{tenant.name}</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5 mb-2">Since {tenant.move_in}</p>
            <Badge status={tenant.lease_status} />
          </div>

          <div className="px-5 py-5 space-y-4">
            {/* Contact */}
            {[
              { Icon: Mail,  value: tenant.email },
              { Icon: Phone, value: tenant.phone },
            ].map(({ Icon, value }) => (
              <div key={value} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                  <Icon size={14} className="text-slate-500 dark:text-slate-400" />
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300 break-all">{value}</span>
              </div>
            ))}

            {/* Unit summary */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                  Unit #{tenant.unit}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200">
                  Occupied
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Move-in date: {tenant.move_in}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button
            onClick={onDelete}
            className="py-3 px-4 border border-red-200 dark:border-red-800 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onEdit}
            className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Edit size={14} />Edit
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-emerald-600 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 hover:bg-emerald-700"
          >
            <FileText size={14} />View Lease
          </button>
        </div>
      </div>
    </>
  );
}

// ── Add / Edit Modal ───────────────────────────────────────────────────────────

function TenantModal({
  title,
  form,
  setForm,
  onClose,
  onSave,
  saving,
}: {
  title: string;
  form: TenantFormData;
  setForm: React.Dispatch<React.SetStateAction<TenantFormData>>;
  onClose: () => void;
  onSave: () => Promise<void>;
  saving: boolean;
}) {
  const fields: { label: string; key: keyof TenantFormData; type: string; ph: string }[] = [
    { label: "Full Name",  key: "name",     type: "text",  ph: "e.g. James Porter" },
    { label: "Email",      key: "email",    type: "email", ph: "tenant@email.com"  },
    { label: "Phone",      key: "phone",    type: "text",  ph: "(256) 700-000000"  },
    { label: "Unit #",     key: "unit",     type: "text",  ph: "e.g. 301"          },
    { label: "Move-in Date", key: "move_in", type: "text", ph: "e.g. Jun 25, 2026" },
  ];

  const canSave = form.name && form.email && form.unit && form.move_in;

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
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.ph}
                className={inputCls}
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Lease Status</label>
            <select
              value={form.lease_status}
              onChange={(e) => setForm((prev) => ({ ...prev, lease_status: e.target.value }))}
              className={inputCls}
            >
              {["Active", "Expiring", "Expired"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
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
            Save Tenant
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────

function DeleteModal({
  tenant,
  onClose,
  onConfirm,
  saving,
}: {
  tenant: Tenant;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
          <Trash2 size={20} className="text-red-600" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Remove {tenant.name}?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          This will permanently remove the tenant from Unit #{tenant.unit}. This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="flex-1 py-3 bg-red-600 rounded-xl text-sm font-semibold text-white hover:bg-red-700 flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [saving,  setSaving]  = useState(false);

  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("All");

  // panel / modal state
  const [profileTenant, setProfileTenant] = useState<Tenant | null>(null);
  const [addOpen,        setAddOpen]       = useState(false);
  const [editTenant,     setEditTenant]    = useState<Tenant | null>(null);
  const [delTenant,      setDelTenant]     = useState<Tenant | null>(null);

  const [form, setForm] = useState<TenantFormData>(EMPTY_FORM);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Tenant[]>("/tenants/");
      setTenants(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    setSaving(true);
    try {
      const created = await apiFetch<Tenant>("/tenants/", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setTenants((prev) => [...prev, created]);
      setAddOpen(false);
      setForm(EMPTY_FORM);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add tenant");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editTenant) return;
    setSaving(true);
    try {
      const updated = await apiFetch<Tenant>(`/tenants/${editTenant.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setTenants((prev) => prev.map((t) => (t.id === editTenant.id ? updated : t)));
      // also refresh profile drawer if open
      if (profileTenant?.id === editTenant.id) setProfileTenant(updated);
      setEditTenant(null);
      setForm(EMPTY_FORM);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update tenant");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!delTenant) return;
    setSaving(true);
    try {
      await apiFetch(`/tenants/${delTenant.id}`, { method: "DELETE" });
      setTenants((prev) => prev.filter((t) => t.id !== delTenant.id));
      if (profileTenant?.id === delTenant.id) setProfileTenant(null);
      setDelTenant(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to remove tenant");
    } finally {
      setSaving(false);
    }
  };

  // open edit modal pre-populated
  const openEdit = (tenant: Tenant) => {
    setForm({
      name:         tenant.name,
      email:        tenant.email,
      phone:        tenant.phone,
      unit:         tenant.unit,
      lease_status: tenant.lease_status,
      move_in:      tenant.move_in,
    });
    setProfileTenant(null);
    setEditTenant(tenant);
  };

  // ── Filter ───────────────────────────────────────────────────────────────────

  const rows = tenants.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = search === "" || t.name.toLowerCase().includes(q) || t.unit.includes(q) || t.email.toLowerCase().includes(q);
    const matchFilter = filter === "All" || t.lease_status === filter;
    return matchSearch && matchFilter;
  });

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Tenants</h1>
        <button
          onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-3 py-2 text-xs active:scale-95 transition-all"
        >
          <Plus size={14} />Add Tenant
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

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, unit, or email…"
          className="w-full pl-9 pr-3 py-2.5 bg-slate-100 dark:bg-slate-800 border-0 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 min-h-[44px]"
        />
      </div>

      {/* Lease status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {["All", "Active", "Expiring", "Expired"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 min-h-[36px] ${filter === s ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
          >
            {s}
            {s !== "All" && (
              <span className="ml-1.5 opacity-70">
                {tenants.filter((t) => t.lease_status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-48" />
                </div>
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((j) => <div key={j} className="h-8 bg-slate-100 dark:bg-slate-800 rounded" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile cards */}
      {!loading && (
        <div className="lg:hidden space-y-3">
          {rows.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">No tenants match your search.</div>
          ) : rows.map((t) => (
            <button
              key={t.id}
              onClick={() => setProfileTenant(t)}
              className="w-full text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={t.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{t.email}</p>
                </div>
                <Badge status={t.lease_status} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Pill label="Unit"  value={`#${t.unit}`} />
                <Pill label="Phone" value={t.phone.slice(-8)} />
                <Pill label="Since" value={t.move_in.split(",")[0]} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Desktop table */}
      {!loading && (
        <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                {["Tenant", "Phone", "Email", "Unit", "Status", "Move-in", ""].map((c, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">No tenants match your search.</td>
                </tr>
              ) : rows.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={t.name} />
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">{t.phone}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">{t.email}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-bold font-mono">#{t.unit}</span>
                  </td>
                  <td className="px-4 py-3.5"><Badge status={t.lease_status} /></td>
                  <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">{t.move_in}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setProfileTenant(t)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                        <Eye size={13} />
                      </button>
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                        <Edit size={13} />
                      </button>
                      <button onClick={() => setDelTenant(t)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500">
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
                Showing {rows.length} of {tenants.length} tenants
              </span>
              <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                <span><span className="font-bold text-emerald-600">{tenants.filter(t => t.lease_status === "Active").length}</span> active</span>
                <span><span className="font-bold text-amber-600">{tenants.filter(t => t.lease_status === "Expiring").length}</span> expiring</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Profile Drawer ────────────────────────────────────────────────────── */}
      {profileTenant && (
        <ProfileDrawer
          tenant={profileTenant}
          onClose={() => setProfileTenant(null)}
          onEdit={() => openEdit(profileTenant)}
          onDelete={() => { setDelTenant(profileTenant); setProfileTenant(null); }}
        />
      )}

      {/* ── Add Modal ─────────────────────────────────────────────────────────── */}
      {addOpen && (
        <TenantModal
          title="Add New Tenant"
          form={form}
          setForm={setForm}
          onClose={() => { setAddOpen(false); setForm(EMPTY_FORM); }}
          onSave={handleCreate}
          saving={saving}
        />
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────────── */}
      {editTenant && (
        <TenantModal
          title={`Edit — ${editTenant.name}`}
          form={form}
          setForm={setForm}
          onClose={() => { setEditTenant(null); setForm(EMPTY_FORM); }}
          onSave={handleUpdate}
          saving={saving}
        />
      )}

      {/* ── Delete Confirm ────────────────────────────────────────────────────── */}
      {delTenant && (
        <DeleteModal
          tenant={delTenant}
          onClose={() => setDelTenant(null)}
          onConfirm={handleDelete}
          saving={saving}
        />
      )}
    </div>
  );
}
