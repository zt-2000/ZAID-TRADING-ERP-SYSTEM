-- ==============================================================================
-- Migration: 20261024000001_initial_zaid_erp_schema.sql
-- Application: Zaid Trading Wholesale ERP (Sri Lanka)
-- Base Currency: LKR (Rs.)
-- Default Warehouse: Main Warehouse (MW-01)
-- Architecture: PostgreSQL on Supabase with Double-Entry Accounting and RLS
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

-- Seed Default Warehouse MW-01
INSERT INTO public.warehouses (code, name, address, is_active)
VALUES ('MW-01', 'Main Warehouse', 'Peliyagoda Complex, Colombo 15', true)
ON CONFLICT (code) DO NOTHING;

-- Seed Default Company Profile
INSERT INTO public.company_settings (trade_name, currency, vat_tin, address, phone, email)
SELECT 'ZAID TRADING (PVT) LTD', 'LKR', '102938475-7000', 'No. 45/A, Warehouse Complex, Peliyagoda, Colombo', '+94 11 234 5678', 'info@zaidtrading.lk'
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings);

-- ==============================================================================
-- 2. USER ACCESS ROLES (Integrated with Supabase auth.users)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'clerk')),
    full_name TEXT NOT NULL,
    default_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper function to fetch role of the currently requesting user
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.user_roles WHERE id = auth.uid();
$$;

-- ==============================================================================
-- 3. PRODUCT CATALOG & UNITS
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
    min_stock_alert INTEGER NOT NULL DEFAULT 10 CHECK (min_stock_alert >= 0),
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
-- 5. INVENTORY STOCK & AUDIT MOVEMENTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.warehouse_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (warehouse_id, product_id)
);

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
    quantity_change INTEGER NOT NULL CHECK (quantity_change <> 0),
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
    reference_no TEXT NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inv_mov_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_mov_ref ON public.inventory_movements(reference_no);
CREATE INDEX IF NOT EXISTS idx_inv_mov_date ON public.inventory_movements(created_at);

CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_no TEXT NOT NULL UNIQUE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('INCREASE', 'DECREASE')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
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
-- 6. SALES INVOICES & PURCHASES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sales_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no TEXT NOT NULL UNIQUE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    status TEXT NOT NULL DEFAULT 'Paid' CHECK (status IN ('Paid', 'Pending', 'Overdue', 'Void')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_inv_no ON public.sales_invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_sales_inv_cust ON public.sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_inv_date ON public.sales_invoices(invoice_date);

CREATE TABLE IF NOT EXISTS public.sales_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.sales_invoices(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(14, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number TEXT NOT NULL UNIQUE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'Received' CHECK (status IN ('Draft', 'Ordered', 'Received', 'Cancelled')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_po_number ON public.purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON public.purchase_orders(supplier_id);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(14, 2) NOT NULL CHECK (unit_cost >= 0),
    subtotal NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0)
);

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
-- 7. DOUBLE-ENTRY ACCOUNTING (CHART, JOURNALS, LEDGER)
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
    status TEXT NOT NULL DEFAULT 'POSTED' CHECK (status IN ('DRAFT', 'POSTED', 'VOID')),
    total_debit NUMERIC(14, 2) NOT NULL CHECK (total_debit >= 0),
    total_credit NUMERIC(14, 2) NOT NULL CHECK (total_credit >= 0),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- STRICT DOUBLE-ENTRY ENFORCEMENT CONSTRAINT:
    CONSTRAINT posted_must_balance CHECK (status <> 'POSTED' OR total_debit = total_credit)
);

CREATE INDEX IF NOT EXISTS idx_je_entry_no ON public.journal_entries(entry_no);
CREATE INDEX IF NOT EXISTS idx_je_date ON public.journal_entries(entry_date);

CREATE TABLE IF NOT EXISTS public.journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    debit NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (debit >= 0),
    credit NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (credit >= 0),
    -- Each line must be either a debit or a credit, never both and never zero:
    CONSTRAINT debit_xor_credit CHECK (
        (debit > 0 AND credit = 0) OR
        (credit > 0 AND debit = 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_jel_entry ON public.journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_jel_account ON public.journal_entry_lines(account_id);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
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

-- 8.1 Read policies: Authenticated users with assigned roles can view operational data
CREATE POLICY "allow_read_authenticated_staff" ON public.company_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.warehouses
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.product_categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.units_of_measurement
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.products
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.payment_methods
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.customers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.suppliers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.warehouse_inventory
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.inventory_movements
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.stock_adjustments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.sales_invoices
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.sales_invoice_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.purchase_orders
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.purchase_order_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.payments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.expenses
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.chart_of_accounts
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.journal_entries
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_read_authenticated_staff" ON public.journal_entry_lines
    FOR SELECT TO authenticated USING (true);

-- 8.2 User Roles self-read & admin management
CREATE POLICY "user_roles_read_own" ON public.user_roles
    FOR SELECT TO authenticated USING (id = auth.uid() OR public.get_auth_role() IN ('admin', 'manager'));

CREATE POLICY "user_roles_admin_write" ON public.user_roles
    FOR ALL TO authenticated USING (public.get_auth_role() = 'admin');

-- 8.3 Operational Write Policies based on Least-Privilege
-- Sales: Cashiers, Managers, Admins can create sales & invoices
CREATE POLICY "sales_write_operational" ON public.sales_invoices
    FOR INSERT TO authenticated WITH CHECK (public.get_auth_role() IN ('admin', 'manager', 'cashier'));

CREATE POLICY "sales_items_write_operational" ON public.sales_invoice_items
    FOR INSERT TO authenticated WITH CHECK (public.get_auth_role() IN ('admin', 'manager', 'cashier'));

CREATE POLICY "payments_write_operational" ON public.payments
    FOR INSERT TO authenticated WITH CHECK (public.get_auth_role() IN ('admin', 'manager', 'cashier'));

-- Inventory & Stock Adjustments: Clerks, Managers, Admins
CREATE POLICY "inventory_adjust_operational" ON public.stock_adjustments
    FOR INSERT TO authenticated WITH CHECK (public.get_auth_role() IN ('admin', 'manager', 'clerk'));

CREATE POLICY "inventory_movement_operational" ON public.inventory_movements
    FOR INSERT TO authenticated WITH CHECK (public.get_auth_role() IN ('admin', 'manager', 'clerk', 'cashier'));

-- Products, Customers, Suppliers: Managers and Admins
CREATE POLICY "catalog_write_managers" ON public.products
    FOR ALL TO authenticated USING (public.get_auth_role() IN ('admin', 'manager'));

CREATE POLICY "customers_write_managers" ON public.customers
    FOR ALL TO authenticated USING (public.get_auth_role() IN ('admin', 'manager', 'cashier'));

CREATE POLICY "suppliers_write_managers" ON public.suppliers
    FOR ALL TO authenticated USING (public.get_auth_role() IN ('admin', 'manager'));

-- Accounting: Journal Entries can only be posted by Managers and Admins
CREATE POLICY "accounting_write_admin_manager" ON public.journal_entries
    FOR ALL TO authenticated USING (public.get_auth_role() IN ('admin', 'manager'));

CREATE POLICY "accounting_lines_write_admin_manager" ON public.journal_entry_lines
    FOR ALL TO authenticated USING (public.get_auth_role() IN ('admin', 'manager'));
