# Fix: "Failed to load taxes" Error

## Problem
The frontend shows "Failed to load taxes" error because the database is missing the tax, discount, and fee configuration tables that the backend API depends on.

## Missing Tables
- `branch_tax_config` - Tax configurations per branch
- `branch_discount_config` - Discount configurations per branch  
- `branch_fee_config` - Fee configurations per branch

## Solution

### Quick Fix (10 seconds)

Run this single command to add the missing tables and seed data:

```bash
mysql -u root -p < database/add_tax_discount_fee_tables.sql
```

This will:
- ✅ Create the 3 missing configuration tables
- ✅ Add default tax configurations (VAT 12%, Service Tax 10%) for all branches
- ✅ Add default fee configurations (Late Checkout, No Show, Cancellation) for all branches
- ✅ Not affect your existing data

### Alternative: Re-run Complete Setup

If you want a clean start with all fixes:

```bash
mysql -u root -p < database/COMPLETE_DATABASE_SETUP.sql
```

## Verify the Fix

```bash
mysql -u root -p
```

```sql
USE skynest_hotels;

-- Check if tables exist
SHOW TABLES LIKE '%config';

-- Verify tax configurations
SELECT * FROM branch_tax_config;

-- Verify fee configurations  
SELECT * FROM branch_fee_config;

-- Exit
exit
```

You should see:
- `branch_tax_config` table with VAT and Service Tax for each branch
- `branch_discount_config` table (empty initially)
- `branch_fee_config` table with Late Checkout, No Show, and Cancellation fees

## Restart Backend

After fixing the database:

```bash
cd backend
npm start
```

Look for: "Database connected successfully"

## Refresh Browser

Press **Ctrl+Shift+R** (or **Cmd+Shift+R** on Mac) to hard refresh.

## Expected Result

After the fix:

### Tax & Discounts Page
- ✅ No more "Failed to load taxes" error
- ✅ Shows stats: Active Taxes, Active Discounts, Impact on Bookings
- ✅ Displays tax table with VAT (12%) and Service Tax (10%)
- ✅ Can add/edit/delete taxes (Admin only)
- ✅ Can toggle tax status (Admin/Receptionist)

### Fees Page
- ✅ No more "Failed to load fees" error
- ✅ Shows active fees impact
- ✅ Displays fee table with Late Checkout, No Show, Cancellation
- ✅ Can add/edit/delete fees (Admin only)
- ✅ Can toggle fee status (Admin/Receptionist)

## Styling

Both pages already have the dashboard-style background and modern UI:
- ✅ Background image (dashboard.jpeg)
- ✅ Stats cards with icons
- ✅ Clean table layouts
- ✅ Color-coded status badges
- ✅ Responsive design

## What Was Fixed

### Database
✅ Added `branch_tax_config` table to `COMPLETE_DATABASE_SETUP.sql`  
✅ Added `branch_discount_config` table to `COMPLETE_DATABASE_SETUP.sql`  
✅ Added `branch_fee_config` table to `COMPLETE_DATABASE_SETUP.sql`  
✅ Added seed data for default taxes and fees  
✅ Created quick-fix SQL file: `add_tax_discount_fee_tables.sql`  

### Frontend
✅ Tax & Discounts page already has dashboard styling  
✅ Fees page already has dashboard styling  
✅ Both pages use CommonPage.css for consistent look  

## Default Configurations Added

### Taxes (Per Branch)
- **VAT**: 12% - Applied to all bookings
- **Service Tax**: 10% - Applied to all bookings
- **Total Tax Impact**: +22% on booking price

### Fees (Per Branch)
- **Late Checkout**: Rs. 1,000/hour - Grace period: 60 minutes
- **No Show**: 50% of total - Grace period: 24 hours  
- **Cancellation**: 25% of total - No grace period

## How It Works

### Tax Calculation
When a booking is created:
1. System fetches active taxes for the branch
2. Calculates tax amount based on room charges + services
3. Adds tax to total booking amount
4. Stores tax details in `booking_taxes` table

### Fee Application
When applicable:
1. Late checkout detected → Calculates hourly fee
2. No show detected → Applies percentage of total
3. Cancellation requested → Applies cancellation fee
4. Stores fee details in `booking_fees` table

## Troubleshooting

### Still seeing errors?
1. **Check backend console** for database connection errors
2. **Verify tables exist**: Run `SHOW TABLES;` in MySQL
3. **Check branch data**: Ensure `hotel_branches` table has data
4. **Restart backend**: Sometimes needed after database changes

### Tables created but no data?
```sql
-- Manually insert default taxes
INSERT INTO branch_tax_config (branch_id, tax_name, tax_type, tax_rate, effective_from, is_active)
VALUES (1, 'VAT', 'VAT', 12.00, CURDATE(), TRUE);

-- Manually insert default fees
INSERT INTO branch_fee_config (branch_id, fee_type, fee_calculation, fee_value, grace_period_minutes, is_active)
VALUES (1, 'Late Checkout', 'Per Hour', 1000.00, 60, TRUE);
```

---

**Status**: Ready to fix! Run the quick fix command and refresh your browser.
