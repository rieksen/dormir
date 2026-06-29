import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutDashboard, Building2, Users, FileText, CreditCard,
  Wrench, BarChart3, Settings, Bell, Search, Plus, Download,
  Eye, Edit, Trash2, X, TrendingUp, LogOut,
  Moon, Sun, MoreHorizontal, ArrowUpRight, DollarSign,
  Menu, ChevronDown, Shield, Mail, Phone, AlertTriangle,
  Lock, Check, Star, Zap, LayoutGrid, Calendar, Key,
} 
from "lucide-react";

import RoomsPage from "./pages/RoomsPage";

import StudentsPage from "./pages/StudentsPage";

import BookingsPage from "./pages/BookingsPage";

import AllocationsPage from "./pages/AllocationsPage";

import PaymentsPage from "./pages/PaymentsPage";

import MaintenancePage from "./pages/MaintenancePage";

import DashboardPage from "./pages/DashboardPage";
import {
  fetchDashboardSummary,
  fetchRecentPayments,
  fetchRecentBookings,
} from "./lib/api/dashboard";
import type { DashboardSummary, RecentPayment, RecentBooking, ActiveStudent } from "./lib/types";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { apiFetch } from "./lib/api";
import { Loader2 } from "lucide-react";
// Note: dashboardApi.ts alias removed — use lib/api/dashboard directly


// ─── Types ───────────────────────────────────────────────────

type Page =
  | "dashboard" | "units" | "students" | "bookings" | "allocations"
  | "payments" | "maintenance" | "reports" | "settings";

// Reports page still uses static demo chart data
const revenueData = [
  { month: "Jan", v: 62 }, { month: "Feb", v: 65 }, { month: "Mar", v: 68 },
  { month: "Apr", v: 71 }, { month: "May", v: 78 }, { month: "Jun", v: 82 },
  { month: "Jul", v: 80 }, { month: "Aug", v: 85 }, { month: "Sep", v: 88 },
  { month: "Oct", v: 87 }, { month: "Nov", v: 91 }, { month: "Dec", v: 95 },
];

// ─── Style helpers ────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Occupied:        "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-700/50",
  Vacant:          "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-700/50",
  Maintenance:     "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-700/50",
  Active:          "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-700/50",
  Expiring:        "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-700/50",
  "Expiring Soon": "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-700/50",
  Expired:         "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
  Paid:            "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-700/50",
  Pending:         "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-700/50",
  Overdue:         "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-700/50",
  Open:            "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-700/50",
  "In Progress":   "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-700/50",
  Completed:       "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-700/50",
  Critical:        "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 ring-1 ring-red-300 dark:ring-red-700/60",
  High:            "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 ring-1 ring-orange-200 dark:ring-orange-700/50",
  Medium:          "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-700/50",
  Low:             "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
};

const AVATAR_COLORS = [
  "bg-emerald-500", "bg-blue-500", "bg-violet-500",
  "bg-amber-500",   "bg-pink-500", "bg-teal-500",
];

// ─── Primitive components ─────────────────────────────────────

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
      {status}
    </span>
  );
}

