-- ==============================================================================
-- Migration: 20261024000001_initial_zaid_erp_schema.sql
-- Application: Zaid Trading Wholesale ERP (Sri Lanka)
-- Base Currency: LKR (Rs.)
-- Default Warehouse: Main Warehouse (MW-01)
-- Architecture: Hardened PostgreSQL on Supabase with Atomic Concurrency,
--               Double-Entry Accounting, Race-Safe RBAC, and Decimal-UOM Support.
-- ==============================================================================

-- 0. EXTENSIONS & PREREQUISITES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. BASE CONFIGURATION & WAREHOUSES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_name TEXT NOT NULL DEFAULT 'ZAID TRADING (PVT) LTD',
    currency TEXT NOT NULL DEFAULT 'LKR',
    vat_tin TEXT DEFAULT '102938475-7000',
    address TEXT NOT NULL DEFAULT 'No. 45/A, Warehouse Complex, Peliyagoda, Colombo',
    phone TEXT DEFAULT '+94 11 234 5678',
    email TEXT DEFAULT 'info@zaidtrading.lk',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Default Warehouse MW-01 (Idempotent)
INSERT INTO public.warehouses (code, name, address, is_active)
VALUES ('MW-01', 'Main Warehouse', 'Peliyagoda Complex, Colombo 15', true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, address = EXCLUDED.address, is_active = EXCLUDED.is_active;

-- Seed Default Company Profile (Idempotent)
INSERT INTO public.company_settings (trade_name, currency, vat_tin, address, phone, email)
SELECT 'ZAID TRADING (PVT) LTD', 'LKR', '102938475-7000', 'No. 45/A, Warehouse Complex, Peliyagoda, Colombo', '+94 11 234 5678', 'info@zaidtrading.lk'
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings);

-- ==============================================================================
-- 2. USER ACCESS ROLES & RACE-SAFE INITIAL ADMIN BOOTSTRAP
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'clerk')),
    full_name TEXT NOT NULL,
    default_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Helper function: fetch role of the currently authenticated user
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT role FROM public.user_roles WHERE id = auth.uid();
$$;

-- Helper function: check if authenticated user has at least one of the specified roles
CREATE OR REPLACE FUNCTION public.auth_has_role(VARIADIC allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE id = auth.uid() AND role = ANY(allowed_roles)
    );
$$;

-- Race-safe initial admin bootstrap trigger on auth.users
-- Uses transaction-level advisory locks to prevent concurrent signup race conditions
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_has_admin BOOLEAN;
    v_mw_id UUID;
BEGIN
    -- Acquire exclusive transaction lock to serialize first-admin creation
    PERFORM pg_advisory_xact_lock(hashtext('zaid_erp_initial_admin_lock'));

    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO v_has_admin;
    SELECT id INTO v_mw_id FROM public.warehouses WHERE code = 'MW-01' LIMIT 1;

    INSERT INTO public.user_roles (id, role, full_name, default_warehouse_id)
    VALUES (
        NEW.id,
        CASE WHEN NOT v_has_admin THEN 'admin' ELSE 'clerk' END,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'ERP Staff'),
        v_mw_id
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_signup ON auth.users;
CREATE TRIGGER trg_user_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_signup();

-- Protection trigger on public.user_roles to prevent privilege escalation & last-admin deletion
CREATE OR REPLACE FUNCTION public.protect_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller_role TEXT;
    v_admin_count INT;
BEGIN
    -- Allow internal system bypass (e.g. auth trigger without session)
    IF auth.uid() IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    v_caller_role := public.get_auth_role();

    -- Only active admin can change roles
    IF v_caller_role <> 'admin' THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can modify user role assignments.';
    END IF;

    -- Guard against demoting or deleting the last admin
    IF (TG_OP = 'DELETE' AND OLD.role = 'admin') OR 
       (TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role <> 'admin') THEN
        SELECT COUNT(*) INTO v_admin_count FROM public.user_roles WHERE role = 'admin';
        IF v_admin_count <= 1 THEN
            RAISE EXCEPTION 'Action Rejected: System requires at least one active administrator.';
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_roles ON public.user_roles;
CREATE TRIGGER trg_protect_user_roles
    BEFORE UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.protect_user_roles();

