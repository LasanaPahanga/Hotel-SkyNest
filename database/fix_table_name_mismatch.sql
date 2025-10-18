-- ============================================
-- FIX TABLE NAME MISMATCH
-- Create views to make old table names work with new tables
-- ============================================

USE skynest_hotels;

-- ============================================
-- Create view for tax_configurations
-- Maps to branch_tax_config
-- ============================================
DROP VIEW IF EXISTS tax_configurations;
CREATE VIEW tax_configurations AS
SELECT 
    tax_config_id,
    branch_id,
    tax_name,
    tax_type,
    tax_rate,
    TRUE as is_percentage,  -- All taxes in branch_tax_config are percentage-based
    is_active,
    effective_from,
    effective_to,
    created_at,
    updated_at
FROM branch_tax_config;

-- ============================================
-- Create view for discount_configurations
-- Maps to branch_discount_config
-- ============================================
DROP VIEW IF EXISTS discount_configurations;
CREATE VIEW discount_configurations AS
SELECT 
    discount_config_id,
    branch_id,
    discount_name,
    discount_type,
    discount_value,
    applicable_on,
    min_booking_amount,
    max_discount_amount,
    is_active,
    valid_from,
    valid_to as valid_until,
    promo_code,
    usage_limit,
    usage_count,
    created_at,
    updated_at
FROM branch_discount_config;

SELECT 'Table name compatibility views created successfully!' as Status;
SELECT 'Payment services will now work with tax and discount calculations' as Info;
