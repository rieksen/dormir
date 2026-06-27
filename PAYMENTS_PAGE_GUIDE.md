# 💰 PaymentsPage User Guide

## Overview
The PaymentsPage manages student fees and payments in a fee-based architecture where fees are automatically generated when allocations are created, and payments are recorded against those fees.

---

## 🏗️ Architecture

```
┌─────────────┐
│  Allocation │ (Student gets assigned a bed)
└──────┬──────┘
       │ Auto-generates
       ↓
┌─────────────┐
│     Fee     │ (Amount due for the period)
└──────┬──────┘
       │ Student makes
       ↓
┌─────────────┐
│   Payment   │ (Amount paid towards fee)
└─────────────┘

Balance = Fee Amount Due - Sum(All Payments)
```

---

## 📊 Page Layout

### 1. Summary Cards (Top)
Three KPI cards showing:
- **Total Due** (Blue) - Sum of all fee amounts
- **Collected** (Green) - Sum of all payments made
- **Outstanding** (Red) - Total remaining balances

### 2. Filter Tabs
- **All Fees** - Shows all fees regardless of status
- **Outstanding** - Only fees with balance > 0
- **Paid in Full** - Only fees with balance = 0

### 3. Fee List
Each card displays:
- Student name
- Academic period
- Balance amount (highlighted)
- Status badge (Paid/Outstanding)
- Breakdown: Due | Paid | # of Payments

**Visual Cues:**
- ✅ Green background = Fully paid
- ⚠️ Red badge = Outstanding balance

---

## 🎬 Workflows

### Record a Payment

1. **Click "Record Payment" button** (top right)

2. **Select Fee from dropdown**
   - Only shows fees with outstanding balance
   - Format: `{Student Name} | {Period} | Balance: {Amount}`

3. **Fee Details Auto-Display**
   - Amount Due
   - Already Paid
   - Remaining Balance

4. **Enter Payment Details**
   - **Amount** - Cannot exceed balance (validation active)
   - **Date** - Date payment was received
   - **Method** - Cash / Mobile Money / Bank Transfer
   - **Reference** - Optional transaction reference

5. **Click "Save Payment"**
   - Payment recorded
   - Balance updates automatically
   - Payment appears in history

### View Fee Details

1. **Click any fee card** in the list

2. **Detail Drawer Opens** showing:
   - Student & Period info
   - Three-column breakdown (Due/Paid/Balance)
   - Complete payment history with:
     - Amount paid
     - Date received
     - Payment method
     - Reference number

3. **Quick Actions:**
   - **Pay Now** button (if balance > 0) - Pre-fills form with remaining balance

---

## 💡 Key Features

### Overpayment Protection
- Frontend validates amount ≤ balance
- Backend prevents overpayment with error message
- User sees: "Overpayment — balance remaining is {amount} UGX"

### Balance Calculation
Automatic on frontend:
```typescript
balance = fee.amount_due - sum(payments.amount_paid)
```

### Payment History
- Each fee maintains complete payment log
- Chronological display
- Shows payment method & reference
- Helps with reconciliation & auditing

### Smart Filtering
- **Outstanding filter** - Focus on unpaid fees
- **Paid filter** - Review completed payments
- Counter badges show count per filter

---

## 📱 Mobile Experience

- Responsive card layout
- Swipe-friendly drawer
- Large touch targets (min 44px)
- Bottom sheet modal on small screens

---

## 🎨 Design System

### Status Colors
- 🔵 Blue - Total amounts / Informational
- 🟢 Green - Paid / Collected / Success
- 🔴 Red - Outstanding / Overdue / Alert

### Typography
- Bold amounts for financial figures
- Uppercase labels for data fields
- Clear hierarchy (student name > period > details)

---

## 🧪 Testing Checklist

### Basic Operations
- [ ] View all fees with correct student names
- [ ] Summary cards show accurate totals
- [ ] Filter tabs work correctly
- [ ] Fee cards display proper balance

### Record Payment
- [ ] Fee dropdown only shows outstanding fees
- [ ] Amount validation prevents overpayment
- [ ] Payment date picker works
- [ ] Method selection (cash/mobile/bank) works
- [ ] Optional reference field saves
- [ ] Payment saves successfully
- [ ] Balance updates after payment

### Fee Detail Drawer
- [ ] Opens on fee card click
- [ ] Shows correct balance breakdown
- [ ] Payment history displays all payments
- [ ] Payment details (date/method/ref) visible
- [ ] "Pay Now" button pre-fills form
- [ ] Close button works

### Edge Cases
- [ ] Zero balance fees show "Paid" badge
- [ ] Fees with no payments show empty history
- [ ] Large amounts format correctly (UGX 1,000,000)
- [ ] Long student names don't break layout

---

## 🔧 Troubleshooting

### "No fees found"
**Cause:** No allocations created yet  
**Fix:** 
1. Go to Bookings page
2. Confirm a pending booking
3. Go to Allocations page
4. Create allocation for that booking
5. Fee auto-generates
6. Return to Payments page

### "Overpayment error"
**Cause:** Trying to pay more than balance  
**Fix:** Enter amount ≤ balance shown in fee details

### Fee missing student name
**Cause:** Student deleted after fee created  
**Result:** Shows "Unknown" - data integrity issue  
**Fix:** Prevent student deletion if fees exist (future enhancement)

---

## 📈 Future Enhancements (Production)

- [ ] Export payment receipts (PDF)
- [ ] Bulk payment upload (CSV/Excel)
- [ ] Email payment confirmation
- [ ] SMS payment notification
- [ ] Payment refund workflow
- [ ] Partial payment reminders
- [ ] Payment due date alerts
- [ ] Financial reports & analytics
- [ ] Multi-currency support
- [ ] Payment plan/installment support

---

## 🔗 Related Pages

- **Students** - View student information
- **Allocations** - Where fees are generated
- **Bookings** - Booking must be confirmed before allocation
- **Dashboard** - Summary of all financial KPIs

---

## 🚀 Quick Start

### For Development:
```bash
# 1. Ensure backend running
cd backend
uv run uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# 2. Seed data if needed
uv run python seed_dormir.py

# 3. Start frontend
cd ../frontend
npm run dev

# 4. Navigate to http://localhost:5173/
# 5. Click "Payments" in navigation
```

### Test Workflow:
1. View existing fees (6 from seed data)
2. Click fee to see detail
3. Click "Record Payment"
4. Select fee, enter amount
5. Save and verify balance updates

---

**Enjoy the new PaymentsPage! 💰✨**

For bugs or questions, check `TASK_4_COMPLETE.md` for technical details.