-- ==============================================================================
-- 3. PRODUCT CATALOG, UNITS OF MEASUREMENT & DECIMAL SUPPORT
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.units_of_measurement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    allow_decimals BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed core categories & UOM
INSERT INTO public.product_categories (name, description) VALUES
    ('Dairy & Beverages', 'Milk powders, condensed milk, teas, and canned drinks'),
    ('Flour & Bakery', 'Special wheat flour, yeast, and baking ingredients'),
    ('Snacks & Biscuits', 'Cream crackers, sweet biscuits, and bulk snack packs'),
    ('Tea & Coffee', 'Ceylon BOPF, black teas, and packaged coffee'),
    ('Grains & Rice', 'White raw rice, samba, basmati, and bulk grain bags'),
    ('Household Care', 'Detergent powders, soaps, and cleaning supplies')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.units_of_measurement (code, name, allow_decimals) VALUES
    ('Pack', 'Packet', false),
    ('Box', 'Carton / Box', false),
    ('Kg', 'Kilogram', true),
    ('Bag', 'Bulk Bag (25-50kg)', false),
    ('Unit', 'Single Unit', false)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    uom_id UUID REFERENCES public.units_of_measurement(id) ON DELETE RESTRICT,
    cost_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    selling_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= 0),
    min_stock_alert NUMERIC(14, 3) NOT NULL DEFAULT 10.000 CHECK (min_stock_alert >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);

