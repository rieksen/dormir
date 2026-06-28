import React, { useMemo } from "react";
import {
  Building2, Key, DollarSign, TrendingUp, Loader2, AlertCircle,
  Users, Bed, Calendar, CreditCard,
} from "lucide-react";
import type { DashboardSummary, RecentPayment, RecentBooking } from "../lib/types";

type NavigatePage = "payments" | "bookings" | "allocations" | "students";

const formatCurrency = (v: number) => `UGX ${v.toLocaleString()}`;

interface ActivityItem {
  id: string;
  sortKey: number;
  Icon: React.ElementType;
  bg: string;
  ic: string;
  title: string;
  detail: string;
  page?: NavigatePage;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export interface DashboardPageProps {
  onNavigate?: (page: NavigatePage) => void;
  summary: DashboardSummary | null;
  loading?: boolean;
  error?: string | null;
  onReload?: () => void;
  recentPayments?: RecentPayment[];
  recentBookings?: RecentBooking[];
}

export default function DashboardPage({
  onNavigate,
  summary,
  loading,
  error,
  onReload,
  recentPayments = [],
  recentBookings = [],
}: DashboardPageProps) {
  const totalRooms    = summary?.total_rooms     ?? 0;
  const totalBeds     = summary?.total_beds      ?? 0;
  const occupiedBeds  = summary?.occupied_beds   ?? 0;
  const availableBeds = summary?.available_beds  ?? 0;
  const occupancyPct  = summary?.occupancy_rate  ?? 0;
  const totalStudents = summary?.total_students  ?? 0;
  const collected     = summary?.revenue_collected ?? 0;
  const outstanding   = summary?.outstanding     ?? 0;
  const pendingCount  = summary?.pending_bookings ?? 0;
  const confirmedCount = summary?.confirmed_bookings ?? 0;

  const activityFeed = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    recentPayments.slice(0, 5).forEach((p, i) => {
      items.push({
        id: `pay-${i}`,
        sortKey: p.confirmed_at ? new Date(p.confirmed_at).getTime() : 0,
        Icon: CreditCard,
        bg: p.status === "confirmed" ? "bg-accent dark:bg-accent/10" : "bg-amber-50 dark:bg-amber-950/20",
        ic: p.status === "confirmed" ? "text-primary" : "text-amber-600",
        title: p.status === "confirmed" ? "Payment confirmed" : "Payment pending",
        detail: `${p.student_name} · ${p.room_number} Bed ${p.bed_number} · ${formatCurrency(p.amount)}`,
        page: "payments",
      });
    });
    recentBookings.slice(0, 5).forEach((b, i) => {
      items.push({
        id: `bk-${i}`,
        sortKey: i * -1,
        Icon: Calendar,
        bg: b.status === "active" ? "bg-blue-50 dark:bg-blue-950/30" : "bg-slate-50 dark:bg-slate-800/60",
        ic: b.status === "active" ? "text-blue-600" : "text-slate-500",
        title: b.status === "active" ? "New booking" : "Checkout",
        detail: `${b.student_name} · ${b.room_number} Bed ${b.bed_number} · ${b.semester} ${b.year}`,
        page: "bookings",
      });
    });
    return items;
  }, [recentPayments, recentBookings]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 size={28} className="text-primary animate-spin" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading dashboard…</p>
    </div>
  );

  if (error || !summary) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <AlertCircle size={32} className="text-red-500" />
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-sm">
        {error ?? "Failed to load dashboard"}
      </p>
      {onReload && (
        <button onClick={onReload} className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-sm font-semibold rounded-lg shadow-sm active:scale-[0.98] transition-all">
          Retry
        </button>
      )}
    </div>
  );

  const statCards = [
    { title: "Students",     value: String(totalStudents), sub: "active",           Icon: Users,      ibg: "bg-indigo-50 dark:bg-indigo-950/30",    ic: "text-indigo-600 dark:text-indigo-400" },
    { title: "Rooms",        value: String(totalRooms),    sub: `${totalBeds} beds`,    Icon: Building2,  ibg: "bg-slate-50 dark:bg-slate-800", ic: "text-slate-500 dark:text-slate-400" },
    { title: "Occupied",     value: String(occupiedBeds),  sub: `${occupancyPct.toFixed(0)}% occupancy`, Icon: Bed, ibg: "bg-amber-50 dark:bg-amber-950/30", ic: "text-amber-600 dark:text-amber-400" },
    { title: "Available",    value: String(availableBeds), sub: "beds free",        Icon: Key,        ibg: "bg-accent dark:bg-accent/10", ic: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Overview</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{greeting()}! Here is your hostel performance summary.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 shadow-sm text-xs font-semibold text-slate-650 dark:text-slate-350">
            {totalRooms} rooms managed
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 shadow-sm text-xs font-semibold text-slate-650 dark:text-slate-350">
            {totalBeds} total beds
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(c => (
          <div key={c.title} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150/80 dark:border-slate-800/80 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 ${c.ibg} rounded-lg flex items-center justify-center`}>
                <c.Icon size={15} className={c.ic} />
              </div>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{c.sub}</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">{c.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">{c.title}</p>
          </div>
        ))}
      </div>

      {/* Revenue + outstanding */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150/80 dark:border-slate-800/80 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <DollarSign size={14} className="text-primary" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Collected Revenue</p>
          </div>
          <p className="text-lg font-bold text-primary leading-tight">{formatCurrency(collected)}</p>
          <p className="text-[11px] text-slate-400 mt-1.5">{confirmedCount} confirmed payments</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150/80 dark:border-slate-800/80 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp size={14} className="text-amber-600" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Outstanding Revenue</p>
          </div>
          <p className="text-lg font-bold text-amber-650 dark:text-amber-400 leading-tight">{formatCurrency(outstanding)}</p>
          <p className="text-[11px] text-slate-400 mt-1.5">{pendingCount} unpaid bookings</p>
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150/80 dark:border-slate-800/80 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4">Occupancy Ratio</h3>
        <div className="space-y-3.5">
          {[
            { label: "Occupied Beds", value: occupiedBeds, color: "bg-primary" },
            { label: "Available Beds", value: availableBeds, color: "bg-amber-450 dark:bg-amber-500" },
          ].map(row => (
            <div key={row.label}>
              <div className="flex justify-between text-xs text-slate-505 dark:text-slate-400 mb-1">
                <span>{row.label}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{row.value} / {totalBeds} ({totalBeds > 0 ? Math.round((row.value / totalBeds) * 100) : 0}%)</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${row.color} rounded-full transition-all`}
                  style={{ width: totalBeds > 0 ? `${(row.value / totalBeds) * 100}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Recent Activity</h2>
          {onNavigate && (
            <button onClick={() => onNavigate("payments")} className="text-xs font-semibold text-primary hover:underline min-h-[36px] flex items-center">
              View all payments →
            </button>
          )}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150/80 dark:border-slate-800/80 shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-slate-800/40">
          {activityFeed.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">No recent activity yet</div>
          ) : (
            activityFeed.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => item.page && onNavigate?.(item.page)}
                className="w-full flex items-center gap-3.5 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <item.Icon size={14} className={item.ic} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{item.detail}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}