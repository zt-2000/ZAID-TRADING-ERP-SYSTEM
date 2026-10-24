import React from 'react';
import { ScreenId } from '../types/erp';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  companyName?: string;
  onOpenScreenModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  companyName = 'ZAID TRADING (PVT) LTD',
  onOpenScreenModal
}) => {
  const menuNavItems: { id: ScreenId; label: string; icon: string; category: string }[] = [
    { id: '01_dashboard', label: 'Dashboard', icon: 'grid_view', category: 'dashboard' },
    { id: '02_products_management', label: 'Products', icon: 'inventory_2', category: 'products' },
    { id: '04_inventory_management', label: 'Inventory & Stock', icon: 'warehouse', category: 'inventory' },
    { id: '06_sales_management', label: 'Sales & Orders', icon: 'point_of_sale', category: 'sales' },
    { id: '11_purchases_management', label: 'Purchases', icon: 'shopping_cart', category: 'purchases' },
    { id: '17_customers_management', label: 'Customers', icon: 'groups', category: 'customers' },
    { id: '20_suppliers_management', label: 'Suppliers', icon: 'local_shipping', category: 'suppliers' },
  ];

  const financialNavItems: { id: ScreenId; label: string; icon: string; category: string }[] = [
    { id: '23_payments_expenses', label: 'Payments & Expenses', icon: 'payments', category: 'payments' },
    { id: '25_accounting_overview', label: 'Accounting & Ledgers', icon: 'account_balance', category: 'accounting' },
    { id: '33_operational_reports', label: 'Reports & Analytics', icon: 'bar_chart', category: 'reports' },
  ];

  const isCurrentActive = (itemScreenId: ScreenId, category: string) => {
    if (currentScreen === itemScreenId) return true;
    if (category === 'products' && (currentScreen === '03_add_product')) return true;
    if (category === 'inventory' && (currentScreen === '05_stock_adjustment' || currentScreen === '34_stock_movement_history')) return true;
    if (category === 'sales' && (currentScreen === '07_create_sales_invoice' || currentScreen === '08_invoice_details_print' || currentScreen === '09_record_customer_payment' || currentScreen === '10_sales_return')) return true;
    if (category === 'purchases' && (currentScreen === '12_create_purchase' || currentScreen === '13_purchase_details_print' || currentScreen === '14_receive_stock' || currentScreen === '15_record_supplier_payment' || currentScreen === '16_purchase_return')) return true;
    if (category === 'customers' && (currentScreen === '18_add_edit_customer' || currentScreen === '19_customer_details_statement')) return true;
    if (category === 'suppliers' && (currentScreen === '21_add_edit_supplier' || currentScreen === '22_supplier_details_statement')) return true;
    if (category === 'payments' && (currentScreen === '24_add_expense' || currentScreen === '35_record_supplier_refund')) return true;
    if (category === 'accounting' && (
      currentScreen === '26_cash_bank_book' ||
      currentScreen === '27_chart_of_accounts' ||
      currentScreen === '28_journal_entries' ||
      currentScreen === '29_general_ledger' ||
      currentScreen === '30_profit_loss_report' ||
      currentScreen === '31_trial_balance' ||
      currentScreen === '32_balance_sheet'
    )) return true;
    return false;
  };

  // Generate initials for brand fallback icon
  const brandInitials = companyName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || 'ZT';

  return (
    <aside className="fixed left-0 top-0 h-full w-[250px] bg-white border-r border-[#E2E8F0] z-50 flex flex-col justify-between select-none shadow-[2px_0_12px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col">
        {/* Dynamic Company Brand Header */}
        <div className="h-16 px-4 flex items-center gap-3 border-b border-[#E2E8F0]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white font-extrabold text-xs shadow-sm shrink-0">
            {brandInitials}
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className="text-[14px] font-bold text-[#0F172A] truncate leading-tight tracking-tight"
              title={companyName}
            >
              {companyName}
            </span>
            <span className="text-[11px] font-medium text-[#64748B] truncate">Wholesale ERP</span>
          </div>
        </div>

        {/* Grouped Navigation List matching 0326a925dd0e9a63f270e4fb23547a87_a43867bd.jpg */}
        <nav className="px-3 py-4 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-140px)] text-xs">
          {/* Section 1: MENU */}
          <div className="flex flex-col gap-1">
            <span className="px-3 text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-1">
              MENU
            </span>
            {menuNavItems.map((item) => {
              const active = isCurrentActive(item.id, item.category);
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[13px] font-medium transition-all w-full cursor-pointer ${
                    active
                      ? 'bg-[#3B82F6] text-white shadow-sm font-semibold'
                      : 'text-[#475569] hover:bg-slate-100/80 hover:text-[#0F172A]'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[19px] shrink-0 ${active ? 'text-white' : 'text-[#64748B]'}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Section 2: FINANCIAL */}
          <div className="flex flex-col gap-1">
            <span className="px-3 text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-1">
              FINANCIAL
            </span>
            {financialNavItems.map((item) => {
              const active = isCurrentActive(item.id, item.category);
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[13px] font-medium transition-all w-full cursor-pointer ${
                    active
                      ? 'bg-[#3B82F6] text-white shadow-sm font-semibold'
                      : 'text-[#475569] hover:bg-slate-100/80 hover:text-[#0F172A]'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[19px] shrink-0 ${active ? 'text-white' : 'text-[#64748B]'}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Section 3: TOOLS / SETTINGS */}
          <div className="flex flex-col gap-1">
            <span className="px-3 text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-1">
              SETTINGS &amp; TOOLS
            </span>
            <button
              onClick={() => onNavigate('36_company_settings')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[13px] font-medium transition-all w-full cursor-pointer ${
                currentScreen === '36_company_settings' || currentScreen === '37_users_roles'
                  ? 'bg-[#3B82F6] text-white shadow-sm font-semibold'
                  : 'text-[#475569] hover:bg-slate-100/80 hover:text-[#0F172A]'
              }`}
            >
              <span className={`material-symbols-outlined text-[19px] shrink-0 ${
                currentScreen === '36_company_settings' || currentScreen === '37_users_roles' ? 'text-white' : 'text-[#64748B]'
              }`}>
                settings
              </span>
              <span className="truncate">Company Settings</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Footer / 38-Screen Index Picker */}
      <div className="p-3 border-t border-[#E2E8F0] flex flex-col gap-1.5 bg-[#F8FAFC]">
        {onOpenScreenModal && (
          <button
            onClick={onOpenScreenModal}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-medium text-[#2563EB] bg-[#EFF6FF] hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200 shadow-xs"
            title="Browse all 38 Stitch screens"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              <span className="font-semibold">38 Stitch Screens</span>
            </span>
            <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded text-[#2563EB] border border-blue-200">
              AUDIT
            </span>
          </button>
        )}
      </div>
    </aside>
  );
};

