/**
 * PaymentsPage — pending payments with confirm action
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Check, Loader2, AlertCircle, CreditCard, Clock, DollarSign,
} from "lucide-react";
import { listPendingPayments, confirmPayment } from "../lib/api/payments";
import type { Payment, PaymentType } from "../lib/types";

const formatCurrency = (v: number) => `UGX ${v.toLocaleString()}`;
const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirming, setConfirming] = useState<number | null>(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPayments(await listPendingPayments());
    } catch (err: any) {
      setError(err.message ?? "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const handleConfirm = async (payment: Payment, paymentType: PaymentType) => {
    const typeLabel = paymentType === "booking" ? "Booking Payment" : "Full Payment";
    if (!confirm(`Confirm ${typeLabel} of ${formatCurrency(payment.amount)} for ${payment.student_name}?`)) return;
    setConfirming(payment.id);
    try {
      await confirmPayment(payment.id, paymentType);
      // Remove from pending list
      setPayments(prev => prev.filter(p => p.id !== payment.id));
    } catch (err: any) {
      alert(err.message ?? "Failed to confirm payment");
    } finally {
      setConfirming(null);
    }
  };

  const filtered = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return payments.filter(p =>
      p.student_name.toLowerCase().includes(t) ||
      p.room_number.toLowerCase().includes(t)
    );
  }, [payments, searchTerm]);

  const totalPending = payments.reduce((s, p) => s + p.amount, 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 size={28} className="text-primary animate-spin" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading payments…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <AlertCircle size={32} className="text-red-500" />
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-sm">{error}</p>
      <button onClick={loadPayments} className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-sm font-semibold rounded-lg shadow-sm active:scale-[0.98] transition-all">
        Retry
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Payments</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150/80 dark:border-slate-800/80 p-4 shadow-sm">
          <p className="text-xl font-bold text-amber-600 dark:text-amber-450">{payments.length}</p>
          <p className="text-xs font-medium text-slate-500 mt-1.5 font-semibold">Pending</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150/80 dark:border-slate-800/80 p-4 shadow-sm">
          <p className="text-xl font-bold text-primary truncate">{formatCurrency(totalPending)}</p>
          <p className="text-xs font-medium text-slate-500 mt-1.5 font-semibold">Outstanding</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-455 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search by student name or room…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
        />
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-150/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <CreditCard size={32} className="mx-auto text-slate-300 dark:text-slate-650 mb-3" />
            <p className="text-sm text-slate-450 dark:text-slate-550">
              {searchTerm ? "No payments match your search" : "No pending payments"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {filtered.map(payment => (
              <div key={payment.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{payment.student_name}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>{payment.room_number} · Bed {payment.bed_number}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-slate-400" />
                        {payment.semester} {payment.year}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-amber-650 dark:text-amber-400 mt-1">{formatCurrency(payment.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleConfirm(payment, "booking")}
                      disabled={confirming === payment.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50 active:scale-[0.98]"
                      title="Confirm Booking Payment"
                    >
                      {confirming === payment.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Check size={13} />}
                      Booking
                    </button>
                    <button
                      onClick={() => handleConfirm(payment, "full_payment")}
                      disabled={confirming === payment.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50 active:scale-[0.98]"
                      title="Confirm Full Payment"
                    >
                      {confirming === payment.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <DollarSign size={13} />}
                      Full Payment
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}