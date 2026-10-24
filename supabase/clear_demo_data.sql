-- Clear all demo business data while preserving lookup & configuration tables
TRUNCATE TABLE
  journal_entry_lines,
  journal_entries,
  payments,
  expenses,
  purchase_order_items,
  purchase_orders,
  sales_invoice_items,
  sales_invoices,
  stock_adjustments,
  inventory_movements,
  warehouse_inventory,
  products,
  customers,
  suppliers
RESTART IDENTITY CASCADE;
