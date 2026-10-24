-- ==============================================================================
-- Test Suite: 20261024000001_schema_validation_tests.sql
-- Application: Zaid Trading Wholesale ERP (Sri Lanka)
-- Safe, Isolated Verification Script with Automatic ROLLBACK
-- ==============================================================================

BEGIN;

-- Setup test environment context
DO $$
DECLARE
    v_mw_id UUID;
    v_uom_pack_id UUID;
    v_uom_kg_id UUID;
    v_cat_dairy_id UUID;
    v_cat_grains_id UUID;
    v_prod_milk_id UUID;
    v_prod_rice_id UUID;
    v_cust_id UUID;
    v_supp_id UUID;
    v_pay_method_cash UUID;
    v_inv_id UUID;
    v_pay_id UUID;
    v_je_id UUID;
    v_acc_cash UUID;
    v_acc_sales UUID;
    v_cur_stock NUMERIC(14, 3);
    v_ex_thrown BOOLEAN;
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'STARTING ZAID TRADING ERP SCHEMA VALIDATION TESTS';
    RAISE NOTICE '=====================================================';

    -- Fetch seeded prerequisites
    SELECT id INTO v_mw_id FROM public.warehouses WHERE code = 'MW-01';
    SELECT id INTO v_uom_pack_id FROM public.units_of_measurement WHERE code = 'Pack';
    SELECT id INTO v_uom_kg_id FROM public.units_of_measurement WHERE code = 'Kg';
    SELECT id INTO v_cat_dairy_id FROM public.product_categories WHERE name = 'Dairy & Beverages';
    SELECT id INTO v_cat_grains_id FROM public.product_categories WHERE name = 'Grains & Rice';
    SELECT id INTO v_pay_method_cash FROM public.payment_methods WHERE code = 'CASH';
    SELECT id INTO v_acc_cash FROM public.chart_of_accounts WHERE code = '1010';
    SELECT id INTO v_acc_sales FROM public.chart_of_accounts WHERE code = '4010';

    ASSERT v_mw_id IS NOT NULL, 'Warehouse MW-01 must exist';
    ASSERT v_uom_pack_id IS NOT NULL, 'UOM Pack must exist';
    ASSERT v_uom_kg_id IS NOT NULL, 'UOM Kg must exist';
    ASSERT v_acc_cash IS NOT NULL, 'Account 1010 must exist';
    ASSERT v_acc_sales IS NOT NULL, 'Account 4010 must exist';

    -- -----------------------------------------------------------------
    -- TEST 1: DECIMAL VS INTEGER UOM QUANTITY ENFORCEMENT
    -- -----------------------------------------------------------------
    RAISE NOTICE 'Running Test 1: UOM Decimal Constraints...';
    
    INSERT INTO public.products (sku, name, category_id, uom_id, cost_price, selling_price, min_stock_alert)
    VALUES ('TEST-PACK-01', 'Test Pack Item', v_cat_dairy_id, v_uom_pack_id, 100.00, 150.00, 10.000)
    RETURNING id INTO v_prod_milk_id;

    INSERT INTO public.products (sku, name, category_id, uom_id, cost_price, selling_price, min_stock_alert)
    VALUES ('TEST-KG-01', 'Test Kg Item', v_cat_grains_id, v_uom_kg_id, 200.00, 250.00, 5.000)
    RETURNING id INTO v_prod_rice_id;

    -- 1.1 Non-decimal UOM with fractional stock movement must fail
    v_ex_thrown := false;
    BEGIN
        INSERT INTO public.inventory_movements (warehouse_id, product_id, movement_type, quantity_change, balance_after, reference_no)
        VALUES (v_mw_id, v_prod_milk_id, 'PURCHASE_RECEIPT', 10.500, 10.500, 'TEST-REF-01');
    EXCEPTION WHEN OTHERS THEN
        v_ex_thrown := true;
    END;
    ASSERT v_ex_thrown = true, 'Fractional quantity for Pack item must be rejected by trigger';

    -- 1.2 Decimal UOM with fractional stock movement must succeed
    INSERT INTO public.inventory_movements (warehouse_id, product_id, movement_type, quantity_change, balance_after, reference_no)
    VALUES (v_mw_id, v_prod_rice_id, 'PURCHASE_RECEIPT', 25.750, 0, 'TEST-REF-02');

    SELECT quantity_on_hand INTO v_cur_stock
    FROM public.warehouse_inventory
    WHERE warehouse_id = v_mw_id AND product_id = v_prod_rice_id;
    ASSERT v_cur_stock = 25.750, 'Warehouse stock must correctly store fractional kilograms (25.750)';
    RAISE NOTICE 'Test 1 PASSED: Decimal constraints verified.';

    -- -----------------------------------------------------------------
    -- TEST 2: ATOMIC INVENTORY CONCURRENCY & STOCK UNDERFLOW PREVENTION
    -- -----------------------------------------------------------------
    RAISE NOTICE 'Running Test 2: Atomic Inventory & Underflow Protection...';

    -- 2.1 Attempting to deduct more stock than available must fail
    v_ex_thrown := false;
    BEGIN
        INSERT INTO public.inventory_movements (warehouse_id, product_id, movement_type, quantity_change, balance_after, reference_no)
        VALUES (v_mw_id, v_prod_rice_id, 'SALE_DELIVERY', -30.000, 0, 'TEST-REF-03');
    EXCEPTION WHEN OTHERS THEN
        v_ex_thrown := true;
    END;
    ASSERT v_ex_thrown = true, 'Attempting to deduct more than available stock must trigger exception';

    -- 2.2 Deducting valid stock updates stock and authoritatively computes balance_after
    INSERT INTO public.inventory_movements (warehouse_id, product_id, movement_type, quantity_change, balance_after, reference_no)
    VALUES (v_mw_id, v_prod_rice_id, 'SALE_DELIVERY', -10.250, 999999.000, 'TEST-REF-04'); -- spoofed balance_after

    SELECT quantity_on_hand INTO v_cur_stock
    FROM public.warehouse_inventory
    WHERE warehouse_id = v_mw_id AND product_id = v_prod_rice_id;
    ASSERT v_cur_stock = 15.500, 'Stock must equal 25.750 - 10.250 = 15.500';

    -- Verify the movement row recorded authoritative balance_after, not the spoofed value
    SELECT balance_after INTO v_cur_stock
    FROM public.inventory_movements
    WHERE reference_no = 'TEST-REF-04';
    ASSERT v_cur_stock = 15.500, 'balance_after must be computed authoritatively by the database trigger';
    RAISE NOTICE 'Test 2 PASSED: Inventory atomicity and underflow prevention verified.';

    -- -----------------------------------------------------------------
    -- TEST 3: INVOICE PAYMENT SYNCHRONIZATION & OVERPAYMENT PREVENTION
    -- -----------------------------------------------------------------
    RAISE NOTICE 'Running Test 3: Invoice Payment Accounting & Overpayment Prevention...';

    INSERT INTO public.customers (name, phone, address, credit_limit, credit_days)
    VALUES ('Test Customer Pvt Ltd', '+94 11 000 0000', 'Colombo', 50000.00, 30)
    RETURNING id INTO v_cust_id;

    -- Create invoice for Rs. 50,000
    INSERT INTO public.sales_invoices (invoice_no, warehouse_id, customer_id, subtotal, discount_amount, total_amount, paid_amount, status)
    VALUES ('INV-TEST-001', v_mw_id, v_cust_id, 50000.00, 0.00, 50000.00, 0.00, 'Pending')
    RETURNING id INTO v_inv_id;

    -- 3.1 Partial payment of Rs. 20,000
    INSERT INTO public.payments (payment_no, party_type, customer_id, sales_invoice_id, payment_method_id, amount)
    VALUES ('PAY-TEST-001', 'CUSTOMER', v_cust_id, v_inv_id, v_pay_method_cash, 20000.00);

    -- Verify invoice status remains 'Pending' and paid_amount is Rs. 20,000
    ASSERT (SELECT paid_amount FROM public.sales_invoices WHERE id = v_inv_id) = 20000.00, 'Paid amount must sync to Rs. 20,000';
    ASSERT (SELECT status FROM public.sales_invoices WHERE id = v_inv_id) = 'Pending', 'Invoice status must remain Pending on partial payment';

    -- 3.2 Overpayment attempt (Rs. 40,000 payment when balance is only Rs. 30,000)
    v_ex_thrown := false;
    BEGIN
        INSERT INTO public.payments (payment_no, party_type, customer_id, sales_invoice_id, payment_method_id, amount)
        VALUES ('PAY-TEST-OVER', 'CUSTOMER', v_cust_id, v_inv_id, v_pay_method_cash, 40000.00);
    EXCEPTION WHEN OTHERS THEN
        v_ex_thrown := true;
    END;
    ASSERT v_ex_thrown = true, 'Payment exceeding invoice balance must be rejected by trigger';

    -- 3.3 Full settlement of remaining Rs. 30,000
    INSERT INTO public.payments (payment_no, party_type, customer_id, sales_invoice_id, payment_method_id, amount)
    VALUES ('PAY-TEST-002', 'CUSTOMER', v_cust_id, v_inv_id, v_pay_method_cash, 30000.00);

    ASSERT (SELECT paid_amount FROM public.sales_invoices WHERE id = v_inv_id) = 50000.00, 'Paid amount must sync to full Rs. 50,000';
    ASSERT (SELECT status FROM public.sales_invoices WHERE id = v_inv_id) = 'Paid', 'Invoice status must transition automatically to Paid';
    RAISE NOTICE 'Test 3 PASSED: Payment synchronization and overpayment prevention verified.';

    -- -----------------------------------------------------------------
    -- TEST 4: TRUE DOUBLE-ENTRY JOURNAL BALANCING & IMMUTABILITY
    -- -----------------------------------------------------------------
    RAISE NOTICE 'Running Test 4: Double-Entry Journal Balancing & Immutability...';

    -- 4.1 Attempting to insert journal entry with status POSTED and 0 lines must fail
    v_ex_thrown := false;
    BEGIN
        INSERT INTO public.journal_entries (entry_no, description, status, total_debit, total_credit)
        VALUES ('JV-TEST-001', 'Zero line entry', 'POSTED', 1000.00, 1000.00);
    EXCEPTION WHEN OTHERS THEN
        v_ex_thrown := true;
    END;
    ASSERT v_ex_thrown = true, 'Posting journal entry with zero lines must be rejected';

    -- 4.2 Create DRAFT entry and unbalanced lines
    INSERT INTO public.journal_entries (entry_no, description, status, total_debit, total_credit)
    VALUES ('JV-TEST-002', 'Draft test entry', 'DRAFT', 0.00, 0.00)
    RETURNING id INTO v_je_id;

    INSERT INTO public.journal_entry_lines (journal_entry_id, account_id, debit, credit)
    VALUES (v_je_id, v_acc_cash, 10000.00, 0.00);
    INSERT INTO public.journal_entry_lines (journal_entry_id, account_id, debit, credit)
    VALUES (v_je_id, v_acc_sales, 0.00, 5000.00); -- unbalanced (10k debit vs 5k credit)

    -- Attempting to transition to POSTED must fail due to line imbalance
    v_ex_thrown := false;
    BEGIN
        UPDATE public.journal_entries SET status = 'POSTED' WHERE id = v_je_id;
    EXCEPTION WHEN OTHERS THEN
        v_ex_thrown := true;
    END;
    ASSERT v_ex_thrown = true, 'Posting unbalanced journal entry must be rejected';

    -- Balance the lines
    UPDATE public.journal_entry_lines 
    SET credit = 10000.00 
    WHERE journal_entry_id = v_je_id AND account_id = v_acc_sales;

    -- Now transition to POSTED must succeed
    UPDATE public.journal_entries SET status = 'POSTED' WHERE id = v_je_id;
    ASSERT (SELECT status FROM public.journal_entries WHERE id = v_je_id) = 'POSTED', 'Journal entry must be POSTED';
    ASSERT (SELECT total_debit FROM public.journal_entries WHERE id = v_je_id) = 10000.00, 'Header total_debit must equal lines sum (10000.00)';
    ASSERT (SELECT total_credit FROM public.journal_entries WHERE id = v_je_id) = 10000.00, 'Header total_credit must equal lines sum (10000.00)';

    -- 4.3 Immutability check: Attempting to modify lines of a POSTED journal entry must fail
    v_ex_thrown := false;
    BEGIN
        UPDATE public.journal_entry_lines 
        SET debit = 20000.00 
        WHERE journal_entry_id = v_je_id AND account_id = v_acc_cash;
    EXCEPTION WHEN OTHERS THEN
        v_ex_thrown := true;
    END;
    ASSERT v_ex_thrown = true, 'Modifying lines of a POSTED journal entry must be rejected';
    RAISE NOTICE 'Test 4 PASSED: Double-entry balancing and immutability verified.';

    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'ALL TESTS PASSED SUCCESSFULLY! ROLLING BACK TRANSACTION.';
    RAISE NOTICE '=====================================================';
END $$;

-- Guarantee zero database pollution:
ROLLBACK;
