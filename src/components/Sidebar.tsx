import React from 'react';
import { ScreenId } from '../types/erp';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onOpenScreenModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onNavigate, onOpenScreenModal }) => {
  const mainNavItems: { id: ScreenId; label: string; icon: string; category: string }[] = [
    { id: '01_dashboard', label: 'Dashboard', icon: 'dashboard', category: 'dashboard' },
    { id: '02_products_management', label: 'Products', icon: 'inventory_2', category: 'products' },
    { id: '04_inventory_management', label: 'Inventory', icon: 'warehouse', category: 'inventory' },
    { id: '06_sales_management', label: 'Sales', icon: 'point_of_sale', category: 'sales' },
    { id: '11_purchases_management', label: 'Purchases', icon: 'shopping_cart', category: 'purchases' },
    { id: '17_customers_management', label: 'Customers', icon: 'groups', category: 'customers' },
    { id: '20_suppliers_management', label: 'Suppliers', icon: 'local_shipping', category: 'suppliers' },
    { id: '23_payments_expenses', label: 'Payments & Expenses', icon: 'payments', category: 'payments' },
    { id: '25_accounting_overview', label: 'Accounting', icon: 'calculate', category: 'accounting' },
    { id: '33_operational_reports', label: 'Reports', icon: 'analytics', category: 'reports' },
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

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-white border-r border-[#E2E8F0] z-50 flex flex-col justify-between select-none">
      <div className="flex flex-col">
        {/* Stitch Brand Logo Header */}
        <div className="h-16 px-4 flex items-center gap-2.5 border-b border-[#E2E8F0]">
          <img
            alt="Wholesale ERP Logo"
            className="h-8 w-auto object-contain shrink-0"
            src="https://lh3.googleusercontent.com/aida/AEtjO1UO4n0krM0n2CGUNYmokL4BX_8wnTdkYndUHeQ7ZurZyM6uwOADtA6KCJXsVOi3VuVwTIvnuP10amcvvHxmctEb-7mqgHQgiyE3UrdyVEHPhdJT9cYh32p0DU_uzhi8vSaQbFqrV7GeR8NK7bhoB7xZywoJSSLKBbVPVvK9bfT7F1ue81hae-R03_wZE29JHH92uMCcId_nSUKu5V6kpKOJTf-kA4GPQxwFlqzbVsCSw2-N_596mvHWMmgD"
            onError={(e) => {
              // Graceful fallback if image is unreachable
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.logo-fallback')) {
                const fallback = document.createElement('div');
                fallback.className = 'w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0 logo-fallback';
                fallback.innerText = 'ZT';
                parent.prepend(fallback);
              }
            }}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-semibold text-[#0F172A] truncate leading-tight">Wholesale ERP</span>
            <span className="text-[12px] text-[#64748B] truncate">Distribution Suite</span>
          </div>
        </div>

        {/* Navigation List matching Stitch order and styling */}
        <nav className="px-3 py-4 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {mainNavItems.map((item) => {
            const active = isCurrentActive(item.id, item.category);
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[14px] transition-colors w-full cursor-pointer ${
                  active
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-medium'
                    : 'text-[#434655] hover:bg-[#F2F3FF] hover:text-[#131B2E]'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] shrink-0 ${active ? 'text-[#2563EB]' : 'text-[#64748B]'}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Settings & 38-Screen Index Picker */}
      <div className="p-3 border-t border-[#E2E8F0] flex flex-col gap-1.5 bg-[#F8FAFC]">
        {onOpenScreenModal && (
          <button
            onClick={onOpenScreenModal}
            className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#2563EB] bg-[#EFF6FF] hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
            title="Browse all 38 Stitch screens"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              <span>38 Stitch Screens</span>
            </span>
            <span className="text-[11px] font-semibold bg-white px-1.5 py-0.5 rounded text-[#2563EB] border border-blue-200">
              Audit
            </span>
          </button>
        )}
        <button
          onClick={() => onNavigate('36_company_settings')}
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-[14px] transition-colors cursor-pointer ${
            currentScreen === '36_company_settings' || currentScreen === '37_users_roles'
              ? 'bg-[#EFF6FF] text-[#2563EB] font-medium'
              : 'text-[#434655] hover:bg-[#F2F3FF] hover:text-[#131B2E]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-[#64748B]">settings</span>
            <span>Settings</span>
          </div>
          <span className="text-[12px] text-[#737686]">v1.4.0</span>
        </button>
      </div>
    </aside>
  );
};
