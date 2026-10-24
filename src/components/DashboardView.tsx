import React, { useState } from 'react';
import { ERPStoreState } from '../lib/erpStore';
import { ScreenId } from '../types/erp';

interface DashboardViewProps {
  state: ERPStoreState;
  onNavigate: (screen: ScreenId) => void;
  onSync: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ state, onNavigate, onSync }) => {
  const [syncing, setSyncing] = useState(false);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<string | null>(null);

  const handleSyncClick = () => {
    setSyncing(true);
    setTimeout(() => {
      onSync();
      setSyncing(false);
    }, 400);
  };

  // Find selected invoice object if modal open
  const activeInvoice = state.recentSales.find(s => s.invoiceNo === selectedInvoiceForModal) || state.recentSales[0];

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto select-text">
      {/* 1. Header / Welcome Area (Stitch Screen 01) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">Business Overview</h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">Summary of daily operations, stock alerts, and receivables</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-[10px] shadow-sm text-[#0F172A] text-[13px]">
            <span className="material-symbols-outlined text-[18px] text-[#64748B]">calendar_today</span>
            <span>Today: Oct 24, 2024</span>
          </div>
          <button
            onClick={handleSyncClick}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] rounded-[10px] shadow-sm transition-colors text-[13px] font-medium cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[18px] text-[#64748B] ${syncing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{syncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* Financial Health Overview (Preserved requirement: profit, expenses, bank, cash, payables) */}
      <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2563EB] text-[20px]">account_balance_wallet</span>
            <h2 className="text-[15px] font-semibold text-[#0F172A]">Financial Health Overview (LKR)</h2>
          </div>
          <button
            onClick={() => onNavigate('25_accounting_overview')}
            className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
          >
            <span>Full Accounting & Ledgers</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Cash in Hand</span>
            <div className="text-[18px] font-bold text-[#0F172A] tabular-nums mt-1">
              Rs. {state.financials.cashInHand.toLocaleString()}
            </div>
            <span className="text-[11px] text-[#64748B] mt-0.5 block">Drawer & Petty Cash</span>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Bank Balance</span>
            <div className="text-[18px] font-bold text-[#0F172A] tabular-nums mt-1">
              Rs. {state.financials.bankBalance.toLocaleString()}
            </div>
            <span className="text-[11px] text-[#64748B] mt-0.5 block">Commercial Bank</span>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Customer Receivables</span>
            <div className="text-[18px] font-bold text-[#D97706] tabular-nums mt-1">
              Rs. {state.financials.customerReceivables.toLocaleString()}
            </div>
            <span className="text-[11px] text-amber-700 mt-0.5 block">14 pending invoices</span>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Supplier Payables</span>
            <div className="text-[18px] font-bold text-[#475569] tabular-nums mt-1">
              Rs. {state.financials.supplierPayables.toLocaleString()}
            </div>
            <span className="text-[11px] text-[#64748B] mt-0.5 block">Due to 2 suppliers</span>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Monthly Net Profit</span>
            <div className="text-[18px] font-bold text-emerald-600 tabular-nums mt-1">
              Rs. {state.financials.monthlyNetProfit.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-700 mt-0.5 block">+18.4% margin</span>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Monthly Expenses</span>
            <div className="text-[18px] font-bold text-[#0F172A] tabular-nums mt-1">
              Rs. {state.financials.monthlyExpenses.toLocaleString()}
            </div>
            <span className="text-[11px] text-[#64748B] mt-0.5 block">Utilities & Transport</span>
          </div>
        </div>
      </div>

      {/* 2. Four Compact KPI Cards Grid (Matches Stitch Screen 01 lines 21-95) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Today's Sales */}
        <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Today's Sales</span>
              <div className="text-[28px] text-[#0F172A] mt-1.5 font-bold tracking-tight tabular-nums">
                Rs. {state.financials.todaySales.toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-[10px] bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">trending_up</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +12%
            </span>
            <span className="text-[13px] text-[#64748B]">vs yesterday</span>
          </div>
        </div>

        {/* Card 2: Today's Purchases */}
        <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Today's Purchases</span>
              <div className="text-[28px] text-[#0F172A] mt-1.5 font-bold tracking-tight tabular-nums">
                Rs. {state.financials.todayPurchases.toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-[10px] bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">local_shipping</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[13px] text-[#64748B] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-slate-400">receipt_long</span> 3 supplier bills
            </span>
            <span className="text-[12px] text-emerald-600 font-medium">Recorded</span>
          </div>
        </div>

        {/* Card 3: Customer Outstanding */}
        <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Customer Outstanding</span>
              <div className="text-[28px] text-[#0F172A] mt-1.5 font-bold tracking-tight tabular-nums">
                Rs. {state.financials.customerReceivables.toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-[10px] bg-amber-50 text-[#D97706] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">pending_actions</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[13px] text-[#D97706] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span> 14 pending invoices
            </span>
            <span className="text-[12px] text-[#64748B]">Due this week</span>
          </div>
        </div>

        {/* Card 4: Low Stock Products */}
        <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Low Stock Products</span>
              <div className="text-[28px] text-[#DC2626] mt-1.5 font-bold tracking-tight tabular-nums">
                8
              </div>
            </div>
            <div className="w-10 h-10 rounded-[10px] bg-rose-50 text-[#DC2626] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[13px] text-rose-600 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">priority_high</span> Critical reorder
            </span>
            <span className="text-[12px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 font-medium">
              Action needed
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Content Two-Column Grid (Matches Stitch Screen 01 lines 96-337) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Sales Table (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-[10px] shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-[18px] text-[#0F172A] font-semibold">Recent Sales</h2>
              <p className="text-[13px] text-[#64748B]">Latest retail & wholesale transactions across branches</p>
            </div>
            <button
              onClick={() => onNavigate('06_sales_management')}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer"
            >
              <span>View All Sales</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#64748B] tracking-wider uppercase">Invoice No.</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#64748B] tracking-wider uppercase">Customer</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#64748B] tracking-wider uppercase">Date & Time</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#64748B] tracking-wider uppercase text-right">Amount</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#64748B] tracking-wider uppercase text-center">Status</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#64748B] tracking-wider uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {state.recentSales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-[14px] text-[#0F172A] font-semibold tabular-nums">
                      <button
                        onClick={() => {
                          setSelectedInvoiceForModal(sale.invoiceNo);
                        }}
                        className="hover:text-[#2563EB] cursor-pointer text-left"
                      >
                        {sale.invoiceNo}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[14px] text-[#0F172A] font-medium">{sale.customerName}</div>
                      <div className={`text-xs ${sale.customerType.includes('Overdue') ? 'text-rose-500 font-medium' : 'text-[#64748B]'}`}>
                        {sale.customerType}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[13px] text-[#64748B]">{sale.date}</td>
                    <td className="py-3 px-4 text-[14px] text-[#0F172A] font-semibold text-right tabular-nums">
                      Rs. {sale.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          sale.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : sale.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoiceForModal(sale.invoiceNo)}
                        className="p-1 text-slate-400 hover:text-[#0F172A] rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Print Invoice"
                      >
                        <span className="material-symbols-outlined text-[18px]">receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50/50 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <span>Showing 5 of 38 today's records</span>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 rounded bg-white border border-[#E2E8F0] text-slate-400 disabled:opacity-50 cursor-not-allowed">
                Previous
              </button>
              <button
                onClick={() => onNavigate('06_sales_management')}
                className="px-2 py-1 rounded bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Low Stock Alerts (1 col - Matches Stitch Screen 01 lines 234-336) */}
        <div className="bg-white border border-[#E2E8F0] rounded-[10px] shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] text-[#0F172A] font-semibold">Low Stock Alerts</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  8 Items
                </span>
              </div>
              <span className="material-symbols-outlined text-[#DC2626] text-[20px]">notifications_active</span>
            </div>
            <div className="p-4 divide-y divide-slate-100">
              {/* Item 1: Anchor Milk Powder */}
              <div className="py-3 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-medium text-[#0F172A] leading-tight">Anchor Full Cream Milk Powder 400g</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                        SKU: MLK-400
                      </span>
                      <span className="text-[12px] text-[#64748B]">Min: 50 units</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-1 bg-rose-50 border border-rose-200 rounded text-rose-700 font-mono font-bold text-xs">
                      12 units
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-[#DC2626] h-full rounded-full" style={{ width: '24%' }}></div>
                </div>
              </div>

              {/* Item 2: Prima Flour */}
              <div className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-medium text-[#0F172A] leading-tight">Prima Special Wheat Flour 1kg</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                        SKU: FLR-001
                      </span>
                      <span className="text-[12px] text-[#64748B]">Min: 60 units</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-1 bg-rose-50 border border-rose-200 rounded text-rose-700 font-mono font-bold text-xs">
                      18 units
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-[#DC2626] h-full rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>

              {/* Item 3: Munchee Cracker */}
              <div className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-medium text-[#0F172A] leading-tight">Munchee Super Cream Cracker 500g</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                        SKU: BKT-500
                      </span>
                      <span className="text-[12px] text-[#64748B]">Min: 40 units</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-1 bg-rose-50 border border-rose-200 rounded text-rose-700 font-mono font-bold text-xs">
                      8 units
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-[#DC2626] h-full rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>

              {/* Item 4: Dilmah Ceylon Tea */}
              <div className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-medium text-[#0F172A] leading-tight">Dilmah Premium Ceylon Tea 200g</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                        SKU: TEA-200
                      </span>
                      <span className="text-[12px] text-[#64748B]">Min: 45 units</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-1 bg-amber-50 border border-amber-200 rounded text-amber-700 font-mono font-bold text-xs">
                      15 units
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-[#D97706] h-full rounded-full" style={{ width: '33%' }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-50 border-t border-[#E2E8F0]">
            <button
              onClick={() => onNavigate('04_inventory_management')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer"
            >
              <span>View Inventory</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Action Bar / Quick Operations (Matches Stitch Screen 01 lines 338-366) */}
      <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">bolt</span>
          </div>
          <div>
            <h3 className="text-[15px] text-[#0F172A] font-semibold leading-tight">Quick Operations</h3>
            <p className="text-[13px] text-[#64748B]">Frequently used tasks for daily trading & inventory updates</p>
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Add Product */}
          <button
            onClick={() => onNavigate('03_add_product')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#0F172A] rounded-[10px] text-[14px] font-medium shadow-sm transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#64748B]">add_circle_outline</span>
            <span>Add Product</span>
          </button>
          {/* New Purchase */}
          <button
            onClick={() => onNavigate('12_create_purchase')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#0F172A] rounded-[10px] text-[14px] font-medium shadow-sm transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#64748B]">shopping_cart</span>
            <span>New Purchase</span>
          </button>
          {/* New Sale (Primary Action) */}
          <button
            onClick={() => onNavigate('07_create_sales_invoice')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white rounded-[10px] text-[14px] font-medium shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
            <span>New Sale</span>
          </button>
        </div>
      </div>

      {/* Invoice Quick View & Print Preview Modal */}
      {selectedInvoiceForModal && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[10px] border border-[#E2E8F0] max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563EB]">receipt_long</span>
                <h3 className="text-lg font-bold text-[#0F172A]">Invoice {activeInvoice.invoiceNo}</h3>
              </div>
              <button
                onClick={() => setSelectedInvoiceForModal(null)}
                className="text-slate-400 hover:text-[#0F172A] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3 text-sm text-[#0F172A]">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-[#64748B]">Date & Time</span>
                <span className="font-medium">{activeInvoice.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-[#64748B]">Customer</span>
                <span className="font-medium">{activeInvoice.customerName} ({activeInvoice.customerType})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-[#64748B]">Branch Node</span>
                <span className="font-medium">Main Warehouse (MW-01)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-[#64748B]">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeInvoice.status === 'Paid'
                    ? 'bg-emerald-50 text-emerald-700'
                    : activeInvoice.status === 'Pending'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-rose-50 text-rose-700'
                }`}>
                  {activeInvoice.status}
                </span>
              </div>
              <div className="flex justify-between py-2 text-base font-bold text-[#0F172A]">
                <span>Total Amount</span>
                <span className="tabular-nums">Rs. {activeInvoice.totalAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedInvoiceForModal(null)}
                className="px-4 py-2 border border-[#E2E8F0] rounded-[10px] text-sm text-[#0F172A] hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedInvoiceForModal(null);
                  onNavigate('08_invoice_details_print');
                }}
                className="px-4 py-2 bg-[#2563EB] text-white rounded-[10px] text-sm font-medium hover:bg-[#1D4ED8] cursor-pointer inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Full Print Preview</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
