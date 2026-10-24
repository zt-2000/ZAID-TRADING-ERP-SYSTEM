export type ScreenId =
  | '01_dashboard'
  | '02_products_management'
  | '03_add_product'
  | '04_inventory_management'
  | '05_stock_adjustment'
  | '06_sales_management'
  | '07_create_sales_invoice'
  | '08_invoice_details_print'
  | '09_record_customer_payment'
  | '10_sales_return'
  | '11_purchases_management'
  | '12_create_purchase'
  | '13_purchase_details_print'
  | '14_receive_stock'
  | '15_record_supplier_payment'
  | '16_purchase_return'
  | '17_customers_management'
  | '18_add_edit_customer'
  | '19_customer_details_statement'
  | '20_suppliers_management'
  | '21_add_edit_supplier'
  | '22_supplier_details_statement'
  | '23_payments_expenses'
  | '24_add_expense'
  | '25_accounting_overview'
  | '26_cash_bank_book'
  | '27_chart_of_accounts'
  | '28_journal_entries'
  | '29_general_ledger'
  | '30_profit_loss_report'
  | '31_trial_balance'
  | '32_balance_sheet'
  | '33_operational_reports'
  | '34_stock_movement_history'
  | '35_record_supplier_refund'
  | '36_company_settings'
  | '37_users_roles'
  | '38_login';

export interface CompanySettings {
  name: string;
  tradeName: string;
  currency: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockAlert: number;
  status: 'active' | 'low_stock' | 'out_of_stock';
  syncStatus?: 'synced' | 'pending_sync';
}

export interface Customer {
  id: string;
  name: string;
  accountType: 'Wholesale' | 'Retail' | 'Regular';
  phone: string;
  email: string;
  address: string;
  outstandingBalance: number;
  creditDays: number;
  syncStatus?: 'synced' | 'pending_sync';
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  outstandingPayable: number;
  syncStatus?: 'synced' | 'pending_sync';
}

export interface SaleInvoice {
  id: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  customerType: string;
  date: string;
  totalAmount: number;
  paidAmount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  itemsCount: number;
  syncStatus?: 'synced' | 'pending_sync';
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  totalAmount: number;
  status: 'Received' | 'Pending' | 'Ordered';
  syncStatus?: 'synced' | 'pending_sync';
}

export interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  paidVia: 'Cash' | 'Bank';
}

export interface FinancialOverview {
  cashInHand: number;
  bankBalance: number;
  customerReceivables: number;
  supplierPayables: number;
  todaySales: number;
  todayPurchases: number;
  lowStockCount: number;
  monthlyNetProfit: number;
  monthlyExpenses: number;
}
