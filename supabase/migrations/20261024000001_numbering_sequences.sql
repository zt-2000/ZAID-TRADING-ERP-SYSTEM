-- Postgres sequence and numbering functions for ZAID Trading ERP
CREATE SEQUENCE IF NOT EXISTS sales_invoice_seq START 1;
CREATE SEQUENCE IF NOT EXISTS purchase_order_seq START 1;

CREATE OR REPLACE FUNCTION generate_invoice_no() RETURNS TEXT AS $$
DECLARE
  curr_year INT;
  next_val INT;
BEGIN
  curr_year := EXTRACT(YEAR FROM CURRENT_TIMESTAMP);
  next_val := nextval('sales_invoice_seq');
  RETURN 'INV-' || curr_year || '-' || LPAD(next_val::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_po_no() RETURNS TEXT AS $$
DECLARE
  curr_year INT;
  next_val INT;
BEGIN
  curr_year := EXTRACT(YEAR FROM CURRENT_TIMESTAMP);
  next_val := nextval('purchase_order_seq');
  RETURN 'PO-' || curr_year || '-' || LPAD(next_val::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;
