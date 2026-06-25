const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type AlertPage = "payments" | "leases" | "maintenance" | "tenants";

export interface DashboardAlert {
  type: "overdue_payment" | "lease_expiring" | "maintenance";
  title: string;
  detail: string;
  page: AlertPage;
  date: string;
  priority?: string;
}

export interface DashboardSummary {
  units: {
    total: number;
    occupied: number;
    vacant: number;
    maintenance: number;
    items: { id: number; number: string; status: string }[];
  };
  payments: {
    collected: number;
    pending: number;
    overdue: number;
    items: {
      id: number;
      tenant: string;
      unit: string;
      amount: number;
      due: string;
      paid: string | null;
      status: "Paid" | "Pending" | "Overdue";
    }[];
  };
  leases: {
    active: number;
    expiring: number;
    expired: number;
    items: {
      id: number;
      tenant: string;
      unit: string;
      end: string;
      status: string;
    }[];
  };
  maintenance: {
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    items: {
      id: number;
      unit_id: number;
      category: string;
      priority: string;
      status: string;
      description: string;
      submitted_date: string;
    }[];
  };
  tenants: {
    id: number;
    name: string;
    unit: string;
    move_in: string;
  }[];
  alerts: DashboardAlert[];
  alert_count: number;
  badges: {
    payments?: string | null;
    maintenance?: string | null;
  };
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${API}/dashboard/summary`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export function alertDotClass(alert: DashboardAlert): string {
  if (alert.type === "overdue_payment") return "bg-red-500";
  if (alert.type === "lease_expiring") return "bg-amber-500";
  if (alert.priority === "Emergency" || alert.priority === "High") return "bg-red-500";
  return "bg-blue-500";
}

export function navBadgesFromSummary(summary: DashboardSummary | null) {
  if (!summary) return {};
  const { badges } = summary;
  return {
    payments: badges.payments ?? undefined,
    maintenance: badges.maintenance ?? undefined,
  };
}
