import React from 'react';
import { ScreenId } from '../types/erp';

interface ScreenCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
}

interface ScreenInfo {
  id: ScreenId;
  num: string;
  title: string;
  module: string;
  description: string;
  htmlRef: string;
}

export const SCREEN_LIST: ScreenInfo[] = [
  { id: '01_dashboard', num: '01', title: 'Dashboard', module: 'Core', description: 'Business overview, daily sales, purchases, low stock alerts', htmlRef: 'screens/01_dashboard/code.html' },
  { id: '02_products_management', num: '02', title: 'Products Management', module: 'Catalog', description: 'Catalog list, wholesale unit prices, categories, SKU filter', htmlRef: 'screens/02_products_management/code.html' },
  { id: '03_add_product', num: '03', title: 'Add / Edit Product', module: 'Catalog', description: 'Product creation form, pricing tiers, reorder thresholds', htmlRef: 'screens/03_add_product/code.html' },
  { id: '04_inventory_management', num: '04', title: 'Inventory Management', module: 'Warehouse', description: 'Multi-warehouse stock levels, valuations, batch numbers', htmlRef: 'screens/04_inventory_management/code.html' },
  { id: '05_stock_adjustment', num: '05', title: 'Stock Adjustment', module: 'Warehouse', description: 'Physical count reconciliations, shrinkage, damages', htmlRef: 'screens/05_stock_adjustment/code.html' },
  { id: '06_sales_management', num: '06', title: 'Sales Management', module: 'Sales', description: 'All sales invoices, customer credit tracking, payment status', htmlRef: 'screens/06_sales_management/code.html' },
  { id: '07_create_sales_invoice', num: '07', title: 'Create Sales Invoice', module: 'Sales', description: 'Point of sale / wholesale billing, item pickers, tax, discounts', htmlRef: 'screens/07_create_sales_invoice/code.html' },
  { id: '08_invoice_details_print', num: '08', title: 'Invoice Details & Print', module: 'Sales', description: 'Official thermal & A4 invoice printable template', htmlRef: 'screens/08_invoice_details_print/code.html' },
  { id: '09_record_customer_payment', num: '09', title: 'Record Customer Payment', module: 'Sales', description: 'Partial & full receivables settlement, cheque/cash logs', htmlRef: 'screens/09_record_customer_payment/code.html' },
  { id: '10_sales_return', num: '10', title: 'Sales Return', module: 'Sales', description: 'Customer credit notes, restocking returned items', htmlRef: 'screens/10_sales_return/code.html' },
  { id: '11_purchases_management', num: '11', title: 'Purchases Management', module: 'Procurement', description: 'Supplier purchase orders, GRN tracking, bill balances', htmlRef: 'screens/11_purchases_management/code.html' },
  { id: '12_create_purchase', num: '12', title: 'Create Purchase', module: 'Procurement', description: 'Draft purchase order to manufacturer / wholesale distributor', htmlRef: 'screens/12_create_purchase/code.html' },
  { id: '13_purchase_details_print', num: '13', title: 'Purchase Details & Print', module: 'Procurement', description: 'Purchase order document layout with delivery details', htmlRef: 'screens/13_purchase_details_print/code.html' },
  { id: '14_receive_stock', num: '14', title: 'Receive Stock', module: 'Procurement', description: 'Good Received Note (GRN) inspection & warehouse entry', htmlRef: 'screens/14_receive_stock/code.html' },
  { id: '15_record_supplier_payment', num: '15', title: 'Record Supplier Payment', module: 'Procurement', description: 'Pay supplier bills, bank transfers, payment receipts', htmlRef: 'screens/15_record_supplier_payment/code.html' },
  { id: '16_purchase_return', num: '16', title: 'Purchase Return', module: 'Procurement', description: 'Debit note creation, returning defective batches to vendor', htmlRef: 'screens/16_purchase_return/code.html' },
  { id: '17_customers_management', num: '17', title: 'Customers Management', module: 'Parties', description: 'Wholesale buyer directory, credit balances, payment terms', htmlRef: 'screens/17_customers_management/code.html' },
  { id: '18_add_edit_customer', num: '18', title: 'Add / Edit Customer', module: 'Parties', description: 'Customer onboarding with TIN, business name, credit limit', htmlRef: 'screens/18_add_edit_customer/code.html' },
  { id: '19_customer_details_statement', num: '19', title: 'Customer Details & Statement', module: 'Parties', description: 'Full ledger statement, transactions, running balance', htmlRef: 'screens/19_customer_details_statement/code.html' },
  { id: '20_suppliers_management', num: '20', title: 'Suppliers Management', module: 'Parties', description: 'Vendor directory, supply terms, pending payables', htmlRef: 'screens/20_suppliers_management/code.html' },
  { id: '21_add_edit_supplier', num: '21', title: 'Add / Edit Supplier', module: 'Parties', description: 'Supplier registration, representative details, bank info', htmlRef: 'screens/21_add_edit_supplier/code.html' },
  { id: '22_supplier_details_statement', num: '22', title: 'Supplier Details & Statement', module: 'Parties', description: 'Vendor ledger, billed orders, payments released', htmlRef: 'screens/22_supplier_details_statement/code.html' },
  { id: '23_payments_expenses', num: '23', title: 'Payments & Expenses', module: 'Finance', description: 'Operational expense ledger, utility bills, logistics costs', htmlRef: 'screens/23_payments_expenses/code.html' },
  { id: '24_add_expense', num: '24', title: 'Add Expense', module: 'Finance', description: 'Record daily petty cash or bank expense vouchers', htmlRef: 'screens/24_add_expense/code.html' },
  { id: '25_accounting_overview', num: '25', title: 'Accounting Overview', module: 'Accounting', description: 'Cash in hand, bank balances, financial indicators', htmlRef: 'screens/25_accounting_overview/code.html' },
  { id: '26_cash_bank_book', num: '26', title: 'Cash & Bank Book', module: 'Accounting', description: 'Daily double-entry cash flow book with running totals', htmlRef: 'screens/26_cash_bank_book/code.html' },
  { id: '27_chart_of_accounts', num: '27', title: 'Chart of Accounts', module: 'Accounting', description: 'Assets, liabilities, equity, revenue, expense categories', htmlRef: 'screens/27_chart_of_accounts/code.html' },
  { id: '28_journal_entries', num: '28', title: 'Journal Entries', module: 'Accounting', description: 'Manual general journal vouchers with debit & credit balancing', htmlRef: 'screens/28_journal_entries/code.html' },
  { id: '29_general_ledger', num: '29', title: 'General Ledger', module: 'Accounting', description: 'Detailed account-level transactions audit trail', htmlRef: 'screens/29_general_ledger/code.html' },
  { id: '30_profit_loss_report', num: '30', title: 'Profit & Loss Report', module: 'Accounting', description: 'Operating income, gross margins, wholesale EBITDA', htmlRef: 'screens/30_profit_loss_report/code.html' },
  { id: '31_trial_balance', num: '31', title: 'Trial Balance', module: 'Accounting', description: 'Debit vs Credit trial balance check across all ledgers', htmlRef: 'screens/31_trial_balance/code.html' },
  { id: '32_balance_sheet', num: '32', title: 'Balance Sheet', module: 'Accounting', description: 'Assets vs Liabilities and Owner Equity statement', htmlRef: 'screens/32_balance_sheet/code.html' },
  { id: '33_operational_reports', num: '33', title: 'Operational Reports', module: 'Reports', description: 'Sales analytics, product velocity, category breakdowns', htmlRef: 'screens/33_operational_reports/code.html' },
  { id: '34_stock_movement_history', num: '34', title: 'Stock Movement History', module: 'Reports', description: 'In/Out audit trail by warehouse, transfer logs', htmlRef: 'screens/34_stock_movement_history/code.html' },
  { id: '35_record_supplier_refund', num: '35', title: 'Record Supplier Refund', module: 'Finance', description: 'Vendor refund vouchers for returned purchases', htmlRef: 'screens/35_record_supplier_refund/code.html' },
  { id: '36_company_settings', num: '36', title: 'Company Settings', module: 'Settings', description: 'Business profile, currency (LKR / Rs.), tax rules', htmlRef: 'screens/36_company_settings/code.html' },
  { id: '37_users_roles', num: '37', title: 'Users & Roles', module: 'Settings', description: 'Role-based access control, cashier & manager rights', htmlRef: 'screens/37_users_roles/code.html' },
  { id: '38_login', num: '38', title: 'Login & Session', module: 'Security', description: 'Operator login, security credentials, branch selection', htmlRef: 'screens/38_login/code.html' }
];

