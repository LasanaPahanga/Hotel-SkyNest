# Fix: Payment Breakdown Error

## Problem
When processing a payment, you get the error:
```
Table 'skynest_hotels.payment_breakdowns' doesn't exist
```

This happens because the `payment_breakdowns` table is missing from your database.

## What is payment_breakdowns?
This table stores detailed breakdown of payment calculations including:
- Room charges
- Service charges
- Subtotal
- Discount amount
- Tax amount
- Fee amount
- Grand total
- Complete breakdown in JSON format

## Quick Fix (10 seconds)

Run this single command:

```bash
mysql -u root -p < database/add_payment_breakdowns_table.sql
```

**OR** if you need to add multiple missing tables at once:

```bash
mysql -u root -p < database/add_tax_discount_fee_tables.sql
```

This file now includes:
- ✅ `branch_tax_config`
- ✅ `branch_discount_config`
- ✅ `branch_fee_config`
- ✅ `payment_breakdowns` (NEW!)

## Verify the Fix

```bash
mysql -u root -p
```

```sql
USE skynest_hotels;

-- Check if table exists
SHOW TABLES LIKE 'payment_breakdowns';

-- View table structure
DESCRIBE payment_breakdowns;

-- Exit
exit
```

## Table Structure

```sql
CREATE TABLE payment_breakdowns (
    breakdown_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL UNIQUE,
    room_charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
    services_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_config_id INT NULL,
    total_before_tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    fees_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    grand_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    breakdown_json JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## How It Works

When you process a payment (especially full payment), the system:

1. **Calculates breakdown:**
   - Room charges (based on nights stayed)
   - Service charges (from service usage)
   - Subtotal (room + services)
   - Applies discount (if promo code used)
   - Calculates total before tax
   - Applies taxes (VAT, Service Tax, etc.)
   - Adds fees (late checkout, no-show, etc.)
   - Calculates grand total

2. **Saves to payment_breakdowns:**
   - Stores all calculated amounts
   - Saves complete breakdown as JSON
   - Links to booking via `booking_id`
   - Links to discount config if discount applied

3. **Used for:**
   - Displaying payment breakdown to users
   - Generating detailed receipts
   - Financial reporting
   - Audit trail

## After the Fix

Once the table is created, you can:

✅ **Process payments** - Full or partial payments work
✅ **View breakdown** - See detailed payment calculation
✅ **Generate receipts** - Complete breakdown on receipts
✅ **Apply discounts** - Promo codes tracked properly
✅ **Track taxes** - All taxes recorded
✅ **Record fees** - Late checkout, no-show fees saved

## Test the Fix

1. **Restart backend** (if running):
   ```bash
   cd backend
   npm start
   ```

2. **Try processing a payment:**
   - Go to a booking
   - Click "Make Payment" or "Quick Payment"
   - Enter amount and payment method
   - Click "Process Payment"

3. **Expected result:**
   - ✅ Payment processes successfully
   - ✅ No error about missing table
   - ✅ Payment breakdown saved
   - ✅ Receipt can be generated

## Troubleshooting

### Still getting the error?

1. **Check if table was created:**
   ```sql
   USE skynest_hotels;
   SHOW TABLES LIKE 'payment_breakdowns';
   ```

2. **Check table structure:**
   ```sql
   DESCRIBE payment_breakdowns;
   ```

3. **Verify foreign keys:**
   ```sql
   SHOW CREATE TABLE payment_breakdowns;
   ```

### Table created but payment still fails?

Check backend console for other errors. The issue might be:
- Missing `branch_discount_config` table (run the full fix file)
- Database connection issue
- Backend service error

## What Was Fixed

✅ Added `payment_breakdowns` table to `COMPLETE_DATABASE_SETUP.sql`  
✅ Created standalone fix file: `add_payment_breakdowns_table.sql`  
✅ Updated comprehensive fix file: `add_tax_discount_fee_tables.sql`  
✅ Table includes all required fields for payment processing  
✅ Proper foreign keys and indexes added  

## Related Tables

The payment system uses these tables together:
- `bookings` - Main booking information
- `payments` - Individual payment records
- `payment_breakdowns` - Detailed breakdown (1 per booking)
- `branch_tax_config` - Tax configurations
- `branch_discount_config` - Discount/promo codes
- `branch_fee_config` - Fee configurations

All these tables are now included in the complete setup!

---

**Status**: Ready to fix! Run the command and try processing a payment again.