function Avatar({ initials, size = "sm" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const color = AVATAR_COLORS[initials.charCodeAt(0) % AVATAR_COLORS.length];
  const sz = size === "lg" ? "w-12 h-12 text-base" : size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
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

function PrimaryBtn({ children, icon, onClick, sm }: {
  children: string; icon?: React.ReactNode; onClick?: () => void; sm?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-white font-semibold rounded-lg shadow-sm active:scale-[0.98] transition-all ${sm ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}`}
    >
      {icon}{children}
    </button>
  );
}

function GhostBtn({ children, icon, onClick }: {
  children: string; icon?: React.ReactNode; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-350 font-semibold rounded-lg px-3 py-1.5 text-xs shadow-sm hover:bg-slate-50 dark:hover:bg-slate-850 active:scale-[0.98] transition-all"
    >
      {icon}{children}
    </button>
  );
}

// ─── Static SVG charts (Reports page) ──────────────────────────

function BarChart({ dark }: { dark?: boolean }) {
  const W = 520, H = 200, PL = 36, PR = 8, PT = 12, PB = 26;
  const cw = W - PL - PR, ch = H - PT - PB;
  const maxV = 100; // round ceiling above data max of 95
  const gridLines = [0, 25, 50, 75, 100];
  const slotW = cw / revenueData.length;
  const barW = slotW * 0.55;
  const bx = (i: number) => PL + i * slotW + (slotW - barW) / 2;
  const bh = (v: number) => (v / maxV) * ch;
  const by = (v: number) => PT + ch - bh(v);
  const gridColor = dark ? "#1e293b" : "#f1f5f9";
  const labelColor = dark ? "#64748b" : "#94a3b8";
  const barColor = dark ? "#22c55e" : "#16a34a";
  const barBg = dark ? "#162032" : "#f0fdf4";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 220 }}>
      {/* Background bars (ghost track) */}
      {revenueData.map((_, i) => (
        <rect key={`bg-${i}`} x={bx(i)} y={PT} width={barW} height={ch} fill={barBg} rx="4" />
      ))}
      {/* Grid lines */}
      {gridLines.map(g => {
        const yv = PT + ch - (g / maxV) * ch;
        return (
          <g key={`grid-${g}`}>
            <line x1={PL} y1={yv} x2={W - PR} y2={yv} stroke={gridColor} strokeWidth="1" />
            <text x={PL - 5} y={yv + 4} textAnchor="end" fontSize="9" fill={labelColor}>${g}k</text>
          </g>
        );
      })}
      {/* Bars */}
      {revenueData.map((d, i) => (
        <g key={d.month}>
          <rect x={bx(i)} y={by(d.v)} width={barW} height={bh(d.v)} fill={barColor} rx="4" />
          <text x={bx(i) + barW / 2} y={H - 6} textAnchor="middle" fontSize="9" fill={labelColor}>{d.month}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Navigation ───────────────────────────────────────────────

const NAV_ITEMS: { id: Page; label: string; Icon: React.ElementType; badgeKey?: "payments" | "maintenance" }[] = [
  { id: "dashboard",   label: "Dashboard",   Icon: LayoutDashboard },
  { id: "units",       label: "Rooms",       Icon: Building2 },
  { id: "students",    label: "Students",    Icon: Users },
  { id: "bookings",    label: "Bookings",    Icon: Calendar },
  { id: "allocations", label: "Allocations", Icon: Key },
  { id: "payments",    label: "Payments",    Icon: CreditCard, badgeKey: "payments" },
  { id: "maintenance", label: "Maintenance", Icon: Wrench, badgeKey: "maintenance" },
  { id: "reports",     label: "Reports",     Icon: BarChart3 },
  { id: "settings",    label: "Settings",    Icon: Settings },
];

const BOTTOM_NAV = NAV_ITEMS.slice(0, 4);
const MORE_NAV   = NAV_ITEMS.slice(4);

// ─── Top bar ──────────────────────────────────────────────────

function TopBar({
  activePage, collapsed, setCollapsed, dark, setDark, onLogout,
  onNavigate, totalRooms, pendingBookings,
}: {
  activePage: Page; collapsed: boolean; setCollapsed: (v: boolean) => void;
  dark: boolean; setDark: (v: boolean) => void; onLogout: () => void;
  onNavigate: (page: Page) => void;
  totalRooms: number;
  pendingBookings: number;
}) {
  const [user, setUser] = useState(false);
  const label = NAV_ITEMS.find(n => n.id === activePage)?.label ?? "Dormir";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0e120e] border-b border-[#212521] backdrop-blur-md">
      {/* Mobile */}
      <div className="lg:hidden h-14 flex items-center px-4 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Dormir logo mark */}
          <div className="flex items-center gap-1.5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="8" width="9" height="14" rx="2" fill="#2fa872"/>
              <rect x="13" y="2" width="9" height="20" rx="2" fill="#2fa872" opacity="0.5"/>
            </svg>
            <span className="text-sm font-bold text-white tracking-tight truncate">{label}</span>
          </div>
        </div>
        <div className="relative flex-shrink-0">
          <button onClick={() => { setUser(!user); }} className="w-10 h-10 flex items-center justify-center">
            <div className="w-8 h-8 bg-[#2fa872] rounded-full flex items-center justify-center text-white text-xs font-bold">DR</div>
          </button>
          {user && <UserPanel dark={dark} setDark={setDark} onLogout={onLogout} onClose={() => setUser(false)} />}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex h-14 items-center px-4 gap-3">
        <div className="flex items-center gap-2 flex-shrink-0 transition-all" style={{ minWidth: collapsed ? 48 : 216 }}>
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-[#1f381f] text-[#808080] hover:text-[#2fa872] transition-colors">
            <Menu size={17} />
          </button>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="8" width="9" height="14" rx="2" fill="#2fa872"/>
                <rect x="13" y="2" width="9" height="20" rx="2" fill="#2fa872" opacity="0.5"/>
              </svg>
              <span className="font-bold text-white text-sm tracking-tight">Dormir</span>
            </div>
          )}
        </div>
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none" />
            <input
              placeholder="Search rooms, students…"
              className="w-full pl-8 pr-3 py-1.5 bg-[#141714] border border-[#212521] rounded-lg text-sm text-[#f0f0f0] placeholder-[#808080] focus:outline-none focus:ring-1 focus:ring-[#2fa872] focus:border-[#2fa872] transition-colors"
            />
          </div>
        </div>
        <div className="flex-1" />
        {pendingBookings > 0 && (
          <button
            onClick={() => onNavigate("payments")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f381f] border border-[#2fa872]/30 rounded-lg text-xs font-medium text-[#2fa872] hover:bg-[#2fa872]/20 transition-colors"
          >
            <Bell size={13} />
            {pendingBookings} pending
          </button>
        )}
        <div className="relative ml-1">
          <button onClick={() => setUser(!user)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#1a1f1a] border border-transparent hover:border-[#212521] transition-all">
            <div className="w-7 h-7 bg-[#2fa872] rounded-full flex items-center justify-center text-white text-[11px] font-bold">DR</div>
            <span className="text-xs font-medium text-[#c8c8c8] hidden xl:block">My Account</span>
            <ChevronDown size={12} className="text-[#808080] hidden xl:block" />
          </button>
          {user && <UserPanel dark={dark} setDark={setDark} onLogout={onLogout} onClose={() => setUser(false)} />}
        </div>
      </div>
    </header>
  );
}

// Notification panel removed - new API doesn't have alerts structure
// Pending bookings count shown in bell badge instead

function UserPanel({ dark, setDark, onLogout, onClose }: {
  dark: boolean; setDark: (v: boolean) => void; onLogout: () => void; onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-[90]" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-52 bg-[#121712] border border-[#272b27] rounded-xl shadow-2xl overflow-hidden z-[100] p-1">
        <div className="px-3 py-3 border-b border-[#212521] mb-1">
          <p className="text-sm font-semibold text-white">Taban Riak</p>
          <p className="text-xs text-[#808080] mt-0.5">Administrator</p>
        </div>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#c8c8c8] hover:bg-[#1a1f1a] rounded-lg transition-colors">
          <Settings size={14} className="text-[#808080]" />Settings
        </button>
        <div className="border-t border-[#212521] mt-1 pt-1">
          <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut size={14} />Sign out
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Desktop sidebar ──────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: "Hostel",
    items: ["dashboard", "units", "students", "bookings", "allocations"] as Page[],
  },
  {
    label: "Finance",
    items: ["payments", "reports"] as Page[],
  },
  {
    label: "Operations",
    items: ["maintenance", "settings"] as Page[],
  },
];

function Sidebar({ active, setActive, collapsed, totalRooms }: {
  active: Page; setActive: (p: Page) => void; collapsed: boolean; totalRooms: number;
}) {
  return (
    <aside className={`hidden lg:flex fixed top-14 left-0 bottom-0 bg-[#0e120e] border-r border-[#212521] flex-col transition-all duration-200 z-40 ${collapsed ? "w-14" : "w-56"}`}>
      <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-5">
        {NAV_SECTIONS.map(section => {
          const sectionItems = NAV_ITEMS.filter(n => section.items.includes(n.id));
          return (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.6px] text-[rgba(148,163,184,0.5)]">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {sectionItems.map(item => {
                  const on = active === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActive(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-sm transition-all min-h-[34px] ${
                        on
                          ? "bg-[#1f381f] text-[#f3f4f6] font-medium"
                          : "text-[#808080] hover:bg-[#141714] hover:text-[#c8c8c8]"
                      }`}
                    >
                      <item.Icon
                        size={15}
                        className={`flex-shrink-0 ${on ? "text-[#2fa872]" : "text-[#808080]"}`}
                      />
                      {!collapsed && (
                        <span className="flex-1 text-left text-[13px]">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="px-2 py-3 border-t border-[#212521]">
          <div className="bg-[#121712] border border-[#272b27] rounded-[10px] p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-[#2fa872] rounded-[8px] flex items-center justify-center flex-shrink-0">
                <Building2 size={13} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">My Account</p>
                <p className="text-[10px] text-[#808080]">{totalRooms ?? "—"} rooms · Admin</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── Mobile bottom nav ────────────────────────────────────────

function BottomNav({ active, setActive, onMore }: {
  active: Page; setActive: (p: Page) => void; onMore: () => void;
}) {
  const isMore = MORE_NAV.some(n => n.id === active);
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0e120e]/95 backdrop-blur-xl border-t border-[#212521] z-50">
      <div className="flex items-stretch h-16 px-1">
        {BOTTOM_NAV.map(item => {
          const on = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)} className="flex-1 flex flex-col items-center justify-center gap-1 relative">
              {on && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#2fa872] rounded-full" />}
              <div className={`p-1.5 rounded-lg ${on ? "bg-[#1f381f]" : ""}`}>
                <item.Icon size={20} className={on ? "text-[#2fa872]" : "text-[#808080]"} />
              </div>
              <span className={`text-[10px] font-semibold leading-none ${on ? "text-[#2fa872]" : "text-[#808080]"}`}>{item.label}</span>
            </button>
          );
        })}
        <button onClick={onMore} className="flex-1 flex flex-col items-center justify-center gap-1 relative">
          {isMore && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#2fa872] rounded-full" />}
          <div className={`p-1.5 rounded-lg ${isMore ? "bg-[#1f381f]" : ""}`}>
            <LayoutGrid size={20} className={isMore ? "text-[#2fa872]" : "text-[#808080]"} />
          </div>
          <span className={`text-[10px] font-semibold leading-none ${isMore ? "text-[#2fa872]" : "text-[#808080]"}`}>More</span>
        </button>
      </div>
    </nav>
  );
}

// ─── More drawer ──────────────────────────────────────────────

function MoreDrawer({ active, setActive, onClose, onLogout, dark, setDark }: {
  active: Page; setActive: (p: Page) => void; onClose: () => void;
  onLogout: () => void; dark: boolean; setDark: (v: boolean) => void;
}) {
  return (
    <>
      <div className="lg:hidden fixed inset-0 bg-black/60 z-[80]" onClick={onClose} />
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0e120e] border-t border-[#212521] rounded-t-2xl z-[90] shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 bg-[#212521] rounded-full" />
        </div>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#212521]">
          <div className="w-10 h-10 bg-[#2fa872] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">TR</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Taban Riak</p>
            <p className="text-xs text-[#808080] truncate">Dormir · Admin</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#1a1f1a] flex items-center justify-center text-[#808080]">
            <X size={15} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2 px-4 py-4">
          {MORE_NAV.map(item => {
            const on = active === item.id;
            return (
              <button key={item.id} onClick={() => { setActive(item.id); onClose(); }} className={`flex flex-col items-center gap-2 py-3 rounded-xl transition-all active:scale-95 ${on ? "bg-[#1f381f]" : "bg-[#141714]"}`}>
                <item.Icon size={18} className={on ? "text-[#2fa872]" : "text-[#808080]"} />
                <span className={`text-[11px] font-medium ${on ? "text-[#2fa872]" : "text-[#808080]"}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="px-4 pb-8">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <LogOut size={15} className="text-red-400" />
            <span className="text-sm font-medium text-red-400">Sign out</span>
          </button>
        </div>
      </div>
    </>
  );
}


// ─── Maintenance ──────────────────────────────────────────────

// ─── Reports ──────────────────────────────────────────────────

type ReportType = "revenue" | "occupancy" | "maintenance" | "tenant" | null;

interface OccupancyBed {
  bed_id: number;
  bed_number: number;
  is_occupied: boolean;
  student_name: string | null;
}

interface OccupancyReportItem {
  room_id: number;
  room_number: string;
  gender: string;
  occupied_beds: number;
  available_beds: number;
  total_beds: number;
  beds: OccupancyBed[];
}

interface UnpaidReportItem {
  student_id: number;
  full_name: string;
  booking_id: number;
  payment_id: number;
  room_number: string;
  bed_number: number;
  semester: string;
  year: number;
  amount: number;
}

function ReportsPage({ dark }: { dark: boolean }) {
  const [activeReport, setActiveReport] = useState<ReportType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [occupancyData, setOccupancyData] = useState<OccupancyReportItem[]>([]);
  const [unpaidData, setUnpaidData] = useState<UnpaidReportItem[]>([]);
  const [summaryData, setSummaryData] = useState<{
    total_students: number;
    revenue_collected: number;
    pending: number;
    occupied_beds: number;
    total_beds: number;
  } | null>(null);
  const [studentsData, setStudentsData] = useState<ActiveStudent[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [expandedRoom, setExpandedRoom] = useState<number | null>(null);

  const loadReportData = useCallback(async (type: ReportType) => {
    if (!type) return;
    setLoading(true);
    setError(null);
    try {
      if (type === "revenue") {
        const [unpaid, summary] = await Promise.all([
          apiFetch<UnpaidReportItem[]>("/reports/unpaid"),
          apiFetch<any>("/reports/summary"),
        ]);
        setUnpaidData(unpaid);
        setSummaryData(summary);
      } else if (type === "occupancy") {
        const [occ, summary] = await Promise.all([
          apiFetch<OccupancyReportItem[]>("/reports/occupancy"),
          apiFetch<any>("/reports/summary"),
        ]);
        setOccupancyData(occ);
        setSummaryData(summary);
      } else if (type === "tenant") {
        const students = await apiFetch<ActiveStudent[]>("/students");
        setStudentsData(students);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportData(activeReport);
  }, [activeReport, loadReportData]);

  const handleConfirmPayment = async (paymentId: number) => {
    try {
      await apiFetch(`/payments/${paymentId}/confirm`, { method: "POST" });
      toast.success("Payment confirmed successfully!");
      // Reload revenue report data
      loadReportData("revenue");
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm payment");
    }
  };

  if (activeReport === "revenue") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveReport(null)} className="px-3 py-2 bg-muted hover:bg-muted/80 text-sm font-medium rounded-lg text-foreground transition-colors">
              ← Back
            </button>
            <h1 className="text-2xl font-semibold text-foreground">Revenue Report Detail</h1>
          </div>
          <button onClick={() => loadReportData("revenue")} className="text-sm text-primary font-medium hover:underline">Refresh</button>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={28}/></div>
        ) : error ? (
          <div className="bg-destructive/5 border border-destructive/20 text-destructive p-4 rounded-lg text-sm">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border p-5 rounded-lg shadow-sm">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Rent Collected</p>
                <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-500 mt-2">UGX {(summaryData?.revenue_collected || 0).toLocaleString()}</p>
              </div>
              <div className="bg-card border border-border p-5 rounded-lg shadow-sm">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Outstanding / Unpaid</p>
                <p className="text-2xl font-semibold text-amber-600 dark:text-amber-500 mt-2">UGX {(summaryData?.pending || 0).toLocaleString()}</p>
              </div>
              <div className="bg-card border border-border p-5 rounded-lg shadow-sm">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Collection Rate</p>
                <p className="text-2xl font-semibold text-foreground mt-2">
                  {((summaryData?.revenue_collected || 0) + (summaryData?.pending || 0)) > 0
                    ? (((summaryData?.revenue_collected || 0) / ((summaryData?.revenue_collected || 0) + (summaryData?.pending || 0))) * 100).toFixed(1)
                    : "0.0"}%
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h3 className="text-base font-semibold text-foreground mb-4">Unpaid / Pending Payments</h3>
              {unpaidData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-muted rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <Check size={24} className="text-emerald-600 dark:text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-foreground">All payments are up-to-date!</p>
                  <p className="text-xs text-muted-foreground mt-1">No pending payments at this time</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-medium">
                        <th className="py-3 px-2">Tenant Name</th>
                        <th className="py-3 px-2">Room & Bed</th>
                        <th className="py-3 px-2">Semester</th>
                        <th className="py-3 px-2">Amount</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {unpaidData.map(item => (
                        <tr key={item.payment_id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-2 font-medium text-foreground">{item.full_name}</td>
                          <td className="py-3 px-2 text-muted-foreground">{item.room_number} · Bed {item.bed_number}</td>
                          <td className="py-3 px-2 text-muted-foreground">{item.semester} {item.year}</td>
                          <td className="py-3 px-2 font-semibold text-amber-600 dark:text-amber-500">UGX {item.amount.toLocaleString()}</td>
                          <td className="py-3 px-2 text-right">
                            <button onClick={() => handleConfirmPayment(item.payment_id)} className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium rounded-lg transition-colors shadow-sm">
                              Confirm
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  if (activeReport === "occupancy") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveReport(null)} className="px-3 py-2 bg-muted hover:bg-muted/80 text-sm font-medium rounded-lg text-foreground transition-colors">
              ← Back
            </button>
            <h1 className="text-2xl font-semibold text-foreground">Occupancy Report Detail</h1>
          </div>
          <button onClick={() => loadReportData("occupancy")} className="text-sm text-primary font-medium hover:underline">Refresh</button>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={28}/></div>
        ) : error ? (
          <div className="bg-destructive/5 border border-destructive/20 text-destructive p-4 rounded-lg text-sm">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border p-5 rounded-lg shadow-sm">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Beds</p>
                <p className="text-2xl font-semibold text-foreground mt-2">{summaryData?.total_beds || 0}</p>
              </div>
              <div className="bg-card border border-border p-5 rounded-lg shadow-sm">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Occupied Beds</p>
                <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-500 mt-2">{summaryData?.occupied_beds || 0}</p>
              </div>
              <div className="bg-card border border-border p-5 rounded-lg shadow-sm">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Occupancy Rate</p>
                <p className="text-2xl font-semibold text-primary mt-2">
                  {summaryData?.total_beds ? ((summaryData.occupied_beds / summaryData.total_beds) * 100).toFixed(1) : "0.0"}%
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h3 className="text-base font-semibold text-foreground mb-4">Hostel Rooms Inventory</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {occupancyData.map(room => {
                  const isExpanded = expandedRoom === room.room_id;
                  return (
                    <div key={room.room_id} className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedRoom(isExpanded ? null : room.room_id)}>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Room {room.room_number}</p>
                          <p className="text-xs text-muted-foreground mt-1">Gender: {room.gender}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${room.occupied_beds === room.total_beds ? "bg-destructive/5 text-destructive border-destructive/20" : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500 border-emerald-200/50 dark:border-emerald-800/30"}`}>
                            {room.occupied_beds} / {room.total_beds} beds
                          </span>
                          <span className="text-muted-foreground text-xs">{isExpanded ? "▲" : "▼"}</span>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-border space-y-2">
                          {room.beds.map(bed => (
                            <div key={bed.bed_id} className="flex justify-between items-center text-xs py-2">
                              <span className="text-muted-foreground">Bed {bed.bed_number}</span>
                              {bed.is_occupied ? (
                                <span className="font-medium text-emerald-600 dark:text-emerald-500 truncate max-w-[180px]" title={bed.student_name || "Occupied"}>
                                  {bed.student_name}
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic">Vacant</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (activeReport === "tenant") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveReport(null)} className="px-3 py-2 bg-muted hover:bg-muted/80 text-sm font-medium rounded-lg text-foreground transition-colors">
              ← Back
            </button>
            <h1 className="text-2xl font-semibold text-foreground">Tenant / Student Report</h1>
          </div>
          <button onClick={() => loadReportData("tenant")} className="text-sm text-primary font-medium hover:underline">Refresh</button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/>
            <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Search tenants by name, university, or course..." className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"/>
          </div>

          {loading ? (
            <div className="py-20 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={28}/></div>
          ) : error ? (
            <div className="bg-destructive/5 border border-destructive/20 text-destructive p-4 rounded-lg text-sm">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-medium">
                    <th className="py-3 px-2">Name</th>
                    <th className="py-3 px-2">University & Course</th>
                    <th className="py-3 px-2">Room & Bed</th>
                    <th className="py-3 px-2">Phone</th>
                    <th className="py-3 px-2">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {studentsData
                    .filter(s => {
                      const q = studentSearch.toLowerCase();
                      return s.full_name.toLowerCase().includes(q) || s.university.toLowerCase().includes(q) || s.course.toLowerCase().includes(q);
                    })
                    .map(s => (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-2 font-medium text-foreground">{s.full_name}</td>
                        <td className="py-3 px-2">
                          <p className="text-foreground">{s.university}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.course} (Yr {s.year_of_study})</p>
                        </td>
                        <td className="py-3 px-2 font-medium text-foreground">Room {s.room_number} · Bed {s.bed_number}</td>
                        <td className="py-3 px-2 text-muted-foreground">{s.phone}</td>
                        <td className="py-3 px-2 text-muted-foreground">{s.semester_joined} {s.year_joined}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeReport === "maintenance") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveReport(null)} className="px-3 py-2 bg-muted hover:bg-muted/80 text-sm font-medium rounded-lg text-foreground transition-colors">
            ← Back
          </button>
          <h1 className="text-2xl font-semibold text-foreground">Maintenance Report Detail</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Open Requests", val: "3", col: "text-primary" },
            { label: "In Progress", val: "5", col: "text-amber-600 dark:text-amber-500" },
            { label: "Resolved", val: "28", col: "text-emerald-600 dark:text-emerald-500" },
            { label: "Avg Resolution", val: "2.4 days", col: "text-foreground" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border p-5 rounded-lg shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{s.label}</p>
              <p className={`text-xl font-semibold mt-2 ${s.col}`}>{s.val}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h3 className="text-base font-semibold text-foreground mb-4">Recent Maintenance Logs</h3>
          <div className="space-y-3">
            {[
              { id: 1, desc: "Water leak in Room R12 bathroom", cat: "Plumbing", pri: "Critical", stat: "In Progress" },
              { id: 2, desc: "A/C unit making loud noise in R08", cat: "HVAC", pri: "Medium", stat: "Open" },
              { id: 3, desc: "Flickering lights in corridor", cat: "Electrical", pri: "Low", stat: "Completed" },
              { id: 4, desc: "Cabinet door broken in Room 07B", cat: "Carpentry", pri: "Low", stat: "Completed" },
            ].map(r => (
              <div key={r.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg text-sm">
                <div>
                  <p className="font-medium text-foreground">{r.desc}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.cat} · Priority: {r.pri}</p>
                </div>
                <Badge status={r.stat}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[
          { id: "revenue", title: "Revenue Report",    desc: "Monthly and annual revenue breakdown", Icon: DollarSign, ib: "bg-emerald-50 dark:bg-emerald-950/20", ic: "text-emerald-600 dark:text-emerald-500" },
          { id: "occupancy", title: "Occupancy Report",  desc: "Unit occupancy rates and trends",       Icon: Building2,  ib: "bg-primary/5 dark:bg-primary/10", ic: "text-primary"   },
          { id: "maintenance", title: "Maintenance Report",desc: "Request volume and resolution times",   Icon: Wrench,     ib: "bg-amber-50 dark:bg-amber-950/20",   ic: "text-amber-600 dark:text-amber-500"  },
          { id: "tenant", title: "Tenant Report",     desc: "Retention and payment reliability",     Icon: Users,      ib: "bg-violet-50 dark:bg-violet-950/20",  ic: "text-violet-600 dark:text-violet-500" },
        ].map(r => (
          <button key={r.title} onClick={() => setActiveReport(r.id as ReportType)} className="bg-card border border-border rounded-lg p-5 shadow-sm flex items-start gap-4 hover:shadow-md hover:border-primary/30 transition-all text-left group active:scale-[0.98]">
            <div className={`w-12 h-12 ${r.ib} rounded-lg flex items-center justify-center flex-shrink-0`}><r.Icon size={20} className={r.ic}/></div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
            </div>
            <ArrowUpRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors mt-1 flex-shrink-0"/>
          </button>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div><h3 className="text-base font-semibold text-foreground">Annual Revenue 2024</h3><p className="text-xs text-muted-foreground mt-1">Monthly collected rent</p></div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-emerald-200/50 dark:border-emerald-800/30"><TrendingUp size={13}/>+8.7% YoY</span>
        </div>
        <BarChart dark={dark} />
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────

function SettingsPage() {
  const [tab, setTab] = useState("company");
  const [companyName, setCompanyName] = useState("Parkview Residences LLC");
  const [email, setEmail] = useState("admin@parkviewresidences.com");
  const [phone, setPhone] = useState("(415) 555-0200");
  const [address, setAddress] = useState("123 Park Ave, San Francisco");
  const [city, setCity] = useState("San Francisco");
  const [zip, setZip] = useState("94102");

  const [securitySettings, setSecuritySettings] = useState([
    { id: "tfa", label: "Two-Factor Auth", desc: "Authenticator app or SMS", enabled: true, Icon: Shield },
    { id: "alerts", label: "Login Alerts", desc: "Email on each new login", enabled: true, Icon: Bell },
    { id: "timeout", label: "Session Timeout", desc: "Auto sign-out after 30m", enabled: false, Icon: Lock },
    { id: "api", label: "API Access", desc: "Third-party integrations", enabled: false, Icon: Zap },
  ]);

  const [users, setUsers] = useState([
    { name: "Taban Riak", email: "taban@parkviewresidences.com", role: "Owner", active: true },
    { name: "Jane Miller", email: "jane@parkviewresidences.com", role: "Manager", active: true },
    { name: "Bob Cooper", email: "bob@parkviewresidences.com", role: "Maintenance", active: false },
  ]);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("Manager");

  const handleSaveCompany = () => {
    toast.success("Company profile saved successfully!");
  };

  const handleToggleSecurity = (id: string) => {
    setSecuritySettings(prev =>
      prev.map(s => {
        if (s.id === id) {
          const nextState = !s.enabled;
          toast.success(`${s.label} has been ${nextState ? "enabled" : "disabled"}.`);
          return { ...s, enabled: nextState };
        }
        return s;
      })
    );
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    setUsers(prev => [...prev, { name: newUserName, email: newUserEmail, role: newUserRole, active: true }]);
    toast.success(`User ${newUserName} invited successfully!`);
    setNewUserName("");
    setNewUserEmail("");
    setShowAddUser(false);
  };

  const tabs = [
    { id: "company",  label: "Company",  Icon: Building2 },
    { id: "security", label: "Security", Icon: Shield     },
    { id: "billing",  label: "Billing",  Icon: CreditCard },
    { id: "users",    label: "Users",    Icon: Users      },
  ];

  const inputCls = "w-full px-3.5 py-2.5 bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === t.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            <t.Icon size={16}/>{t.label}
          </button>
        ))}
      </div>
      
      {tab === "company" && (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm max-w-2xl">
          <h3 className="text-base font-semibold text-foreground mb-6">Company Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputCls}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Contact Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} className={inputCls}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className={inputCls}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Address</label>
              <input value={address} onChange={e => setAddress(e.target.value)} className={inputCls}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">City</label>
              <input value={city} onChange={e => setCity(e.target.value)} className={inputCls}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">ZIP</label>
              <input value={zip} onChange={e => setZip(e.target.value)} className={inputCls}/>
            </div>
          </div>
          <div className="flex justify-end mt-6 pt-6 border-t border-border">
            <button onClick={handleSaveCompany} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg px-5 py-2.5 text-sm shadow-sm transition-colors"><Check size={16}/>Save Changes</button>
          </div>
        </div>
      )}
      
      {tab === "security" && (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm max-w-2xl">
          <h3 className="text-base font-semibold text-foreground mb-6">Security Settings</h3>
          <div className="space-y-1">
            {securitySettings.map((s, i, arr) => (
              <div key={s.label} className={`flex items-center justify-between py-4 ${i<arr.length-1?"border-b border-border":""}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0"><s.Icon size={18} className="text-muted-foreground"/></div>
                  <div><p className="text-sm font-medium text-foreground">{s.label}</p><p className="text-xs text-muted-foreground mt-1">{s.desc}</p></div>
                </div>
                <button onClick={() => handleToggleSecurity(s.id)} className={`w-12 h-6 rounded-full relative flex-shrink-0 ml-4 transition-colors ${s.enabled?"bg-primary":"bg-muted"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${s.enabled?"translate-x-6":"translate-x-1"}`}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {tab === "billing" && (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm max-w-2xl space-y-6">
          <h3 className="text-base font-semibold text-foreground">Billing & Subscription</h3>
          <div className="flex items-center justify-between p-5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Current Plan</p>
              <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mt-1">Enterprise Premium Hostel Plan</p>
              <p className="text-xs text-muted-foreground mt-1">Billed annually · $99/month</p>
            </div>
            <span className="px-3 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg">Active</span>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Payment Method</h4>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-muted rounded-lg text-foreground font-semibold text-xs">VISA</div>
                <div>
                  <p className="text-sm font-medium text-foreground">Visa ending in 4242</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Expires 12/28</p>
                </div>
              </div>
              <button className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">Edit</button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Recent Invoices</h4>
            <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {[
                { inv: "INV-0842", date: "Jun 01, 2026", amt: "$1,188.00" },
                { inv: "INV-0711", date: "Jun 01, 2025", amt: "$1,188.00" },
              ].map(inv => (
                <div key={inv.inv} className="flex justify-between items-center p-4 text-sm bg-muted/20">
                  <div>
                    <p className="font-medium text-foreground">{inv.inv}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{inv.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-foreground">{inv.amt}</span>
                    <button className="text-primary hover:underline font-medium">Download</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {tab === "users" && (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm max-w-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-foreground">Team Management</h3>
            <button onClick={() => setShowAddUser(true)} className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm transition-colors">
              <Plus size={16}/>Invite User
            </button>
          </div>

          {showAddUser && (
            <form onSubmit={handleAddUser} className="p-5 border border-primary/20 bg-primary/5 rounded-lg space-y-4">
              <h4 className="text-sm font-semibold text-primary">Invite New Team Member</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Name</label>
                  <input required value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="John Doe" className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Email</label>
                  <input required type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="john@company.com" className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Role</label>
                  <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="Manager">Manager</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 text-sm font-medium">
                <button type="button" onClick={() => setShowAddUser(false)} className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-foreground transition-colors">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors">Send Invitation</button>
              </div>
            </form>
          )}

          <div className="divide-y divide-border">
            {users.map(u => (
              <div key={u.email} className="flex justify-between items-center py-4 text-sm">
                <div className="flex items-center gap-3">
                  <Avatar initials={u.name.split(" ").map(n => n[0]).join("")} size="md"/>
                  <div>
                    <p className="font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-lg text-xs">{u.role}</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${u.active ? "bg-emerald-500" : "bg-slate-300"}`} title={u.active ? "Active" : "Inactive"}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Auth ─────────────────────────────────────────────────────

function AuthPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const field = "w-full px-4 py-2.5 bg-[#141714] border border-[#212521] rounded-lg text-sm text-[#f0f0f0] placeholder-[#808080] focus:outline-none focus:ring-1 focus:ring-[#2fa872] focus:border-[#2fa872] transition-colors min-h-[42px]";
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#060d08]">
      {/* Left panel */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-[#0e120e] border-r border-[#212521] flex-col justify-between p-10 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: "linear-gradient(#2fa872 1px, transparent 1px), linear-gradient(90deg, #2fa872 1px, transparent 1px)", backgroundSize: "32px 32px"}} />
        <div className="relative flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="8" width="9" height="14" rx="2" fill="#2fa872"/>
            <rect x="13" y="2" width="9" height="20" rx="2" fill="#2fa872" opacity="0.45"/>
          </svg>
          <span className="text-white font-bold text-base tracking-tight">Dormir</span>
        </div>
        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight">Hostel management, simplified.</h2>
            <p className="text-[#808080] mt-3 text-sm leading-relaxed">Beds, bookings, payments and maintenance — all in one place.</p>
          </div>
          <div className="space-y-2.5">
            {["Multi-room occupancy tracking", "Booking & allocation management", "Fee collection and payment logs", "Maintenance request pipeline"].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-4 h-4 bg-[#1f381f] rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={9} className="text-[#2fa872]" />
                </div>
                <span className="text-sm text-[#c8c8c8]">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative bg-[#141714] border border-[#212521] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-[#2fa872] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">TR</div>
            <div>
              <p className="text-white text-sm font-semibold">Taban Riak</p>
              <p className="text-[#808080] text-xs">Administrator</p>
            </div>
          </div>
          <p className="text-[#a0a8a0] text-xs leading-relaxed">"Everything I need to run the hostel — from one dashboard."</p>
        </div>
      </div>
      {/* Right — login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 min-h-screen lg:min-h-0">
        <div className="lg:hidden flex items-center gap-2 mb-8 self-start">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="8" width="9" height="14" rx="2" fill="#2fa872"/>
            <rect x="13" y="2" width="9" height="20" rx="2" fill="#2fa872" opacity="0.45"/>
          </svg>
          <span className="font-bold text-white">Dormir</span>
        </div>
        <div className="w-full max-w-[360px]">
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-[#808080] mt-1.5 mb-7">Sign in to your dashboard</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#a0a8a0] mb-1.5">Email address</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@hostel.com" type="email" className={field} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#a0a8a0]">Password</label>
                <button className="text-xs text-[#2fa872] font-medium hover:underline">Forgot password?</button>
              </div>
              <input value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" type="password" className={field} />
            </div>
            <button onClick={onLogin} className="w-full bg-[#2fa872] hover:bg-[#27936400] text-white font-semibold py-2.5 rounded-lg text-sm mt-1 min-h-[42px] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(47,168,114,0.2)]">
              Sign In
            </button>
          </div>
          <button onClick={onLogin} className="w-full mt-3 py-2.5 border border-dashed border-[#2fa872]/30 text-[#2fa872] text-xs font-medium rounded-lg hover:bg-[#1f381f]/50 transition-all">
            ⚡ Skip — Enter dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────

export default function App() {
  const [loggedIn,  setLoggedIn]  = useState(false);
  const [page,      setPage]      = useState<Page>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [dark,      setDark]      = useState(false);
  const [moreOpen,  setMoreOpen]  = useState(false);
  const [summary,   setSummary]   = useState<DashboardSummary | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const totalRooms = summary?.total_rooms ?? 0;
  const totalBeds = summary?.total_beds ?? 0;
  const pendingBookings = summary?.pending_bookings ?? 0;

  const reloadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const [summaryData, payments, bookings] = await Promise.all([
        fetchDashboardSummary(),
        fetchRecentPayments(10),
        fetchRecentBookings(10),
      ]);
      setSummary(summaryData);
      setRecentPayments(payments);
      setRecentBookings(bookings);
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : "Failed to load dashboard");
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    // Dormir uses a permanent dark theme
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    reloadSummary();
  }, [loggedIn, page, reloadSummary]);

  if (!loggedIn) return <AuthPage onLogin={() => setLoggedIn(true)} />;

  const renderPage = () => {
    switch (page) {
      case "dashboard":   return (
        <DashboardPage
          onNavigate={p => setPage(p)}
          summary={summary}
          loading={summaryLoading}
          error={summaryError}
          onReload={reloadSummary}
          recentPayments={recentPayments}
          recentBookings={recentBookings}
        />
      );
      case "units":       return <RoomsPage />;
      case "students":    return <StudentsPage />;
      case "bookings":    return <BookingsPage />;
      case "allocations": return <AllocationsPage />;
      case "payments":    return <PaymentsPage />;
      case "maintenance": return <MaintenancePage />;
      case "reports":     return <ReportsPage dark={dark} />;
      case "settings":    return <SettingsPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#060d08]">
      <TopBar
        activePage={page}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        dark={dark}
        setDark={setDark}
        onLogout={() => setLoggedIn(false)}
        totalRooms={totalRooms}
        pendingBookings={pendingBookings}
        onNavigate={setPage}
      />
      <Sidebar active={page} setActive={setPage} collapsed={collapsed} totalRooms={totalRooms} />
      <BottomNav active={page} setActive={p => { setPage(p); setMoreOpen(false); }} onMore={() => setMoreOpen(true)} />
      {moreOpen && <MoreDrawer active={page} setActive={setPage} onClose={() => setMoreOpen(false)} onLogout={() => setLoggedIn(false)} dark={dark} setDark={setDark} />}
      <main className={`pt-14 pb-20 lg:pt-14 lg:pb-0 transition-all duration-200 ${collapsed ? "lg:ml-14" : "lg:ml-56"}`}>
        <div className="px-4 py-5 lg:px-6 lg:py-6 max-w-[1300px] mx-auto">
          {renderPage()}
        </div>
      </main>
      <Toaster />
    </div>
  );
}