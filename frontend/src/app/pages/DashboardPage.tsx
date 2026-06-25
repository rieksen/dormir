import React, { useMemo } from "react";
import {
  Building2, Home, Key, DollarSign, TrendingUp, Loader2, AlertCircle,
  FileText, Wrench, UserCircle, AlertTriangle,
} from "lucide-react";
import type { DashboardSummary } from "../lib/dashboardApi";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActivityItem {
  id: string;
  sortDate: number;
  Icon: React.ElementType;
  bg: string;
  ic: string;
  title: string;
  detail: string;
  time: string;
  page?: "payments" | "leases" | "maintenance" | "tenants";
}

type NavigatePage = "payments" | "leases" | "maintenance" | "tenants";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (v: number) => `UGX ${v.toLocaleString()}`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseAppDate(s: string): Date | null {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function buildRevenueByMonth(payments: DashboardSummary["payments"]["items"]) {
  const totals = new Map<string, number>();
  for (const p of payments) {
    if (p.status !== "Paid" || !p.paid) continue;
    const d = parseAppDate(p.paid);
    if (!d) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    totals.set(key, (totals.get(key) ?? 0) + p.amount);
  }

  const entries = [...totals.entries()]
    .map(([key, v]) => {
      const [y, m] = key.split("-").map(Number);
      return { year: y, month: m, v, label: `${MONTHS[m]} ${y}` };
    })
    .sort((a, b) => a.year - b.year || a.month - b.month);

  if (entries.length === 0) {
    return MONTHS.map(m => ({ month: m, v: 0 }));
  }

  return entries.slice(-12).map(e => ({ month: e.label, v: e.v }));
}

function buildActivityFeed(summary: DashboardSummary, unitMap: Map<number, string>): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const p of summary.payments.items) {
    if (p.status === "Paid" && p.paid) {
      const d = parseAppDate(p.paid);
      if (!d) continue;
      items.push({
        id: `pay-${p.id}`,
        sortDate: d.getTime(),
        Icon: DollarSign,
        bg: "bg-emerald-100",
        ic: "text-emerald-600",
        title: "Rent payment received",
        detail: `Unit ${p.unit} · ${p.tenant} · ${formatCurrency(p.amount)}`,
        time: relativeTime(d),
        page: "payments",
      });
    } else if (p.status === "Overdue") {
      const d = parseAppDate(p.due) ?? new Date(0);
      items.push({
        id: `overdue-${p.id}`,
        sortDate: d.getTime(),
        Icon: AlertTriangle,
        bg: "bg-amber-100",
        ic: "text-amber-600",
        title: "Payment overdue",
        detail: `Unit ${p.unit} · ${p.tenant} · ${formatCurrency(p.amount)}`,
        time: relativeTime(d),
        page: "payments",
      });
    }
  }

  for (const m of summary.maintenance.items) {
    if (m.status === "Resolved") continue;
    const d = parseAppDate(m.submitted_date);
    if (!d) continue;
    const unit = unitMap.get(m.unit_id) ?? `#${m.unit_id}`;
    items.push({
      id: `maint-${m.id}`,
      sortDate: d.getTime(),
      Icon: Wrench,
      bg: m.priority === "Emergency" || m.priority === "High" ? "bg-red-100" : "bg-blue-100",
      ic: m.priority === "Emergency" || m.priority === "High" ? "text-red-600" : "text-blue-600",
      title: "Maintenance request opened",
      detail: `Unit ${unit} · ${m.category} · ${m.priority}`,
      time: relativeTime(d),
      page: "maintenance",
    });
  }

  for (const l of summary.leases.items) {
    if (l.status !== "Expiring Soon") continue;
    const d = parseAppDate(l.end) ?? new Date(0);
    items.push({
      id: `lease-${l.id}`,
      sortDate: d.getTime(),
      Icon: FileText,
      bg: "bg-violet-100",
      ic: "text-violet-600",
      title: "Lease expiring soon",
      detail: `Unit ${l.unit} · ${l.tenant}`,
      time: relativeTime(d),
      page: "leases",
    });
  }

  for (const t of summary.tenants) {
    const d = parseAppDate(t.move_in);
    if (!d) continue;
    items.push({
      id: `tenant-${t.id}`,
      sortDate: d.getTime(),
      Icon: UserCircle,
      bg: "bg-violet-100",
      ic: "text-violet-600",
      title: "Tenant onboarded",
      detail: `${t.name} · Unit ${t.unit}`,
      time: relativeTime(d),
      page: "tenants",
    });
  }

  return items.sort((a, b) => b.sortDate - a.sortDate).slice(0, 8);
}

// ── Charts ────────────────────────────────────────────────────────────────────