-- ==============================================================================
-- 4. PARTIES (CUSTOMERS, SUPPLIERS, PAYMENT METHODS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.payment_methods (code, name) VALUES
    ('CASH', 'Cash in Hand (Store Drawer)'),
    ('BANK_TRANSFER', 'Commercial Bank Current Account (#8921)'),
    ('CHEQUE', 'Post-Dated Cheque (15 Days)'),
    ('CREDIT', 'Trade Account Credit')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'Wholesale' CHECK (account_type IN ('Wholesale', 'Retail', 'Regular')),
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    credit_limit NUMERIC(14, 2) DEFAULT 0.00 CHECK (credit_limit >= 0),
    credit_days INTEGER NOT NULL DEFAULT 14 CHECK (credit_days >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    payment_terms TEXT DEFAULT '15 Days Net',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);

-- ==============================================================================
-- 5. ATOMIC INVENTORY STOCK & AUDIT MOVEMENTS (DECIMAL & CONCURRENCY SAFE)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.warehouse_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity_on_hand NUMERIC(14, 3) NOT NULL DEFAULT 0.000 CHECK (quantity_on_hand >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (warehouse_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wh_inv_lookup ON public.warehouse_inventory(warehouse_id, product_id);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    movement_type TEXT NOT NULL CHECK (movement_type IN (
        'PURCHASE_RECEIPT',
        'SALE_DELIVERY',
        'STOCK_ADJUSTMENT',
        'PURCHASE_RETURN',
        'SALE_RETURN'
    )),
    quantity_change NUMERIC(14, 3) NOT NULL CHECK (quantity_change <> 0),
    balance_after NUMERIC(14, 3) NOT NULL CHECK (balance_after >= 0),
    reference_no TEXT NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inv_mov_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_mov_ref ON public.inventory_movements(reference_no);
CREATE INDEX IF NOT EXISTS idx_inv_mov_date ON public.inventory_movements(created_at);

-- Atomic inventory posting trigger:
-- Locks the target warehouse_inventory row FOR UPDATE, calculates balance_after authoritatively,
-- updates stock, and guarantees zero negative balance even under high concurrent load.
CREATE OR REPLACE FUNCTION public.process_atomic_inventory_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_current_stock NUMERIC(14, 3);
    v_new_stock NUMERIC(14, 3);
    v_allow_decimals BOOLEAN;
BEGIN
    -- Check UOM decimal restriction for product
    SELECT u.allow_decimals INTO v_allow_decimals
    FROM public.products p
    JOIN public.units_of_measurement u ON p.uom_id = u.id
    WHERE p.id = NEW.product_id;

    IF NOT COALESCE(v_allow_decimals, false) AND (NEW.quantity_change <> TRUNC(NEW.quantity_change)) THEN
        RAISE EXCEPTION 'Unit of measurement for product % does not permit fractional quantities (%).', 
            NEW.product_id, NEW.quantity_change;
    END IF;

    -- Ensure record exists in warehouse_inventory with row-level lock
    SELECT quantity_on_hand INTO v_current_stock
    FROM public.warehouse_inventory
    WHERE warehouse_id = NEW.warehouse_id AND product_id = NEW.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        IF NEW.quantity_change < 0 THEN
            RAISE EXCEPTION 'Stock Underflow: No existing stock found for product in specified warehouse.';
        END IF;
        
        INSERT INTO public.warehouse_inventory (warehouse_id, product_id, quantity_on_hand)
        VALUES (NEW.warehouse_id, NEW.product_id, 0.000);
        v_current_stock := 0.000;
    END IF;

    v_new_stock := v_current_stock + NEW.quantity_change;

    IF v_new_stock < 0 THEN
        RAISE EXCEPTION 'Insufficient stock. Product % has % on hand; cannot deduct %.',
            NEW.product_id, v_current_stock, ABS(NEW.quantity_change);
    END IF;

    -- Database authoritative assignment of balance_after (ignores any client spoofing)
    NEW.balance_after := v_new_stock;

    -- Mutate warehouse stock balance
    UPDATE public.warehouse_inventory
    SET quantity_on_hand = v_new_stock,
        updated_at = now()
    WHERE warehouse_id = NEW.warehouse_id AND product_id = NEW.product_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_process_atomic_movement ON public.inventory_movements;
CREATE TRIGGER trg_process_atomic_movement
    BEFORE INSERT ON public.inventory_movements
    FOR EACH ROW EXECUTE FUNCTION public.process_atomic_inventory_movement();

-- Stock adjustments
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_no TEXT NOT NULL UNIQUE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('INCREASE', 'DECREASE')),
    quantity NUMERIC(14, 3) NOT NULL CHECK (quantity > 0),
    reason TEXT NOT NULL CHECK (reason IN (
        'Stock Count Correction',
        'Damaged Goods',
        'Expired Goods',
        'Lost Goods / Theft',
        'Internal Warehouse Transfer'
    )),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 6. SALES INVOICES, PURCHASES & ATOMIC PAYMENT SYNCHRONIZATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sales_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no TEXT NOT NULL UNIQUE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Overdue', 'Void')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Enforce overpayment integrity constraint
    CONSTRAINT paid_amount_le_total CHECK (paid_amount <= total_amount)
);

CREATE INDEX IF NOT EXISTS idx_sales_inv_no ON public.sales_invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_sales_inv_cust ON public.sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_inv_date ON public.sales_invoices(invoice_date);

CREATE TABLE IF NOT EXISTS public.sales_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.sales_invoices(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC(14, 3) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(14, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_sales_item_inv ON public.sales_invoice_items(invoice_id);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number TEXT NOT NULL UNIQUE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    status TEXT NOT NULL DEFAULT 'Ordered' CHECK (status IN ('Draft', 'Ordered', 'Received', 'Cancelled')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT po_paid_le_total CHECK (paid_amount <= total_amount)
);

CREATE INDEX IF NOT EXISTS idx_po_number ON public.purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON public.purchase_orders(supplier_id);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC(14, 3) NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(14, 2) NOT NULL CHECK (unit_cost >= 0),
    subtotal NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_po_item_po ON public.purchase_order_items(purchase_order_id);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_no TEXT NOT NULL UNIQUE,
    party_type TEXT NOT NULL CHECK (party_type IN ('CUSTOMER', 'SUPPLIER')),
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    sales_invoice_id UUID REFERENCES public.sales_invoices(id) ON DELETE SET NULL,
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
    payment_method_id UUID NOT NULL REFERENCES public.payment_methods(id) ON DELETE RESTRICT,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_party CHECK (
        (party_type = 'CUSTOMER' AND customer_id IS NOT NULL AND supplier_id IS NULL) OR
        (party_type = 'SUPPLIER' AND supplier_id IS NOT NULL AND customer_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_payments_party ON public.payments(party_type, customer_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_payments_inv ON public.payments(sales_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_po ON public.payments(purchase_order_id);

-- Payment synchronization & overpayment prevention trigger
CREATE OR REPLACE FUNCTION public.sync_payment_accounting()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_inv_id UUID;
    v_po_id UUID;
    v_total_amount NUMERIC(14, 2);
    v_total_paid NUMERIC(14, 2);
BEGIN
    v_inv_id := COALESCE(NEW.sales_invoice_id, OLD.sales_invoice_id);
    v_po_id := COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

    -- 1. Synchronize Customer Sales Invoice Payments
    IF v_inv_id IS NOT NULL THEN
        -- Lock invoice header row to serialize payment processing
        SELECT total_amount INTO v_total_amount
        FROM public.sales_invoices
        WHERE id = v_inv_id
        FOR UPDATE;

        IF FOUND THEN
            SELECT COALESCE(SUM(amount), 0.00)
            INTO v_total_paid
            FROM public.payments
            WHERE sales_invoice_id = v_inv_id;

            IF v_total_paid > v_total_amount THEN
                RAISE EXCEPTION 'Payment Rejected: Total payment Rs. % exceeds sales invoice balance of Rs. %.',
                    v_total_paid, v_total_amount;
            END IF;

            UPDATE public.sales_invoices
            SET paid_amount = v_total_paid,
                status = CASE 
                    WHEN v_total_paid >= v_total_amount THEN 'Paid'
                    ELSE 'Pending'
                END
            WHERE id = v_inv_id;
        END IF;
    END IF;

    -- 2. Synchronize Supplier Purchase Order Payments
    IF v_po_id IS NOT NULL THEN
        SELECT total_amount INTO v_total_amount
        FROM public.purchase_orders
        WHERE id = v_po_id
        FOR UPDATE;

        IF FOUND THEN
            SELECT COALESCE(SUM(amount), 0.00)
            INTO v_total_paid
            FROM public.payments
            WHERE purchase_order_id = v_po_id;

            IF v_total_paid > v_total_amount THEN
                RAISE EXCEPTION 'Payment Rejected: Total payment Rs. % exceeds purchase order total of Rs. %.',
                    v_total_paid, v_total_amount;
            END IF;

            UPDATE public.purchase_orders
            SET paid_amount = v_total_paid
            WHERE id = v_po_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_payment_accounting ON public.payments;
CREATE TRIGGER trg_sync_payment_accounting
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.sync_payment_accounting();

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_no TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    payment_method_id UUID NOT NULL REFERENCES public.payment_methods(id) ON DELETE RESTRICT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 7. DOUBLE-ENTRY ACCOUNTING (TRUE LINE-LEVEL BALANCING & IMMUTABILITY)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    normal_balance TEXT NOT NULL CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed standard accounts
INSERT INTO public.chart_of_accounts (code, name, account_type, normal_balance) VALUES
    ('1010', 'Cash in Hand (Store Drawer)', 'ASSET', 'DEBIT'),
    ('1020', 'Commercial Bank Current Account', 'ASSET', 'DEBIT'),
    ('1030', 'Trade Accounts Receivable', 'ASSET', 'DEBIT'),
    ('1040', 'Merchandise Inventory Stock', 'ASSET', 'DEBIT'),
    ('2010', 'Trade Accounts Payable', 'LIABILITY', 'CREDIT'),
    ('3010', 'Owner Equity & Capital', 'EQUITY', 'CREDIT'),
    ('4010', 'Wholesale Sales Revenue', 'REVENUE', 'CREDIT'),
    ('5010', 'Cost of Goods Sold (COGS)', 'EXPENSE', 'DEBIT'),
    ('5020', 'Operating & Utility Expenses', 'EXPENSE', 'DEBIT'),
    ('5030', 'Logistics & Transport Fuel', 'EXPENSE', 'DEBIT'),
    ('5040', 'Staff Salaries & Overtime', 'EXPENSE', 'DEBIT')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_no TEXT NOT NULL UNIQUE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    reference_no TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'POSTED', 'VOID')),
    total_debit NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_debit >= 0),
    total_credit NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_credit >= 0),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT posted_must_balance CHECK (status <> 'POSTED' OR (total_debit = total_credit AND total_debit > 0))
);

CREATE INDEX IF NOT EXISTS idx_je_entry_no ON public.journal_entries(entry_no);
CREATE INDEX IF NOT EXISTS idx_je_date ON public.journal_entries(entry_date);

CREATE TABLE IF NOT EXISTS public.journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    debit NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (debit >= 0),
    credit NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (credit >= 0),
    description TEXT,
    CONSTRAINT debit_xor_credit CHECK (
        (debit > 0 AND credit = 0) OR
        (credit > 0 AND debit = 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_jel_entry ON public.journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_jel_account ON public.journal_entry_lines(account_id);

-- Enforce true line-level double entry balancing when posting a journal entry
CREATE OR REPLACE FUNCTION public.verify_and_post_journal_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sum_debit NUMERIC(14, 2);
    v_sum_credit NUMERIC(14, 2);
    v_line_count INT;
BEGIN
    -- If entry transitions to or is inserted as POSTED
    IF NEW.status = 'POSTED' THEN
        SELECT 
            COALESCE(SUM(debit), 0.00),
            COALESCE(SUM(credit), 0.00),
            COUNT(*)
        INTO v_sum_debit, v_sum_credit, v_line_count
        FROM public.journal_entry_lines
        WHERE journal_entry_id = NEW.id;

        IF v_line_count < 2 THEN
            RAISE EXCEPTION 'Double-Entry Violation: Journal entry % must have at least 2 lines to post (found %).',
                NEW.entry_no, v_line_count;
        END IF;

        IF v_sum_debit = 0 OR v_sum_credit = 0 THEN
            RAISE EXCEPTION 'Double-Entry Violation: Journal entry % debits and credits must be non-zero.', NEW.entry_no;
        END IF;

        IF v_sum_debit <> v_sum_credit THEN
            RAISE EXCEPTION 'Double-Entry Imbalance: Journal entry % lines do not balance. Total Debit: Rs. %, Total Credit: Rs. %.',
                NEW.entry_no, v_sum_debit, v_sum_credit;
        END IF;

        -- Header totals must strictly reflect line totals
        NEW.total_debit := v_sum_debit;
        NEW.total_credit := v_sum_credit;
    END IF;

    -- Prevent tampering with an already POSTED journal header (except state transition to VOID)
    IF TG_OP = 'UPDATE' AND OLD.status = 'POSTED' THEN
        IF NEW.status = 'POSTED' AND (
            NEW.entry_no <> OLD.entry_no OR
            NEW.entry_date <> OLD.entry_date OR
            NEW.total_debit <> OLD.total_debit OR
            NEW.total_credit <> OLD.total_credit
        ) THEN
            RAISE EXCEPTION 'Audit Violation: Posted journal entry % is immutable and cannot be edited.', OLD.entry_no;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verify_and_post_journal ON public.journal_entries;
CREATE TRIGGER trg_verify_and_post_journal
    BEFORE INSERT OR UPDATE ON public.journal_entries
    FOR EACH ROW EXECUTE FUNCTION public.verify_and_post_journal_entry();

-- Prevent inserting, updating, or deleting lines belonging to an already POSTED entry
CREATE OR REPLACE FUNCTION public.protect_posted_journal_lines()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_parent_status TEXT;
    v_parent_id UUID;
BEGIN
    v_parent_id := COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);

    SELECT status INTO v_parent_status
    FROM public.journal_entries
    WHERE id = v_parent_id;

    IF v_parent_status = 'POSTED' THEN
        RAISE EXCEPTION 'Audit Violation: Cannot modify or delete lines of a POSTED journal entry.';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_posted_lines ON public.journal_entry_lines;
CREATE TRIGGER trg_protect_posted_lines
    BEFORE INSERT OR UPDATE OR DELETE ON public.journal_entry_lines
    FOR EACH ROW EXECUTE FUNCTION public.protect_posted_journal_lines();

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES — IDEMPOTENT & LEAST PRIVILEGE
-- ==============================================================================

-- Enable RLS on all ERP tables
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units_of_measurement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- 8.1 Company Settings & Warehouses
DROP POLICY IF EXISTS "company_settings_read" ON public.company_settings;
CREATE POLICY "company_settings_read" ON public.company_settings
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "company_settings_admin_write" ON public.company_settings;
CREATE POLICY "company_settings_admin_write" ON public.company_settings
    FOR ALL TO authenticated USING (public.auth_has_role('admin'))
    WITH CHECK (public.auth_has_role('admin'));

DROP POLICY IF EXISTS "warehouses_read" ON public.warehouses;
CREATE POLICY "warehouses_read" ON public.warehouses
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "warehouses_admin_write" ON public.warehouses;
CREATE POLICY "warehouses_admin_write" ON public.warehouses
    FOR ALL TO authenticated USING (public.auth_has_role('admin'))
    WITH CHECK (public.auth_has_role('admin'));

-- 8.2 User Roles Security (Anti-Privilege Escalation)
DROP POLICY IF EXISTS "user_roles_read_own_or_admin" ON public.user_roles;
CREATE POLICY "user_roles_read_own_or_admin" ON public.user_roles
    FOR SELECT TO authenticated 
    USING (id = auth.uid() OR public.auth_has_role('admin', 'manager'));

DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;
CREATE POLICY "user_roles_admin_manage" ON public.user_roles
    FOR ALL TO authenticated 
    USING (public.auth_has_role('admin'))
    WITH CHECK (public.auth_has_role('admin'));

-- 8.3 Catalog, Categories, and Units of Measurement
DROP POLICY IF EXISTS "catalog_read" ON public.products;
CREATE POLICY "catalog_read" ON public.products
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "catalog_write_manager_admin" ON public.products;
CREATE POLICY "catalog_write_manager_admin" ON public.products
    FOR ALL TO authenticated USING (public.auth_has_role('admin', 'manager'))
    WITH CHECK (public.auth_has_role('admin', 'manager'));

DROP POLICY IF EXISTS "categories_read" ON public.product_categories;
CREATE POLICY "categories_read" ON public.product_categories
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "categories_write_manager_admin" ON public.product_categories;
CREATE POLICY "categories_write_manager_admin" ON public.product_categories
    FOR ALL TO authenticated USING (public.auth_has_role('admin', 'manager'))
    WITH CHECK (public.auth_has_role('admin', 'manager'));

DROP POLICY IF EXISTS "uom_read" ON public.units_of_measurement;
CREATE POLICY "uom_read" ON public.units_of_measurement
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "uom_write_manager_admin" ON public.units_of_measurement;
CREATE POLICY "uom_write_manager_admin" ON public.units_of_measurement
    FOR ALL TO authenticated USING (public.auth_has_role('admin', 'manager'))
    WITH CHECK (public.auth_has_role('admin', 'manager'));

-- 8.4 Customers & Suppliers
DROP POLICY IF EXISTS "customers_read" ON public.customers;
CREATE POLICY "customers_read" ON public.customers
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "customers_write_operational" ON public.customers;
CREATE POLICY "customers_write_operational" ON public.customers
    FOR ALL TO authenticated USING (public.auth_has_role('admin', 'manager', 'cashier'))
    WITH CHECK (public.auth_has_role('admin', 'manager', 'cashier'));

DROP POLICY IF EXISTS "suppliers_read" ON public.suppliers;
CREATE POLICY "suppliers_read" ON public.suppliers
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "suppliers_write_manager_admin" ON public.suppliers;
CREATE POLICY "suppliers_write_manager_admin" ON public.suppliers
    FOR ALL TO authenticated USING (public.auth_has_role('admin', 'manager'))
    WITH CHECK (public.auth_has_role('admin', 'manager'));

DROP POLICY IF EXISTS "payment_methods_read" ON public.payment_methods;
CREATE POLICY "payment_methods_read" ON public.payment_methods
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "payment_methods_admin" ON public.payment_methods;
CREATE POLICY "payment_methods_admin" ON public.payment_methods
    FOR ALL TO authenticated USING (public.auth_has_role('admin'))
    WITH CHECK (public.auth_has_role('admin'));

-- 8.5 Inventory Stock & Movement Audits
DROP POLICY IF EXISTS "warehouse_inventory_read" ON public.warehouse_inventory;
CREATE POLICY "warehouse_inventory_read" ON public.warehouse_inventory
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "warehouse_inventory_manage" ON public.warehouse_inventory;
CREATE POLICY "warehouse_inventory_manage" ON public.warehouse_inventory
    FOR ALL TO authenticated USING (public.auth_has_role('admin', 'manager'))
    WITH CHECK (public.auth_has_role('admin', 'manager'));

DROP POLICY IF EXISTS "inventory_movements_read" ON public.inventory_movements;
CREATE POLICY "inventory_movements_read" ON public.inventory_movements
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "inventory_movements_insert" ON public.inventory_movements;
CREATE POLICY "inventory_movements_insert" ON public.inventory_movements
    FOR INSERT TO authenticated 
    WITH CHECK (public.auth_has_role('admin', 'manager', 'clerk', 'cashier'));

-- Movements are audit records; prevent UPDATE or DELETE
DROP POLICY IF EXISTS "stock_adjustments_read" ON public.stock_adjustments;
CREATE POLICY "stock_adjustments_read" ON public.stock_adjustments
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "stock_adjustments_insert" ON public.stock_adjustments;
CREATE POLICY "stock_adjustments_insert" ON public.stock_adjustments
    FOR INSERT TO authenticated 
    WITH CHECK (public.auth_has_role('admin', 'manager', 'clerk'));

-- 8.6 Sales Invoices & Purchases
DROP POLICY IF EXISTS "sales_invoices_read" ON public.sales_invoices;
CREATE POLICY "sales_invoices_read" ON public.sales_invoices
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "sales_invoices_insert" ON public.sales_invoices;
CREATE POLICY "sales_invoices_insert" ON public.sales_invoices
    FOR INSERT TO authenticated 
    WITH CHECK (public.auth_has_role('admin', 'manager', 'cashier'));

DROP POLICY IF EXISTS "sales_invoices_update" ON public.sales_invoices;
CREATE POLICY "sales_invoices_update" ON public.sales_invoices
    FOR UPDATE TO authenticated 
    USING (public.auth_has_role('admin', 'manager', 'cashier'))
    WITH CHECK (public.auth_has_role('admin', 'manager', 'cashier'));

DROP POLICY IF EXISTS "sales_invoice_items_read" ON public.sales_invoice_items;
CREATE POLICY "sales_invoice_items_read" ON public.sales_invoice_items
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "sales_invoice_items_write" ON public.sales_invoice_items;
CREATE POLICY "sales_invoice_items_write" ON public.sales_invoice_items
    FOR ALL TO authenticated 
    USING (public.auth_has_role('admin', 'manager', 'cashier'))
    WITH CHECK (public.auth_has_role('admin', 'manager', 'cashier'));

DROP POLICY IF EXISTS "purchase_orders_read" ON public.purchase_orders;
CREATE POLICY "purchase_orders_read" ON public.purchase_orders
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "purchase_orders_write" ON public.purchase_orders;
CREATE POLICY "purchase_orders_write" ON public.purchase_orders
    FOR ALL TO authenticated 
    USING (public.auth_has_role('admin', 'manager'))
    WITH CHECK (public.auth_has_role('admin', 'manager'));

DROP POLICY IF EXISTS "purchase_order_items_read" ON public.purchase_order_items;
CREATE POLICY "purchase_order_items_read" ON public.purchase_order_items
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "purchase_order_items_write" ON public.purchase_order_items;
CREATE POLICY "purchase_order_items_write" ON public.purchase_order_items
    FOR ALL TO authenticated 
    USING (public.auth_has_role('admin', 'manager'))
    WITH CHECK (public.auth_has_role('admin', 'manager'));

-- 8.7 Payments & Expenses
DROP POLICY IF EXISTS "payments_read" ON public.payments;
CREATE POLICY "payments_read" ON public.payments
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "payments_insert" ON public.payments;
CREATE POLICY "payments_insert" ON public.payments
    FOR INSERT TO authenticated 
    WITH CHECK (public.auth_has_role('admin', 'manager', 'cashier'));

DROP POLICY IF EXISTS "payments_admin_update" ON public.payments;
CREATE POLICY "payments_admin_update" ON public.payments
    FOR UPDATE TO authenticated 
    USING (public.auth_has_role('admin', 'manager'))
    WITH CHECK (public.auth_has_role('admin', 'manager'));

DROP POLICY IF EXISTS "expenses_read" ON public.expenses;
CREATE POLICY "expenses_read" ON public.expenses
    FOR SELECT TO authenticated 
    USING (public.auth_has_role('admin', 'manager', 'cashier'));

DROP POLICY IF EXISTS "expenses_write" ON public.expenses;
CREATE POLICY "expenses_write" ON public.expenses
    FOR ALL TO authenticated 
    USING (public.auth_has_role('admin', 'manager', 'cashier'))
    WITH CHECK (public.auth_has_role('admin', 'manager', 'cashier'));

-- 8.8 Double-Entry Accounting & Ledger (Strict Isolation)
DROP POLICY IF EXISTS "chart_of_accounts_read" ON public.chart_of_accounts;
CREATE POLICY "chart_of_accounts_read" ON public.chart_of_accounts
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "chart_of_accounts_admin" ON public.chart_of_accounts;
CREATE POLICY "chart_of_accounts_admin" ON public.chart_of_accounts
    FOR ALL TO authenticated 
    USING (public.auth_has_role('admin', 'manager'))
    WITH CHECK (public.auth_has_role('admin', 'manager'));

DROP POLICY IF EXISTS "journal_entries_read" ON public.journal_entries;
CREATE POLICY "journal_entries_read" ON public.journal_entries
    FOR SELECT TO authenticated 
    USING (public.auth_has_role('admin', 'manager'));

DROP POLICY IF EXISTS "journal_entries_write" ON public.journal_entries;
CREATE POLICY "journal_entries_write" ON public.journal_entries
    FOR ALL TO authenticated 
    USING (public.auth_has_role('admin', 'manager'))
    WITH CHECK (public.auth_has_role('admin', 'manager'));

DROP POLICY IF EXISTS "journal_lines_read" ON public.journal_entry_lines;
CREATE POLICY "journal_lines_read" ON public.journal_entry_lines
    FOR SELECT TO authenticated 
    USING (public.auth_has_role('admin', 'manager'));

DROP POLICY IF EXISTS "journal_lines_write" ON public.journal_entry_lines;
CREATE POLICY "journal_lines_write" ON public.journal_entry_lines
    FOR ALL TO authenticated 
    USING (public.auth_has_role('admin', 'manager'))
    WITH CHECK (public.auth_has_role('admin', 'manager'));

-- ==============================================================================
-- 9. PERMISSION GRANTS ON PUBLIC SCHEMA
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;