export const ScreenCatalogModal: React.FC<ScreenCatalogModalProps> = ({
  isOpen,
  onClose,
  currentScreen,
  onSelectScreen
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#E2E8F0] max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2563EB]">grid_view</span>
              <h2 className="text-lg font-bold text-[#0F172A]">Google Stitch Design References (38 Screens)</h2>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Select any screen from the wholesale distribution inventory to inspect the design implementation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0F172A] hover:bg-slate-200/60 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* List of screens */}
        <div className="p-4 overflow-y-auto divide-y divide-slate-100 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {SCREEN_LIST.map((sc) => {
              const isSelected = currentScreen === sc.id;
              return (
                <div
                  key={sc.id}
                  onClick={() => {
                    onSelectScreen(sc.id);
                    onClose();
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'border-[#2563EB] bg-blue-50/70 shadow-sm'
                      : 'border-[#E2E8F0] hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-7 h-7 rounded-md bg-[#2563EB]/10 text-[#2563EB] font-bold text-xs flex items-center justify-center shrink-0">
                    {sc.num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-[13px] font-semibold text-[#0F172A] truncate">{sc.title}</h4>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        {sc.module}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">{sc.description}</p>
                    <span className="text-[10px] font-mono text-slate-400 block mt-1">{sc.htmlRef}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
          <span>All 38 exported HTML & PNG screens available in `/design-references/stitch/screens/`</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-100 rounded-lg text-[#0F172A] font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
