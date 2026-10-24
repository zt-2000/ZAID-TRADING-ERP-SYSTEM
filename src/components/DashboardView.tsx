import React, { useState } from 'react';
import { ERPStoreState, formatDate } from '../lib/erpStore';
import { ScreenId } from '../types/erp';

interface DashboardViewProps {
  state: ERPStoreState;
  onNavigate: (screen: ScreenId) => void;
  onSync: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ state, onNavigate, onSync }) => {
  const [syncing, setSyncing] = useState(false);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<string | null>(null);

  const companyName = state.companySettings?.name || 'ZAID TRADING (PVT) LTD';

  const handleSyncClick = () => {
    setSyncing(true);
    setTimeout(() => {
      onSync();
      setSyncing(false);
    }, 400);
  };

  const activeInvoice = state.recentSales.find(s => s.invoiceNo === selectedInvoiceForModal) || state.recentSales[0];

  const totalProductsSold = state.recentSales.reduce((sum, s) => sum + (s.itemsCount || 1), 0);
  const totalPendingInvoices = state.recentSales.filter(s => s.status === 'Pending' || s.status === 'Overdue').length;
  const totalSupplierAccounts = state.suppliers.length;

  const categoryStats = React.useMemo(() => {
    const counts: Record<string, number> = {};
    state.products.forEach(p => {
      const cat = p.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const entries = Object.entries(counts);
    const colors = ['#3B82F6', '#EF4444', '#94A3B8', '#F59E0B', '#10B981'];
    return entries.map(([name, count], index) => ({
      name,
      count,
      color: colors[index % colors.length]
    }));
  }, [state.products]);

  // Last 7 months chart data computation
  const monthlyChartData = React.useMemo(() => {
    const result: Array<{ label: string; key: string; sales: number; purchases: number }> = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      result.push({ label, key, sales: 0, purchases: 0 });
    }

    const matchMonth = (dateStr?: string) => {
      if (!dateStr) return '';
      if (dateStr.includes('Today') || dateStr.includes('Just now')) {
        return new Date().toISOString().slice(0, 7);
      }
      if (dateStr.length >= 7) {
        return dateStr.slice(0, 7);
      }
      try {
        return new Date(dateStr).toISOString().slice(0, 7);
      } catch {
        return '';
      }
    };

    state.recentSales.forEach(s => {
      const mKey = matchMonth(s.date);
      const found = result.find(r => r.key === mKey);
      if (found) {
        found.sales += s.totalAmount;
      }
    });

    state.purchases.forEach(p => {
      const mKey = matchMonth(p.date);
      const found = result.find(r => r.key === mKey);
      if (found) {
        found.purchases += p.totalAmount;
      }
    });

    return result;
  }, [state.recentSales, state.purchases]);

  const hasAnyChartData = monthlyChartData.some(m => m.sales > 0 || m.purchases > 0);
  const maxChartValue = Math.max(1, ...monthlyChartData.map(m => Math.max(m.sales, m.purchases)));

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto select-text bg-[#F8FAFC]">
      {/* Top Header / Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
            Sales Report &amp; Dashboard
          </h1>
          <p className="text-[13px] font-medium text-[#64748B] mt-0.5">
            Trading Operations for <span className="font-bold text-[#0F172A]">{companyName}</span> · Main Warehouse (MW-01)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#CBD5E1] rounded-xl shadow-2xs text-[#0F172A] text-[13px] font-semibold">
            <span className="material-symbols-outlined text-[18px] text-[#3B82F6]">calendar_month</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          <button
            onClick={handleSyncClick}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#0F172A] rounded-xl shadow-2xs transition-colors text-[13px] font-bold cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[18px] text-[#3B82F6] ${syncing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{syncing ? 'Syncing...' : 'Sync Data'}</span>
          </button>
        </div>
      </div>

      {/* Top Summary Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Today's Sales */}
        <div className="bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-2xl p-5 text-white shadow-md flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px] text-white">payments</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 text-white shadow-xs">
              LKR
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-medium text-blue-100 uppercase tracking-wider block">Today's Sales</span>
            <div className="text-[28px] font-extrabold mt-1 tracking-tight tabular-nums">
              Rs. {state.financials.todaySales.toLocaleString()}
            </div>
            <div className="text-[11px] text-blue-100/90 mt-1 flex items-center justify-between">
              <span>Recorded today</span>
              <span className="font-semibold text-white">{state.recentSales.length} Invoices</span>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Purchases */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#3B82F6] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              LKR
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">Today's Purchases</span>
            <div className="text-[28px] font-extrabold text-[#0F172A] mt-1 tracking-tight tabular-nums">
              Rs. {state.financials.todayPurchases.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#64748B] mt-1 flex items-center justify-between">
              <span>Purchase Orders</span>
              <span className="font-medium text-slate-700">{state.purchases.length} POs</span>
            </div>
          </div>
        </div>

        {/* Card 3: Customer Receivables */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
              LKR
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">Customer Receivables</span>
            <div className="text-[28px] font-extrabold text-[#0F172A] mt-1 tracking-tight tabular-nums">
              Rs. {state.financials.customerReceivables.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#64748B] mt-1 flex items-center justify-between">
              <span>Outstanding balance</span>
              <span className="font-semibold text-amber-700">{totalPendingInvoices} pending</span>
            </div>
          </div>
        </div>

        {/* Card 4: Customer Payables */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">request_quote</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
              LKR
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">Customer Payables</span>
            <div className="text-[28px] font-extrabold text-[#0F172A] mt-1 tracking-tight tabular-nums">
              Rs. {state.financials.supplierPayables.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#64748B] mt-1 flex items-center justify-between font-medium">
              <span>Outstanding payables</span>
              <span className="font-semibold text-slate-700">{totalSupplierAccounts} accounts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accounting & Financial Overview Section */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs transition-all hover:border-slate-300">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span>
            <span className="material-symbols-outlined text-[#3B82F6] text-[20px]">account_balance</span>
            <h2 className="text-[15px] font-bold text-[#0F172A] tracking-tight">Financial &amp; Accounting Overview (LKR)</h2>
          </div>
          <button
            onClick={() => onNavigate('25_accounting_overview')}
            className="text-xs font-bold text-[#3B82F6] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
          >
            <span>Full Accounting &amp; Ledgers</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">Cash in Hand</span>
            <div className="text-[17px] font-extrabold text-[#0F172A] tabular-nums mt-1">
              Rs. {state.financials.cashInHand.toLocaleString()}
            </div>
            <span className="text-[11px] text-[#64748B] mt-0.5 block">Drawer Float</span>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">Bank Balance</span>
            <div className="text-[17px] font-extrabold text-[#0F172A] tabular-nums mt-1">
              Rs. {state.financials.bankBalance.toLocaleString()}
            </div>
            <span className="text-[11px] text-[#64748B] mt-0.5 block">Bank Account</span>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">Customer Receivables</span>
            <div className="text-[17px] font-extrabold text-[#3B82F6] tabular-nums mt-1">
              Rs. {state.financials.customerReceivables.toLocaleString()}
            </div>
            <span className="text-[11px] text-[#3B82F6] mt-0.5 block">{totalPendingInvoices} pending invoices</span>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">Customer Payables</span>
            <div className="text-[17px] font-extrabold text-amber-600 tabular-nums mt-1">
              Rs. {state.financials.supplierPayables.toLocaleString()}
            </div>
            <span className="text-[11px] text-amber-700 mt-0.5 block">{totalSupplierAccounts} supplier accounts</span>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">Monthly Net Profit</span>
            <div className="text-[17px] font-extrabold text-emerald-600 tabular-nums mt-1">
              Rs. {state.financials.monthlyNetProfit.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-700 mt-0.5 block">Calculated</span>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">Monthly Expenses</span>
            <div className="text-[17px] font-extrabold text-[#0F172A] tabular-nums mt-1">
              Rs. {state.financials.monthlyExpenses.toLocaleString()}
            </div>
            <span className="text-[11px] text-[#64748B] mt-0.5 block">Total Expenses</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Sales & Purchase Activity Chart & Category Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales and Purchase Chart Card */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-bold text-[#0F172A] tracking-tight">Sales and Purchase</h2>
              <p className="text-xs text-[#64748B]">Real-time sales &amp; purchase order comparison for the last 7 months</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-[#64748B]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span>
                <span>Sales Volume</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]"></span>
                <span>Purchase Volume</span>
              </span>
            </div>
          </div>

          {hasAnyChartData ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-end justify-between gap-2 h-48 pt-6 px-2 border-b border-slate-100">
                {monthlyChartData.map((item, idx) => {
                  const salesHeight = Math.max(6, Math.round((item.sales / maxChartValue) * 140));
                  const purHeight = Math.max(6, Math.round((item.purchases / maxChartValue) * 140));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1 h-36">
                        {/* Sales Bar */}
                        <div
                          className="w-3.5 bg-[#3B82F6] rounded-t-md transition-all group-hover:brightness-110 relative"
                          style={{ height: `${salesHeight}px` }}
                          title={`Sales: Rs. ${item.sales.toLocaleString()}`}
                        ></div>
                        {/* Purchase Bar */}
                        <div
                          className="w-3.5 bg-[#CBD5E1] rounded-t-md transition-all group-hover:brightness-95 relative"
                          style={{ height: `${purHeight}px` }}
                          title={`Purchases: Rs. ${item.purchases.toLocaleString()}`}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-[#64748B] truncate max-w-[60px] text-center" title={item.label}>
                        {item.label.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
                <span>Last 7 Months Comparison</span>
                <span className="font-semibold text-slate-700">Peak: Rs. {maxChartValue.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#64748B] bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="material-symbols-outlined text-[32px] text-slate-400 block">bar_chart</span>
              <p className="font-semibold text-slate-700">No data yet</p>
              <p className="text-[11px]">As you record sales invoices and purchase orders, financial activity trends will be displayed here.</p>
            </div>
          )}
        </div>

        {/* Product Category Statistics */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-bold text-[#0F172A] tracking-tight">Product Statistic</h2>
              <p className="text-xs text-[#64748B]">Catalog overview by category</p>
            </div>
          </div>

          <div className="relative py-4 flex flex-col items-center justify-center">
            <div className="w-36 h-36 rounded-full border-[10px] border-blue-500 flex items-center justify-center shadow-inner">
              <div className="text-center">
                <span className="text-2xl font-black text-[#0F172A] tabular-nums block">{totalProductsSold}</span>
                <span className="text-[11px] font-semibold text-[#64748B] block">Total Items Sold</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            {categoryStats.length > 0 ? (
              categoryStats.map(cat => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    <span className="font-semibold text-[#0F172A]">{cat.name}</span>
                  </div>
                  <span className="font-bold text-[#0F172A] tabular-nums">{cat.count} product{cat.count > 1 ? 's' : ''}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-2">No product categories registered yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Sales Transactions & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Sales Table */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-bold text-[#0F172A] tracking-tight">Recent Transactions</h2>
              <p className="text-xs text-[#64748B]">Latest wholesale sales invoices &amp; settlements</p>
            </div>
            <button
              onClick={() => onNavigate('06_sales_management')}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer"
            >
              <span>View All Sales</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                  <th className="py-3 px-4 text-[11px] font-bold text-[#64748B] tracking-wider uppercase">Invoice No</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#64748B] tracking-wider uppercase">Customer</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#64748B] tracking-wider uppercase">Date</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#64748B] tracking-wider uppercase text-right">Amount (LKR)</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#64748B] tracking-wider uppercase text-center">Status</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#64748B] tracking-wider uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {state.recentSales.length > 0 ? (
                  state.recentSales.slice(0, 5).map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#0F172A] tabular-nums">
                        <button
                          onClick={() => setSelectedInvoiceForModal(sale.invoiceNo)}
                          className="hover:text-[#3B82F6] cursor-pointer text-left"
                        >
                          {sale.invoiceNo}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0F172A]">{sale.customerName}</div>
                        <div className="text-[11px] text-[#64748B]">{sale.customerType}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B]">{formatDate(sale.date)}</td>
                      <td className="py-3.5 px-4 font-extrabold text-[#0F172A] text-right tabular-nums">
                        Rs. {sale.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
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
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvoiceForModal(sale.invoiceNo)}
                          className="p-1 text-slate-400 hover:text-[#0F172A] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Print / View Invoice"
                        >
                          <span className="material-symbols-outlined text-[18px]">receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[#64748B]">
                      No recent sales transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Quick Operations */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="border-b pb-3 border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-[#0F172A]">Quick Operations</h2>
                <p className="text-xs text-[#64748B]">Wholesale daily workflows</p>
              </div>
              <span className="material-symbols-outlined text-[#3B82F6]">bolt</span>
            </div>

            <div className="flex flex-col gap-2.5 mt-4">
              <button
                onClick={() => onNavigate('07_create_sales_invoice')}
                className="w-full py-2.5 px-4 bg-[#3B82F6] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
                <span>Create Sales Invoice</span>
              </button>
              <button
                onClick={() => onNavigate('12_create_purchase')}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                <span>Record Purchase Order</span>
              </button>
              <button
                onClick={() => onNavigate('03_add_product')}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_box</span>
                <span>Register New Product</span>
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1">
            <span className="text-xs font-bold text-[#1D4ED8] block">Company Settings Quick Link</span>
            <p className="text-[11px] text-slate-600 leading-normal">
              Need to change the trade name displayed on invoices and reports?
            </p>
            <button
              onClick={() => onNavigate('36_company_settings')}
              className="text-xs font-bold text-[#3B82F6] hover:underline mt-1 inline-block cursor-pointer"
            >
              Open Company Profile →
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Details Print Preview Modal */}
      {selectedInvoiceForModal && activeInvoice && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3B82F6]">receipt_long</span>
                <h3 className="text-base font-bold text-[#0F172A]">Invoice {activeInvoice.invoiceNo}</h3>
              </div>
              <button
                onClick={() => setSelectedInvoiceForModal(null)}
                className="text-slate-400 hover:text-[#0F172A] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-[#0F172A]">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-[#64748B]">Issued By</span>
                <span className="font-bold">{companyName}</span>
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
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeInvoice.status === 'Paid'
                    ? 'bg-emerald-50 text-emerald-700'
                    : activeInvoice.status === 'Pending'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-rose-50 text-rose-700'
                }`}>
                  {activeInvoice.status}
                </span>
              </div>
              <div className="flex justify-between py-2 text-sm font-extrabold text-[#0F172A]">
                <span>Total Amount</span>
                <span className="tabular-nums">Rs. {activeInvoice.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedInvoiceForModal(null)}
                className="px-4 py-2 border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedInvoiceForModal(null);
                  onNavigate('08_invoice_details_print');
                }}
                className="px-4 py-2 bg-[#3B82F6] text-white rounded-xl text-xs font-bold hover:bg-[#1D4ED8] cursor-pointer inline-flex items-center gap-1.5"
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
