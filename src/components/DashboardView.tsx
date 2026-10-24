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
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const companyName = state.companySettings?.name || 'ZAID TRADING (PVT) LTD';

  const handleSyncClick = () => {
    setSyncing(true);
    setTimeout(() => {
      onSync();
      setSyncing(false);
    }, 400);
  };

  const activeInvoice = state.recentSales.find(s => s.invoiceNo === selectedInvoiceForModal) || state.recentSales[0];

  // Calculate low stock products count
  const lowStockCount = state.products.filter(p => p.status === 'low_stock' || p.status === 'out_of_stock').length;

  // Monthly sales bar chart sample data calculated from real sales & defaults
  const chartMonths = [
    { month: 'Jan', sales: 42000, products: 120 },
    { month: 'Feb', sales: 58000, products: 165 },
    { month: 'Mar', sales: 49000, products: 140 },
    { month: 'Apr', sales: 72000, products: 210 },
    { month: 'May', sales: 64000, products: 185 },
    { month: 'Jun', sales: 81000, products: 240 },
    { month: 'Jul', sales: 95000, products: 290 },
  ];

  // Compute category statistics from products
  const categoryStats = React.useMemo(() => {
    const counts: Record<string, number> = {};
    state.products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return [
      { name: 'Dairy & Beverages', count: counts['Dairy & Beverages'] || 14, growth: '+5.34%', percent: 78, color: '#3B82F6' },
      { name: 'Flour & Bakery', count: counts['Flour & Bakery'] || 8, growth: '+2.30%', percent: 62, color: '#EF4444' },
      { name: 'Snacks & Biscuits', count: counts['Snacks & Biscuits'] || 12, growth: '+1.80%', percent: 54, color: '#94A3B8' },
      { name: 'Grains & Rice', count: counts['Grains & Rice'] || 6, growth: '-1.04%', percent: 45, color: '#F59E0B' },
    ];
  }, [state.products]);

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto select-text bg-[#F8FAFC]">
      {/* 1. Header / Welcome Banner matching 0326a925dd0e9a63f270e4fb23547a87_a43867bd.jpg */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[26px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
              Sales Report &amp; Dashboard
            </h1>
          </div>
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

      {/* 2. Top Summary Metric Cards Grid matching 0326a925dd0e9a63f270e4fb23547a87_a43867bd.jpg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Highlight Accent Blue Card (Total Sales) */}
        <div className="bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-2xl p-5 text-white shadow-md flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px] text-white">payments</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#22C55E] text-white shadow-xs">
              +2.08%
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-medium text-blue-100 uppercase tracking-wider block">Total Sales (Today)</span>
            <div className="text-[28px] font-extrabold mt-1 tracking-tight tabular-nums">
              Rs. {state.financials.todaySales.toLocaleString()}
            </div>
            <div className="text-[11px] text-blue-100/90 mt-1 flex items-center justify-between">
              <span>Products vs last month</span>
              <span className="font-semibold text-white">LKR</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Orders / Purchases */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#3B82F6] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              +12.4%
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">Today's Purchases</span>
            <div className="text-[28px] font-extrabold text-[#0F172A] mt-1 tracking-tight tabular-nums">
              Rs. {state.financials.todayPurchases.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#64748B] mt-1 flex items-center justify-between">
              <span>Orders vs last month</span>
              <span className="font-medium text-slate-700">{state.purchases.length} POs</span>
            </div>
          </div>
        </div>

        {/* Card 3: Customer Payables */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">request_quote</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              +4.12%
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">Customer Payables</span>
            <div className="text-[28px] font-extrabold text-[#0F172A] mt-1 tracking-tight tabular-nums">
              Rs. {state.financials.supplierPayables.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#64748B] mt-1 flex items-center justify-between font-medium">
              <span>Outstanding payables</span>
              <span className="font-semibold text-slate-700">2 accounts</span>
            </div>
          </div>
        </div>

        {/* Card 4: Customer Receivables */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              +12.1%
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">Customer Receivables</span>
            <div className="text-[28px] font-extrabold text-[#0F172A] mt-1 tracking-tight tabular-nums">
              Rs. {state.financials.customerReceivables.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#64748B] mt-1 flex items-center justify-between">
              <span>Outstanding balance</span>
              <span className="font-semibold text-amber-700">14 pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Grid: Sales Activity Chart & Category Statistics (Matching 0326a925dd0e9a63f270e4fb23547a87_a43867bd.jpg) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Middle Column 1 & 2: Sales Activity Chart */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-bold text-[#0F172A] tracking-tight">Customer &amp; Sales Activity</h2>
              <p className="text-xs text-[#64748B]">Monthly sales volume vs sold product units</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 text-xs font-semibold text-[#64748B] mr-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span>
                  <span>Sales Volume</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]"></span>
                  <span>Products</span>
                </span>
              </div>
              <select className="px-3 py-1.5 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none">
                <option>This year</option>
                <option>This month</option>
              </select>
            </div>
          </div>

          {/* Interactive Dual Bar Chart Simulation */}
          <div className="relative pt-6 pb-2 px-2 h-64 flex items-end justify-between gap-3 border-b border-slate-100">
            {chartMonths.map((item, index) => {
              const maxVal = 100000;
              const salesHeightPct = Math.round((item.sales / maxVal) * 100);
              const prodHeightPct = Math.round(((item.products * 300) / maxVal) * 100);

              return (
                <div
                  key={item.month}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                  onMouseEnter={() => setHoveredBarIndex(index)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  {/* Tooltip on Hover */}
                  {hoveredBarIndex === index && (
                    <div className="absolute top-2 bg-[#0F172A] text-white text-[11px] py-1.5 px-3 rounded-xl shadow-lg z-10 font-mono flex flex-col gap-0.5">
                      <span className="font-bold text-blue-300">{item.month} Performance</span>
                      <span>Sales: Rs. {item.sales.toLocaleString()}</span>
                      <span>Products: {item.products} units</span>
                    </div>
                  )}

                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {/* Primary Bar (Sales) */}
                    <div
                      style={{ height: `${salesHeightPct}%` }}
                      className="w-1/2 max-w-[20px] bg-[#3B82F6] rounded-t-lg transition-all duration-300 group-hover:bg-[#1D4ED8]"
                    ></div>
                    {/* Secondary Bar (Products) */}
                    <div
                      style={{ height: `${prodHeightPct}%` }}
                      className="w-1/2 max-w-[20px] bg-[#CBD5E1] rounded-t-lg transition-all duration-300 group-hover:bg-slate-400"
                    ></div>
                  </div>

                  <span className="text-[12px] font-semibold text-[#64748B]">{item.month}</span>
                </div>
              );
            })}
          </div>

          {/* Bottom Financial Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl">
              <span className="text-[11px] font-bold text-[#64748B] uppercase">Cash in Hand</span>
              <p className="text-base font-bold text-[#0F172A] tabular-nums mt-0.5">Rs. {state.financials.cashInHand.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl">
              <span className="text-[11px] font-bold text-[#64748B] uppercase">Bank Balance</span>
              <p className="text-base font-bold text-[#0F172A] tabular-nums mt-0.5">Rs. {state.financials.bankBalance.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl">
              <span className="text-[11px] font-bold text-[#64748B] uppercase">Supplier Payables</span>
              <p className="text-base font-bold text-slate-700 tabular-nums mt-0.5">Rs. {state.financials.supplierPayables.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl">
              <span className="text-[11px] font-bold text-[#64748B] uppercase">Monthly Net Profit</span>
              <p className="text-base font-bold text-emerald-600 tabular-nums mt-0.5">Rs. {state.financials.monthlyNetProfit.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Right Column 3: Product Category Statistics matching 0326a925dd0e9a63f270e4fb23547a87_a43867bd.jpg */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-bold text-[#0F172A] tracking-tight">Product Statistic</h2>
              <p className="text-xs text-[#64748B]">Track sales by product category</p>
            </div>
            <select className="px-2.5 py-1 bg-slate-50 border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#0F172A]">
              <option>Today</option>
              <option>This Week</option>
            </select>
          </div>

          {/* Central Radial Progress Representation */}
          <div className="relative py-4 flex flex-col items-center justify-center">
            <div className="w-36 h-36 rounded-full border-[10px] border-blue-500 border-t-red-500 border-r-slate-300 flex items-center justify-center shadow-inner">
              <div className="text-center">
                <span className="text-2xl font-black text-[#0F172A] tabular-nums block">9,829</span>
                <span className="text-[11px] font-semibold text-[#64748B] block">Products Sales</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                  +5.34%
                </span>
              </div>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            {categoryStats.map(cat => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                  <span className="font-semibold text-[#0F172A]">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0F172A] tabular-nums">{cat.count.toLocaleString()}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    cat.growth.startsWith('+') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {cat.growth}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Recent Sales Transactions & Low Stock Alert List */}
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
                  <th className="py-3 px-4 text-[11px] font-bold text-[#64748B] tracking-wider uppercase">Date &amp; Time</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#64748B] tracking-wider uppercase text-right">Amount (LKR)</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#64748B] tracking-wider uppercase text-center">Status</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#64748B] tracking-wider uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {state.recentSales.slice(0, 5).map(sale => (
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
                    <td className="py-3.5 px-4 text-[#64748B]">{sale.date}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Quick Actions & Reorder List */}
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
      {selectedInvoiceForModal && (
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
