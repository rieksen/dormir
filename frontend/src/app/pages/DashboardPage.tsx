import React, { useMemo } from "react";
import { Building2, Key, DollarSign, TrendingUp, Loader2, AlertCircle, Users, Bed, Calendar, CreditCard, ArrowRight } from "lucide-react";
import type { DashboardSummary, RecentPayment, RecentBooking } from "../lib/types";

type NavigatePage = "payments" | "bookings" | "allocations" | "students";
const fmt = (v: number) => `UGX ${v.toLocaleString()}`;
function greeting() { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; }

export interface DashboardPageProps {
  onNavigate?: (page: NavigatePage) => void;
  summary: DashboardSummary | null;
  loading?: boolean;
  error?: string | null;
  onReload?: () => void;
  recentPayments?: RecentPayment[];
  recentBookings?: RecentBooking[];
}

export default function DashboardPage({ onNavigate, summary, loading, error, onReload, recentPayments = [], recentBookings = [] }: DashboardPageProps) {
  const totalRooms    = summary?.total_rooms ?? 0;
  const totalBeds     = summary?.total_beds ?? 0;
  const occupiedBeds  = summary?.occupied_beds ?? 0;
  const availableBeds = summary?.available_beds ?? 0;
  const occupancyPct  = summary?.occupancy_rate ?? 0;
  const totalStudents = summary?.total_students ?? 0;
  const collected     = summary?.revenue_collected ?? 0;
  const outstanding   = summary?.outstanding ?? 0;
  const pendingCount  = summary?.pending_bookings ?? 0;
  const confirmedCount = summary?.confirmed_bookings ?? 0;

  interface ActivityItem { id: string; sortKey: number; Icon: React.ElementType; title: string; detail: string; page?: NavigatePage; type: "payment" | "booking"; }
  const activityFeed = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    recentPayments.slice(0, 4).forEach((p, i) => items.push({ id: `pay-${i}`, sortKey: p.confirmed_at ? new Date(p.confirmed_at).getTime() : 0, Icon: CreditCard, title: p.status === "confirmed" ? "Payment confirmed" : "Payment pending", detail: `${p.student_name} · ${p.room_number} Bed ${p.bed_number} · ${fmt(p.amount)}`, page: "payments", type: "payment" }));
    recentBookings.slice(0, 4).forEach((b, i) => items.push({ id: `bk-${i}`, sortKey: i * -1, Icon: Calendar, title: b.status === "active" ? "New booking" : "Checkout", detail: `${b.student_name} · ${b.room_number} Bed ${b.bed_number} · ${b.semester} ${b.year}`, page: "bookings", type: "booking" }));
    return items;
  }, [recentPayments, recentBookings]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 size={24} className="text-[#2fa872] animate-spin" />
      <p className="text-xs text-[#808080]">Loading dashboard…</p>
    </div>
  );
  if (error || !summary) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <AlertCircle size={28} className="text-red-500" />
      <p className="text-sm text-[#808080] text-center max-w-sm">{error ?? "Failed to load dashboard"}</p>
      {onReload && <button onClick={onReload} className="px-4 py-2 bg-[#2fa872] text-white text-xs font-semibold rounded-lg">Retry</button>}
    </div>
  );

  const statCards = [
    { title: "Students",  value: totalStudents,  sub: "active residents",     Icon: Users,     page: "students"    as NavigatePage },
    { title: "Rooms",     value: totalRooms,      sub: `${totalBeds} total beds`, Icon: Building2, page: "allocations" as NavigatePage },
    { title: "Occupied",  value: occupiedBeds,    sub: `${occupancyPct.toFixed(0)}% occupancy`, Icon: Bed,       page: "allocations" as NavigatePage },
    { title: "Available", value: availableBeds,   sub: "beds free",           Icon: Key,       page: "allocations" as NavigatePage },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold text-[#808080] uppercase tracking-[0.6px] mb-1">Overview</p>
        <h1 className="text-[22px] font-semibold text-[#f0f0f0] tracking-[-0.22px]">Dashboard</h1>
        <p className="text-[13px] text-[#808080] mt-0.5">{greeting()} · Kasalita Inn</p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {statCards.map(c => (
          <button key={c.title} onClick={() => c.page && onNavigate?.(c.page)} className="bg-[#141714] border border-[#212521] rounded-[10px] p-4 text-left hover:bg-[#1a1f1a] hover:border-[#2fa872]/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-[#1f381f] rounded-[8px] flex items-center justify-center">
                <c.Icon size={14} className="text-[#2fa872]" />
              </div>
              <ArrowRight size={12} className="text-[#808080] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="font-['Courier_Prime',monospace] text-[22px] text-[#f0f0f0] leading-none">{c.value}</p>
            <p className="text-[11px] font-semibold text-[#f0f0f0] mt-1.5">{c.title}</p>
            <p className="text-[10px] text-[#808080] mt-0.5">{c.sub}</p>
          </button>
        ))}
      </div>

      {/* Revenue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="bg-[#141714] border border-[#212521] rounded-[10px] p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={13} className="text-[#2fa872]" />
            <p className="text-[11px] font-semibold text-[#808080] uppercase tracking-[0.5px]">Collected Revenue</p>
          </div>
          <p className="font-['Courier_Prime',monospace] text-[18px] text-[#2fa872] font-bold">{fmt(collected)}</p>
          <p className="text-[11px] text-[#808080] mt-1.5">{confirmedCount} confirmed payments</p>
        </div>
        <button onClick={() => onNavigate?.("payments")} className="bg-[#141714] border border-[#212521] rounded-[10px] p-4 text-left hover:bg-[#1a1f1a] hover:border-amber-500/30 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={13} className="text-amber-500" />
              <p className="text-[11px] font-semibold text-[#808080] uppercase tracking-[0.5px]">Outstanding</p>
            </div>
            <ArrowRight size={12} className="text-[#808080] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="font-['Courier_Prime',monospace] text-[18px] text-amber-400 font-bold">{fmt(outstanding)}</p>
          <p className="text-[11px] text-[#808080] mt-1.5">{pendingCount} unpaid bookings</p>
        </button>
      </div>

      {/* Occupancy bar */}
      <div className="bg-[#141714] border border-[#212521] rounded-[10px] p-4">
        <p className="text-[10px] font-semibold text-[#808080] uppercase tracking-[0.6px] mb-3">Occupancy</p>
        <div className="space-y-3">
          {[
            { label: "Occupied", value: occupiedBeds, color: "bg-[#2fa872]" },
            { label: "Available", value: availableBeds, color: "bg-[#808080]" },
          ].map(row => (
            <div key={row.label}>
              <div className="flex justify-between text-[11px] text-[#808080] mb-1.5">
                <span>{row.label}</span>
                <span className="font-['Courier_Prime',monospace] text-[#f0f0f0]">{row.value} / {totalBeds} · {totalBeds > 0 ? Math.round((row.value / totalBeds) * 100) : 0}%</span>
              </div>
              <div className="h-1 bg-[#212521] rounded-full overflow-hidden">
                <div className={`h-full ${row.color} rounded-full transition-all`} style={{ width: totalBeds > 0 ? `${(row.value / totalBeds) * 100}%` : "0%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-[#808080] uppercase tracking-[0.6px]">Recent Activity</p>
          {onNavigate && <button onClick={() => onNavigate("payments")} className="text-[11px] font-semibold text-[#2fa872] hover:underline flex items-center gap-1">All payments <ArrowRight size={10} /></button>}
        </div>
        <div className="bg-[#141714] border border-[#212521] rounded-t-[10px] overflow-hidden">
          {activityFeed.length === 0 ? (
            <div className="px-4 py-10 text-center text-[13px] text-[#808080]">No recent activity</div>
          ) : (
            activityFeed.map((item, idx) => (
              <button key={item.id} onClick={() => item.page && onNavigate?.(item.page)} className={`w-full flex items-center gap-3.5 px-4 py-3 text-left hover:bg-[#1a1f1a] transition-colors ${idx > 0 ? "border-t border-[#1a1f1a]" : ""}`}>
                <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0 ${item.type === "payment" ? "bg-[#1f381f]" : "bg-[#1a1f2e]"}`}>
                  <item.Icon size={13} className={item.type === "payment" ? "text-[#2fa872]" : "text-blue-400"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#f0f0f0] truncate">{item.title}</p>
                  <p className="text-[11px] text-[#808080] truncate mt-0.5">{item.detail}</p>
                </div>
                <ArrowRight size={11} className="text-[#808080] flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}