function LineChart({ data }: { data: { month: string; v: number }[] }) {
  const max = Math.max(...data.map(d => d.v), 1);
  const min = Math.min(...data.map(d => d.v));
  const W = 400, H = 100, pad = 4;
  const x = (i: number) => pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
  const d = data.map((pt, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(pt.v).toFixed(1)}`).join(" ");
  const area = d + ` L${x(data.length - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`;

  if (data.every(pt => pt.v === 0)) {
    return (
      <div className="flex items-center justify-center h-[120px] text-xs text-slate-400 dark:text-slate-500">
        No paid revenue recorded yet
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }} preserveAspectRatio="none">
      <path d={area} fill="#16A34A" fillOpacity="0.1" />
      <path d={d} fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export interface DashboardPageProps {
  onNavigate?: (page: NavigatePage) => void;
  summary: DashboardSummary | null;
  loading?: boolean;
  error?: string | null;
  onReload?: () => void;
}

export default function DashboardPage({ onNavigate, summary, loading, error, onReload }: DashboardPageProps) {
  const unitMap = useMemo(
    () => new Map((summary?.units.items ?? []).map(u => [u.id, u.number])),
    [summary],
  );

  const totalUnits = summary?.units.total ?? 0;
  const occupied = summary?.units.occupied ?? 0;
  const vacant = summary?.units.vacant ?? 0;
  const inMaintenance = summary?.units.maintenance ?? 0;
  const occupancyPct = totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : 0;
  const alertCount = summary?.alert_count ?? 0;
  const collected = summary?.payments.collected ?? 0;

  const revenueData = useMemo(
    () => buildRevenueByMonth(summary?.payments.items ?? []),
    [summary],
  );
  const activityFeed = useMemo(
    () => (summary ? buildActivityFeed(summary, unitMap) : []),
    [summary, unitMap],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={28} className="text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading dashboard…</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle size={32} className="text-red-500" />
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-sm">
          {error ?? "Failed to load dashboard"}
        </p>
        {onReload && (
          <button
            onClick={onReload}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Units",
      value: String(totalUnits),
      sub: `${occupancyPct}% occupied`,
      Icon: Building2,
      ibg: "bg-slate-100 dark:bg-slate-800",
      ic: "text-slate-600 dark:text-slate-400",
    },
    {
      title: "Occupied",
      value: String(occupied),
      sub: `of ${totalUnits} units`,
      Icon: Home,
      ibg: "bg-emerald-100",
      ic: "text-emerald-600",
    },
    {
      title: "Vacant",
      value: String(vacant),
      sub: inMaintenance > 0 ? `${inMaintenance} in maintenance` : "available now",
      Icon: Key,
      ibg: "bg-amber-100",
      ic: "text-amber-600",
    },
    {
      title: "Revenue",
      value: formatCurrency(collected),
      sub: summary.payments.pending ? `${formatCurrency(summary.payments.pending)} pending` : "collected",
      Icon: DollarSign,
      ibg: "bg-blue-100",
      ic: "text-blue-600",
    },
  ];

  const occupancyRows = [
    { label: "Occupied", value: occupied, color: "bg-emerald-500" },
    { label: "Vacant", value: vacant, color: "bg-amber-400" },
    ...(inMaintenance > 0 ? [{ label: "Maintenance", value: inMaintenance, color: "bg-red-400" }] : []),
  ];

  const chartYear = new Date().getFullYear();

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white">
        <p className="text-xs font-semibold text-emerald-200 uppercase tracking-widest mb-1">{greeting()}</p>
        <h1 className="text-2xl font-bold">Taban Riak</h1>
        <p className="text-sm text-emerald-100 mt-1">Kasalita Inn · {totalUnits} units</p>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
          {[
            [formatCurrency(collected), "Collected"],
            [`${occupancyPct}%`, "Occupancy"],
            [String(alertCount), "Alerts"],
          ].map(([v, l], i) => (
            <div key={l} className="flex items-center gap-4">
              {i > 0 && <div className="w-px h-8 bg-white/20" />}
              <div>
                <p className={`text-xl font-bold ${i === 2 && alertCount > 0 ? "text-amber-300" : ""}`}>{v}</p>
                <p className="text-xs text-emerald-200">{l}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map(c => (
          <div key={c.title} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 ${c.ibg} rounded-xl flex items-center justify-center`}>
                <c.Icon size={15} className={c.ic} />
              </div>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{c.sub}</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">{c.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{c.title}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Revenue {chartYear}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Monthly collected rent</p>
          </div>
          {collected > 0 && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/25 px-2 py-1 rounded-full flex items-center gap-1">
              <TrendingUp size={11} />{formatCurrency(collected)} total
            </span>
          )}
        </div>
        <LineChart data={revenueData} />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Occupancy</h3>
        <div className="space-y-3">
          {occupancyRows.map(row => (
            <div key={row.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.label}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {row.value}
                  <span className="text-slate-400 dark:text-slate-500 font-normal text-xs"> / {totalUnits}</span>
                </span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${row.color} rounded-full transition-all`}
                  style={{ width: totalUnits > 0 ? `${(row.value / totalUnits) * 100}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Recent Activity</h2>
          {activityFeed.length > 0 && onNavigate && (
            <button
              onClick={() => onNavigate("payments")}
              className="text-xs font-semibold text-emerald-600 min-h-[44px] flex items-center"
            >
              See all
            </button>
          )}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
          {activityFeed.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
              No recent activity yet
            </div>
          ) : (
            activityFeed.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => item.page && onNavigate?.(item.page)}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className={`w-9 h-9 ${item.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <item.Icon size={16} className={item.ic} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{item.detail}</p>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0 font-medium">{item.time}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
