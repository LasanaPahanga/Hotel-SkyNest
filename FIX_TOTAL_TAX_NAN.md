# Fix: Total Tax Showing "NaN"

## Problem

In the payment checkout page, "Total Tax" displays as "LKRNaN" instead of the correct amount (e.g., "LKR 2,390.00").

Individual taxes show correctly:
- Service Tax (10%): LKR 650.00 ✅
- VAT (12%): LKR 1,740.00 ✅
- Total Tax: LKRNaN ❌

## Root Cause

**Field name mismatch** between backend and frontend:

- **Backend returns:** `tax_amount` and `fees_amount`
- **Frontend expects:** `total_tax` and `total_fees`

When the frontend tries to display `breakdown.total_tax`, it's `undefined`, which causes `NaN` (Not a Number) when passed to `formatCurrency()`.

## The Fix

Added `total_tax` and `total_fees` fields to the backend response (in addition to the existing `tax_amount` and `fees_amount` fields) to match frontend expectations.

### Files Updated

1. **`backend/services/completePaymentService.js`** - Line 362, 367
2. **`backend/services/simplePaymentService.js`** - Line 271, 276

### Changes Made

```javascript
// Before (only had tax_amount)
taxes: taxes,
tax_amount: parseFloat(totalTax.toFixed(2)),

// After (added total_tax)
taxes: taxes,
tax_amount: parseFloat(totalTax.toFixed(2)),
total_tax: parseFloat(totalTax.toFixed(2)),
```

Same for fees:
```javascript
// Before (only had fees_amount)
fees: fees,
fees_amount: parseFloat(totalFees.toFixed(2)),

// After (added total_fees)
fees: fees,
fees_amount: parseFloat(totalFees.toFixed(2)),
total_fees: parseFloat(totalFees.toFixed(2)),
```

## Action Required

**Restart Backend:**
```bash
cd backend
npm start
```

**Hard Refresh Browser:**
Press **Ctrl+Shift+R** (or **Cmd+Shift+R** on Mac)

## Test It

1. Go to Booking #9
2. Click "Make Payment (Full Breakdown)"
3. **Expected Result:**

```
Taxes
Service Tax (10%)     LKR 650.00
VAT (12%)             LKR 1,740.00
Total Tax             LKR 2,390.00  ✅ (No more NaN!)
```

## Why Both Fields?

We keep both `tax_amount` and `total_tax` for backward compatibility:
- `tax_amount` - Used by some parts of the system
- `total_tax` - Used by the payment gateway frontend

Same for fees:
- `fees_amount` - Used by some parts of the system
- `total_fees` - Used by the payment gateway frontend

## Summary

**Issue:** Frontend expected `total_tax` but backend only returned `tax_amount`  
**Fix:** Backend now returns both fields  
**Action:** Restart backend server  
**Result:** Total Tax displays correctly (LKR 2,390.00)  

---

**Status**: Fixed! Just restart the backend and refresh the browser.
