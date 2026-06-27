/**
 * PaymentsPage — Fee-Based Payment Management
 * 
 * Architecture:
 * - Fees are auto-generated when allocations are created
 * - Payments link to fees (not directly to students)
 * - Balance = Fee amount_due - sum of all payments for that fee
 * - Displays: Student → Fee → Payment History → Balance
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, X, Check, Loader2, AlertCircle, DollarSign,
  Clock, AlertTriangle, Receipt, CreditCard,
} from "lucide-react";

import { listFees } from "../lib/api/fees";
import { listPayments, createPayment } from "../lib/api/payments";
import { listStudents } from "../lib/api/students";
import { listPeriods } from "../lib/api/periods";
import type { Fee, Payment, Student, AcademicPeriod, PaymentCreate } from "../lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FeeWithDetails extends Fee {
  student_name: string;
  period_name: string;
  total_paid: number;
  balance: number;
  payments: Payment[];
}

interface PaymentFormData {
  fee_id: string;
  amount_paid: string;
  paid_on: string;
  method: string;
  reference: string;
}

const EMPTY_FORM: PaymentFormData = {
  fee_id: "", amount_paid: "", paid_on: "", method: "cash", reference: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (v: number) => `UGX ${v.toLocaleString()}`;
const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const inputCls = "w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 min-h-[44px]";

// ── Payment Modal ─────────────────────────────────────────────────────────────

function PaymentModal({
  feesWithDetails,
  form,
  setForm,
  onClose,
  onSave,
  saving,
}: {
  feesWithDetails: FeeWithDetails[];
  form: PaymentFormData;
  setForm: React.Dispatch<React.SetStateAction<PaymentFormData>>;
  onClose: () => void;
  onSave: () => Promise<void>;
  saving: boolean;
}) {
  const selectedFee = feesWithDetails.find(f => f.id === Number(form.fee_id));
  const maxAmount = selectedFee ? selectedFee.balance : 0;
  const canSave = form.fee_id && form.amount_paid && form.paid_on && Number(form.amount_paid) > 0 && Number(form.amount_paid) <= maxAmount;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100]">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Record Payment</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Select Fee</label>
            <select value={form.fee_id} onChange={(e) => setForm(p => ({ ...p, fee_id: e.target.value }))} className={inputCls}>
              <option value="">-- Select Student Fee --</option>
              {feesWithDetails.filter(f => f.balance > 0).map(f => (
                <option key={f.id} value={f.id}>
                  {f.student_name} | {f.period_name} | Balance: {formatCurrency(f.balance)}
                </option>
              ))}
            </select>
          </div>

          {selectedFee && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/25 rounded-xl text-xs text-blue-700 dark:text-blue-400">
              <p className="font-semibold mb-1">Fee Details:</p>
              <p>Amount Due: {formatCurrency(selectedFee.amount_due)}</p>
              <p>Paid: {formatCurrency(selectedFee.total_paid)}</p>
              <p className="font-bold">Balance: {formatCurrency(selectedFee.balance)}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Amount (UGX)</label>
              <input
                type="number"
                value={form.amount_paid}
                onChange={(e) => setForm(p => ({ ...p, amount_paid: e.target.value }))}
                placeholder="e.g. 500000"
                max={maxAmount}
                className={inputCls}
              />
              {Number(form.amount_paid) > maxAmount && (
                <p className="text-xs text-red-600 mt-1">Cannot exceed balance: {formatCurrency(maxAmount)}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Payment Date</label>
              <input
                type="date"
                value={form.paid_on}
                onChange={(e) => setForm(p => ({ ...p, paid_on: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Payment Method</label>
              <select value={form.method} onChange={(e) => setForm(p => ({ ...p, method: e.target.value }))} className={inputCls}>
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Reference (optional)</label>
              <input
                value={form.reference}
                onChange={(e) => setForm(p => ({ ...p, reference: e.target.value }))}
                placeholder="e.g. TXN123456"
                className={inputCls}
              />
            </div>
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
            Save Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Fee Detail Drawer ─────────────────────────────────────────────────────────

function FeeDetailDrawer({ fee, onClose, onPayNow }: { fee: FeeWithDetails; onClose: () => void; onPayNow: () => void; }) {
  const isPaidInFull = fee.balance === 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[90]" onClick={onClose} />
      <div className="fixed inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-96 bg-white dark:bg-slate-900 shadow-2xl z-[100] flex flex-col border-l border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Fee Detail</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Student + Balance hero */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{fee.period_name}</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">{fee.student_name}</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold mb-1">Due</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(fee.amount_due)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold mb-1">Paid</p>
                <p className="text-sm font-bold text-emerald-600">{formatCurrency(fee.total_paid)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold mb-1">Balance</p>
                <p className={`text-sm font-bold ${isPaidInFull ? "text-emerald-600" : "text-red-600"}`}>
                  {formatCurrency(fee.balance)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Receipt size={12} />
              Payment History ({fee.payments.length})
            </h3>
            {fee.payments.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">No payments yet</p>
            ) : (
              <div className="space-y-2">
                {fee.payments.map(p => (
                  <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(p.amount_paid)}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(p.paid_on)} · {p.method.replace("_", " ")}
                      </p>
                      {p.reference && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ref: {p.reference}</p>
                      )}
                    </div>
                    <CreditCard size={14} className="text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pay Now CTA */}
          {!isPaidInFull && (
            <button
              onClick={onPayNow}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2"
            >
              <DollarSign size={15} />
              Pay Now · {formatCurrency(fee.balance)} remaining
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);

  const [feesWithDetails, setFeesWithDetails] = useState<FeeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [filter, setFilter] = useState<"all" | "outstanding" | "paid">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [detailFee, setDetailFee] = useState<FeeWithDetails | null>(null);
  const [form, setForm] = useState<PaymentFormData>(EMPTY_FORM);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [feesData, paymentsData, studentsData, periodsData] = await Promise.all([
        listFees(),
        listPayments(),
        listStudents(),
        listPeriods(),
      ]);

      setFees(feesData);
      setPayments(paymentsData);
      setStudents(studentsData);
      setPeriods(periodsData);

      // Combine fees with details
      const enriched: FeeWithDetails[] = feesData.map(fee => {
        const student = studentsData.find(s => s.id === fee.student_id);
        const period = periodsData.find(p => p.id === fee.period_id);
        const feePayments = paymentsData.filter(p => p.fee_id === fee.id);
        const total_paid = feePayments.reduce((sum, p) => sum + p.amount_paid, 0);
        const balance = fee.amount_due - total_paid;

        return {
          ...fee,
          student_name: student ? `${student.first_name} ${student.last_name}` : "Unknown",
          period_name: period?.name ?? "Unknown Period",
          total_paid,
          balance,
          payments: feePayments,
        };
      });

      setFeesWithDetails(enriched);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Create Payment ───────────────────────────────────────────────────────────

  const handleCreatePayment = async () => {
    setSaving(true);
    try {
      const payload: PaymentCreate = {
        fee_id: Number(form.fee_id),
        amount_paid: Number(form.amount_paid),
        paid_on: form.paid_on,
        method: form.method,
        reference: form.reference || undefined,
      };

      await createPayment(payload);
      await fetchAll();
      setAddOpen(false);
      setForm(EMPTY_FORM);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const openPayNowFromDetail = () => {
    if (!detailFee) return;
    const today = new Date().toISOString().split("T")[0];
    setForm({
      fee_id: String(detailFee.id),
      amount_paid: String(detailFee.balance),
      paid_on: today,
      method: "cash",
      reference: "",
    });
    setDetailFee(null);
    setAddOpen(true);
  };

  // ── Filter ───────────────────────────────────────────────────────────────────

  const filteredFees = feesWithDetails.filter(f => {
    if (filter === "outstanding") return f.balance > 0;
    if (filter === "paid") return f.balance === 0;
    return true;
  });

  // ── Summary Stats ────────────────────────────────────────────────────────────

  const totalDue = feesWithDetails.reduce((sum, f) => sum + f.amount_due, 0);
  const totalCollected = feesWithDetails.reduce((sum, f) => sum + f.total_paid, 0);
  const totalOutstanding = feesWithDetails.reduce((sum, f) => sum + f.balance, 0);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Payments & Fees</h1>
        <button
          onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-3 py-2 text-xs active:scale-95 transition-all"
        >
          <Plus size={14} />Record Payment
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

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 animate-pulse h-20" />
          ))
        ) : (
          <>
            <div className="bg-blue-50 dark:bg-blue-900/25 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Receipt size={13} className="text-blue-600" />
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Total Due</span>
              </div>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400 truncate">{formatCurrency(totalDue)}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/25 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={13} className="text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Collected</span>
              </div>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 truncate">{formatCurrency(totalCollected)}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/25 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={13} className="text-red-600" />
                <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">Outstanding</span>
              </div>
              <p className="text-lg font-bold text-red-700 dark:text-red-400 truncate">{formatCurrency(totalOutstanding)}</p>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {[
          { key: "all", label: "All Fees" },
          { key: "outstanding", label: "Outstanding" },
          { key: "paid", label: "Paid in Full" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 min-h-[36px] ${
              filter === key
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            {label}
            <span className="ml-1.5 opacity-70">
              {key === "all" && feesWithDetails.length}
              {key === "outstanding" && feesWithDetails.filter(f => f.balance > 0).length}
              {key === "paid" && feesWithDetails.filter(f => f.balance === 0).length}
            </span>
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-24" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fee Cards */}
      {!loading && (
        <div className="space-y-3">
          {filteredFees.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">No fees found.</div>
          ) : (
            filteredFees.map(fee => {
              const isPaidInFull = fee.balance === 0;
              return (
                <div
                  key={fee.id}
                  onClick={() => setDetailFee(fee)}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.99] ${
                    isPaidInFull
                      ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10"
                      : "border-slate-100 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{fee.student_name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{fee.period_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">{formatCurrency(fee.balance)}</p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${
                          isPaidInFull
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {isPaidInFull ? "Paid" : "Outstanding"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold mb-0.5">Due</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatCurrency(fee.amount_due)}</p>
                    </div>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/25 rounded-xl">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold mb-0.5">Paid</p>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(fee.total_paid)}</p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold mb-0.5">Payments</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{fee.payments.length}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modals */}
      {addOpen && (
        <PaymentModal
          feesWithDetails={feesWithDetails}
          form={form}
          setForm={setForm}
          onClose={() => setAddOpen(false)}
          onSave={handleCreatePayment}
          saving={saving}
        />
      )}

      {detailFee && (
        <FeeDetailDrawer
          fee={detailFee}
          onClose={() => setDetailFee(null)}
          onPayNow={openPayNowFromDetail}
        />
      )}
    </div>
  );
}
