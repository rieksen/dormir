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
import type { DashboardSummary, RecentPayment, RecentBooking } from "./lib/types";


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
      className={`inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl active:scale-95 transition-all ${sm ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"}`}
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
      className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
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
  const [notif, setNotif]   = useState(false);
  const [user,  setUser]    = useState(false);
  const label = NAV_ITEMS.find(n => n.id === activePage)?.label ?? "Dormir";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      {/* Mobile */}
      <div className="lg:hidden h-14 flex items-center px-4 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 size={13} className="text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{label}</span>
        </div>
        <div className="relative flex-shrink-0">
          <button onClick={() => { setNotif(!notif); setUser(false); }} className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Bell size={19} />
            {pendingBookings > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
            )}
          </button>
        </div>
        <div className="relative flex-shrink-0">
          <button onClick={() => { setUser(!user); setNotif(false); }} className="w-10 h-10 flex items-center justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center text-white text-xs font-bold">DR</div>
          </button>
          {user && <UserPanel dark={dark} setDark={setDark} onLogout={onLogout} onClose={() => setUser(false)} />}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex h-16 items-center px-4 gap-3">
        <div className="flex items-center gap-2.5 flex-shrink-0 transition-all" style={{ minWidth: collapsed ? 52 : 224 }}>
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
            <Menu size={18} />
          </button>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Building2 size={13} className="text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Dormir</span>
            </div>
          )}
        </div>
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input placeholder="Search rooms, students…" className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
          </div>
        </div>
        <div className="flex-1" />
        <button onClick={() => setDark(!dark)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <div className="relative">
          <button onClick={() => { setNotif(!notif); setUser(false); }} className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
            <Bell size={17} />
            {pendingBookings > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
            )}
          </button>
        </div>
        <div className="relative ml-1">
          <button onClick={() => { setUser(!user); setNotif(false); }} className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center text-white text-xs font-bold">DR</div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden xl:block">Dormir</span>
            <ChevronDown size={13} className="text-slate-400 dark:text-slate-500 hidden xl:block" />
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
      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-[100] py-1">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Taban Riak</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Administrator</p>
        </div>
        <button onClick={() => setDark(!dark)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
          {dark ? <Sun size={14} className="text-slate-400 dark:text-slate-500" /> : <Moon size={14} className="text-slate-400 dark:text-slate-500" />}
          {dark ? "Light mode" : "Dark mode"}
        </button>
        <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
          <Settings size={14} className="text-slate-400 dark:text-slate-500" />Settings
        </button>
        <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
          <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut size={14} />Sign out
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Desktop sidebar ──────────────────────────────────────────

function Sidebar({ active, setActive, collapsed, totalRooms }: {
  active: Page; setActive: (p: Page) => void; collapsed: boolean; totalRooms: number;
}) {
  return (
    <aside className={`hidden lg:flex fixed top-16 left-0 bottom-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex-col transition-all duration-200 z-40 ${collapsed ? "w-16" : "w-60"}`}>
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const on = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${on ? "bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 dark:text-slate-100"}`}
            >
              <item.Icon size={17} className={`flex-shrink-0 ${on ? "text-emerald-600" : "text-slate-400 dark:text-slate-500"}`} />
              {!collapsed && (
                <span className="flex-1 text-left">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-emerald-50 dark:bg-emerald-900/25 rounded-xl p-3.5 border border-emerald-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 bg-emerald-600 rounded-md flex items-center justify-center">
                <Star size={11} className="text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-700">Plan</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Dormir Management</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{totalRooms ?? "—"} rooms managed</p>
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50">
      <div className="flex items-stretch h-16 px-1">
        {BOTTOM_NAV.map(item => {
          const on = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)} className="flex-1 flex flex-col items-center justify-center gap-1 relative">
              {on && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-emerald-50 dark:bg-emerald-900/250 rounded-full" />}
              <div className={`p-1.5 rounded-xl ${on ? "bg-emerald-50 dark:bg-emerald-900/25" : ""}`}>
                <item.Icon size={22} className={on ? "text-emerald-600" : "text-slate-400 dark:text-slate-500"} />
              </div>
              <span className={`text-[10px] font-semibold leading-none ${on ? "text-emerald-600" : "text-slate-400 dark:text-slate-500"}`}>{item.label}</span>
            </button>
          );
        })}
        <button onClick={onMore} className="flex-1 flex flex-col items-center justify-center gap-1 relative">
          {isMore && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-emerald-50 dark:bg-emerald-900/250 rounded-full" />}
          <div className={`p-1.5 rounded-xl ${isMore ? "bg-emerald-50 dark:bg-emerald-900/25" : ""}`}>
            <LayoutGrid size={22} className={isMore ? "text-emerald-600" : "text-slate-400 dark:text-slate-500"} />
          </div>
          <span className={`text-[10px] font-semibold leading-none ${isMore ? "text-emerald-600" : "text-slate-400 dark:text-slate-500"}`}>More</span>
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
  // Use MORE_NAV items for the grid  
  const grid = MORE_NAV.map(item => {
    let bg = "bg-slate-100";
    let ic = "text-slate-600";
    
    if (item.id === "allocations") { bg = "bg-blue-100"; ic = "text-blue-600"; }
    else if (item.id === "payments") { bg = "bg-emerald-100"; ic = "text-emerald-600"; }
    else if (item.id === "maintenance") { bg = "bg-amber-100"; ic = "text-amber-600"; }
    else if (item.id === "reports") { bg = "bg-violet-100"; ic = "text-violet-600"; }
    else if (item.id === "settings") { bg = "bg-slate-100 dark:bg-slate-800"; ic = "text-slate-600 dark:text-slate-400"; }
    
    return {
      id: item.id,
      label: item.label,
      Icon: item.Icon,
      bg,
      ic,
      badgeKey: item.badgeKey,
    };
  });
  return (
    <>
      <div className="lg:hidden fixed inset-0 bg-black/40 z-[80]" onClick={onClose} />
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl z-[90] shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0">TR</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Taban Riak</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">Kasalita Inn · Admin</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3 px-5 py-5">
          {grid.map(item => {
            const on = active === item.id;
            return (
              <button key={item.id} onClick={() => { setActive(item.id); onClose(); }} className={`flex flex-col items-center gap-2 py-3.5 rounded-2xl transition-all active:scale-95 relative ${on ? "bg-emerald-50 dark:bg-emerald-900/25 ring-1 ring-emerald-200" : "bg-slate-50 dark:bg-slate-800"}`}>
                <div className={`w-10 h-10 ${on ? "bg-emerald-100" : item.bg} rounded-2xl flex items-center justify-center`}>
                  <item.Icon size={18} className={on ? "text-emerald-600" : item.ic} />
                </div>
                <span className={`text-[11px] font-semibold ${on ? "text-emerald-700" : "text-slate-600 dark:text-slate-400"}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="px-5 pb-6 space-y-2">
          <button onClick={() => setDark(!dark)} className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                {dark ? <Sun size={15} className="text-slate-600 dark:text-slate-400" /> : <Moon size={15} className="text-slate-600 dark:text-slate-400" />}
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{dark ? "Light mode" : "Dark mode"}</span>
            </div>
            <div className={`w-11 h-6 rounded-full relative transition-colors ${dark ? "bg-emerald-50 dark:bg-emerald-900/250" : "bg-slate-200 dark:bg-slate-700"}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${dark ? "translate-x-5" : "translate-x-1"}`} />
            </div>
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3.5 bg-red-50 rounded-2xl">
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
              <LogOut size={15} className="text-red-600" />
            </div>
            <span className="text-sm font-semibold text-red-600">Sign out</span>
          </button>
        </div>
      </div>
    </>
  );
}


// ─── Maintenance ──────────────────────────────────────────────

// ─── Reports ──────────────────────────────────────────────────

function ReportsPage({ dark }: { dark: boolean }) {
  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Reports</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {[
          { title: "Revenue Report",    desc: "Monthly and annual revenue breakdown", Icon: DollarSign, ib: "bg-emerald-100", ic: "text-emerald-600" },
          { title: "Occupancy Report",  desc: "Unit occupancy rates and trends",       Icon: Building2,  ib: "bg-blue-100",    ic: "text-blue-600"   },
          { title: "Maintenance Report",desc: "Request volume and resolution times",   Icon: Wrench,     ib: "bg-amber-100",   ic: "text-amber-600"  },
          { title: "Tenant Report",     desc: "Retention and payment reliability",     Icon: Users,      ib: "bg-violet-100",  ic: "text-violet-600" },
        ].map(r => (
          <button key={r.title} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm flex items-start gap-3 hover:border-emerald-300 transition-all text-left group active:scale-[0.99]">
            <div className={`w-10 h-10 ${r.ib} rounded-2xl flex items-center justify-center flex-shrink-0`}><r.Icon size={18} className={r.ic}/></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">{r.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{r.desc}</p>
            </div>
            <ArrowUpRight size={15} className="text-slate-300 group-hover:text-emerald-500 transition-colors mt-0.5 flex-shrink-0"/>
          </button>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Annual Revenue 2024</h3><p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Monthly collected rent</p></div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/25 px-2 py-1 rounded-full flex items-center gap-1"><TrendingUp size={11}/>+8.7% YoY</span>
        </div>
        <BarChart dark={dark} />
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────

function SettingsPage() {
  const [tab, setTab] = useState("company");
  const tabs = [
    { id: "company",  label: "Company",  Icon: Building2 },
    { id: "security", label: "Security", Icon: Shield     },
    { id: "billing",  label: "Billing",  Icon: CreditCard },
    { id: "users",    label: "Users",    Icon: Users      },
  ];
  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Settings</h1>
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-4 px-4 lg:mx-0 lg:px-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 min-h-[44px] ${tab === t.id ? "bg-emerald-600 text-white" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"}`}>
            <t.Icon size={13}/>{t.label}
          </button>
        ))}
      </div>
      {tab === "company" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm max-w-2xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-5">Company Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[["Company Name","Parkview Residences LLC"],["Contact Email","admin@parkviewresidences.com"],["Phone","(415) 555-0200"],["Address","123 Park Ave, San Francisco"],["City","San Francisco"],["ZIP","94102"]].map(([l,v]) => (
              <div key={l}><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{l}</label><input defaultValue={v} className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 min-h-[44px]"/></div>
            ))}
          </div>
          <div className="flex justify-end mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
            <button className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-5 py-3 text-sm"><Check size={14}/>Save Changes</button>
          </div>
        </div>
      )}
      {tab === "security" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm max-w-2xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-5">Security Settings</h3>
          <div className="space-y-1">
            {[
              { label: "Two-Factor Auth",  desc: "Authenticator app or SMS", enabled: true,  Icon: Shield },
              { label: "Login Alerts",     desc: "Email on each new login",  enabled: true,  Icon: Bell   },
              { label: "Session Timeout",  desc: "Auto sign-out after 30m",  enabled: false, Icon: Lock   },
              { label: "API Access",       desc: "Third-party integrations", enabled: false, Icon: Zap    },
            ].map((s, i, arr) => (
              <div key={s.label} className={`flex items-center justify-between py-4 min-h-[68px] ${i<arr.length-1?"border-b border-slate-50":""}`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mt-0.5 flex-shrink-0"><s.Icon size={15} className="text-slate-500 dark:text-slate-400"/></div>
                  <div><p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{s.label}</p><p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{s.desc}</p></div>
                </div>
                <div className={`w-11 h-6 rounded-full relative flex-shrink-0 ml-4 cursor-pointer transition-colors ${s.enabled?"bg-emerald-50 dark:bg-emerald-900/250":"bg-slate-200 dark:bg-slate-700"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${s.enabled?"translate-x-5":"translate-x-1"}`}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {(tab === "billing" || tab === "users") && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 shadow-sm flex flex-col items-center max-w-2xl">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4"><Settings size={22} className="text-slate-400 dark:text-slate-500"/></div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{tabs.find(t2=>t2.id===tab)?.label} Settings</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Coming soon</p>
        </div>
      )}
    </div>
  );
}

// ─── Auth ─────────────────────────────────────────────────────

function AuthPage({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode]   = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [name,  setName]  = useState("");
  const [co,    setCo]    = useState("");
  const field = "w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[52px]";
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-slate-950">
      <div className="hidden lg:flex w-[480px] flex-shrink-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 flex-col justify-between p-12 relative overflow-hidden">
        {[160,280,400,520].map(s=><div key={s} className="absolute rounded-full border border-white/10 pointer-events-none" style={{width:s,height:s,top:"50%",left:"50%",transform:"translate(-50%,-50%)"}}/>)}
        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><Building2 size={16} className="text-white"/></div>
          <span className="text-white font-bold text-lg">APT Manager</span>
        </div>
        <div className="relative space-y-8">
          <div><h2 className="text-4xl font-bold text-white leading-tight">Property management made effortless.</h2><p className="text-emerald-100/80 mt-3 text-base leading-relaxed">The modern platform for landlords who want full control.</p></div>
          <div className="space-y-3">{["Manage all units from one dashboard","Automate rent collection","Track maintenance in real-time","Generate reports instantly"].map(item=><div key={item} className="flex items-center gap-3"><div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"><Check size={11} className="text-white"/></div><span className="text-sm text-white/80">{item}</span></div>)}</div>
          <div className="bg-white/10 rounded-2xl p-5 border border-white/20"><div className="flex items-start gap-3 mb-3"><div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">TR</div><div><p className="text-white text-sm font-semibold">Taban Riak</p><p className="text-white/60 text-xs">Kasalita Inn</p></div></div><p className="text-white/80 text-sm leading-relaxed">"APT Manager transformed how we handle our 120-unit portfolio."</p></div>
        </div>
        <div className="relative flex items-center gap-8">{[["120+","Properties"],["4,800+","Units"],["99.9%","Uptime"]].map(([v,l])=><div key={l}><p className="text-2xl font-bold text-white">{v}</p><p className="text-xs text-white/60 mt-0.5">{l}</p></div>)}</div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-slate-50 dark:bg-slate-950 min-h-screen lg:min-h-0">
        <div className="lg:hidden flex items-center gap-2 mb-8 self-start">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center"><Building2 size={14} className="text-white"/></div>
          <span className="font-bold text-slate-900 dark:text-slate-100">APT Manager</span>
        </div>
        <div className="w-full max-w-[400px]">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{mode==="login"?"Welcome back":"Create account"}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 mb-7">{mode==="login"?"Sign in to your dashboard":"Start your 14-day free trial"}</p>
          <div className="space-y-3">
            {mode==="register"&&<>
              <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Taban Riak" className={field}/></div>
              <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Company Name</label><input value={co} onChange={e=>setCo(e.target.value)} placeholder="Kasalita Inn" className={field}/></div>
            </>}
            <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email address</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" type="email" className={field}/></div>
            <div>
              <div className="flex items-center justify-between mb-1.5"><label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>{mode==="login"&&<button className="text-xs text-emerald-600 font-semibold">Forgot password?</button>}</div>
              <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" type="password" className={field}/>
            </div>
            <button onClick={onLogin} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl text-sm mt-1 min-h-[56px]">
              {mode==="login"?"Sign In →":"Start Free Trial →"}
            </button>
          </div>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-5">
            {mode==="login"?"No account? ":"Have one? "}<button onClick={()=>setMode(mode==="login"?"register":"login")} className="text-emerald-600 font-semibold hover:underline">{mode==="login"?"Start free trial":"Sign in"}</button>
          </p>
          {mode==="login"&&<button onClick={onLogin} className="w-full mt-3 py-3.5 border-2 border-dashed border-emerald-300 text-emerald-600 text-xs font-bold rounded-2xl hover:bg-emerald-50 dark:bg-emerald-900/25 dark:hover:bg-emerald-900/20">⚡ Demo — Enter dashboard</button>}
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
    document.documentElement.style.fontFamily = "'Plus Jakarta Sans', system-ui, sans-serif";
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
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
      <main className={`pt-14 pb-20 lg:pt-16 lg:pb-0 transition-all duration-200 ${collapsed ? "lg:ml-16" : "lg:ml-60"}`}>
        <div className="px-4 py-5 lg:px-6 lg:py-6 max-w-[1300px] mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
