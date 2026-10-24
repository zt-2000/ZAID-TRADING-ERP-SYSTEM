import React, { useState } from 'react';
import { ERPStoreState, formatDate } from '../lib/erpStore';
import { ScreenId } from '../types/erp';

interface ReportsViewProps {
  state: ERPStoreState;
  onNavigate: (screen: ScreenId) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ state, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'purchases' | 'stock' | 'ageing' | 'expenses'>('sales');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');

  // Date filtering helper
  const filterByDate = (dateStr?: string) => {
    if (!dateStr || dateRange === 'all') return true;
    try {
      const recordDate = new Date(dateStr);
      if (isNaN(recordDate.getTime())) return true; // handle text dates

      const now = new Date();
      if (dateRange === 'today') {
        return recordDate.toDateString() === now.toDateString();
      }
      if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return recordDate >= weekAgo;
      }
      if (dateRange === 'month') {
        return recordDate.getFullYear() === now.getFullYear() && recordDate.getMonth() === now.getMonth();
      }
    } catch {
      return true;
    }
    return true;
  };

  const filteredSales = state.recentSales.filter(s => filterByDate(s.date));
  const filteredPurchases = state.purchases.filter(p => filterByDate(p.date));
  const filteredExpenses = state.expenses.filter(e => filterByDate(e.date));

  // CSV Export utility
  const exportCSV = (filename: string, rows: Array<Record<string, any>>) => {
    if (rows.length === 0) {
      alert('No data available to export.');
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Sales Report computations
  const totalSalesAmount = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const paidSalesAmount = filteredSales.filter(s => s.status === 'Paid').reduce((sum, s) => sum + s.totalAmount, 0);
  const unpaidSalesAmount = totalSalesAmount - paidSalesAmount;

  // Top 5 customers by sales
  const customerSalesMap: Record<string, number> = {};
  filteredSales.forEach(s => {
    customerSalesMap[s.customerName] = (customerSalesMap[s.customerName] || 0) + s.totalAmount;
  });
  const topCustomers = Object.entries(customerSalesMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Sales by day
  const salesByDayMap: Record<string, number> = {};
  filteredSales.forEach(s => {
    const dayKey = s.date.split('T')[0] || 'Recent';
    salesByDayMap[dayKey] = (salesByDayMap[dayKey] || 0) + s.totalAmount;
  });
  const salesByDayArray = Object.entries(salesByDayMap).map(([date, amount]) => ({ date, amount }));
  const maxDaySales = Math.max(1, ...salesByDayArray.map(d => d.amount));

  // 2. Purchases Report computations
  const totalPurchasesAmount = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const supplierPurchasesMap: Record<string, number> = {};
  filteredPurchases.forEach(p => {
    supplierPurchasesMap[p.supplierName] = (supplierPurchasesMap[p.supplierName] || 0) + p.totalAmount;
  });
  const topSuppliers = Object.entries(supplierPurchasesMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  // 3. Stock Report computations
  const lowOrOutStockItems = state.products.filter(p => p.currentStock <= p.minStockAlert);
  const totalStockValuation = state.products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);

  // 4. Ageing Report computations
  const customerAgeing = state.customers.map(c => ({
    name: c.name,
    type: c.accountType,
    creditDays: c.creditDays,
    balance: c.outstandingBalance
  }));
  const supplierAgeing = state.suppliers.map(s => ({
    name: s.name,
    payable: s.outstandingPayable
  }));

  // 5. Expense Report computations
  const expenseCategoryMap: Record<string, number> = {};
  filteredExpenses.forEach(e => {
    expenseCategoryMap[e.category] = (expenseCategoryMap[e.category] || 0) + e.amount;
  });
  const expenseCategoriesArray = Object.entries(expenseCategoryMap).map(([category, amount]) => ({ category, amount }));
  const maxExpenseAmt = Math.max(1, ...expenseCategoriesArray.map(e => e.amount));

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto select-text">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">Reports &amp; Analytics</h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">Operational wholesale insights, sales trends, inventory valuations, and financial summaries</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-xl p-1 shadow-sm">
          {(['today', 'week', 'month', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                dateRange === range ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-4 overflow-x-auto">
        {[
          { id: 'sales', label: 'Sales Report', icon: 'point_of_sale' },
          { id: 'purchases', label: 'Purchases Report', icon: 'shopping_cart' },
          { id: 'stock', label: 'Stock & Valuation', icon: 'warehouse' },
          { id: 'ageing', label: 'Receivables & Payables', icon: 'balance' },
          { id: 'expenses', label: 'Expense Report', icon: 'payments' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === tab.id ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Sales Report */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#0F172A]">Sales Summary &amp; Performance</h3>
            <button
              onClick={() => exportCSV('sales_report', filteredSales.map(s => ({
                InvoiceNo: s.invoiceNo,
                Customer: s.customerName,
                Type: s.customerType,
                Date: s.date,
                Amount: s.totalAmount,
                Status: s.status
              })))}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Export CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Total Sales</span>
              <div className="text-[24px] font-bold text-[#0F172A] mt-1 tabular-nums">Rs. {totalSalesAmount.toLocaleString()}</div>
              <span className="text-xs text-[#64748B]">{filteredSales.length} invoices in range</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Paid Sales</span>
              <div className="text-[24px] font-bold text-emerald-600 mt-1 tabular-nums">Rs. {paidSalesAmount.toLocaleString()}</div>
              <span className="text-xs text-emerald-600 font-medium">Settled invoices</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Unpaid / Pending</span>
              <div className="text-[24px] font-bold text-amber-600 mt-1 tabular-nums">Rs. {unpaidSalesAmount.toLocaleString()}</div>
              <span className="text-xs text-amber-600 font-medium">Pending collection</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by Day chart */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-[#0F172A]">Sales Volume by Date</h4>
              {salesByDayArray.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {salesByDayArray.map(item => {
                    const widthPct = Math.max(6, Math.round((item.amount / maxDaySales) * 100));
                    return (
                      <div key={item.date} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-600">{item.date}</span>
                          <span className="tabular-nums text-[#0F172A]">Rs. {item.amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-[#2563EB] h-2.5 rounded-full" style={{ width: `${widthPct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center text-xs text-[#64748B]">No sales data available for this range.</div>
              )}
            </div>

            {/* Top 5 Customers */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-[#0F172A]">Top 5 Customers by Revenue</h4>
              {topCustomers.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[#64748B] uppercase">
                      <th className="py-2.5 px-3">Customer Name</th>
                      <th className="py-2.5 px-3 text-right">Total Purchases (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {topCustomers.map(c => (
                      <tr key={c.name} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-[#0F172A] font-semibold">{c.name}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-blue-600">Rs. {c.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-10 text-center text-xs text-[#64748B]">No customer data found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Purchases Report */}
      {activeTab === 'purchases' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#0F172A]">Purchases &amp; Supplier Procurement</h3>
            <button
              onClick={() => exportCSV('purchases_report', filteredPurchases.map(p => ({
                PONumber: p.poNumber,
                Supplier: p.supplierName,
                Date: p.date,
                Amount: p.totalAmount,
                Status: p.status
              })))}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm max-w-sm">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Total Purchases</span>
            <div className="text-[24px] font-bold text-[#0F172A] mt-1 tabular-nums">Rs. {totalPurchasesAmount.toLocaleString()}</div>
            <span className="text-xs text-[#64748B]">{filteredPurchases.length} POs recorded</span>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#0F172A]">Top Suppliers by Procurement Volume</h4>
            {topSuppliers.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-[#64748B] uppercase">
                    <th className="py-2.5 px-3">Supplier Name</th>
                    <th className="py-2.5 px-3 text-right">Total Order Amount (LKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {topSuppliers.map(s => (
                    <tr key={s.name} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-[#0F172A] font-semibold">{s.name}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-[#0F172A]">Rs. {s.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-10 text-center text-xs text-[#64748B]">No purchase orders recorded yet.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Stock Report */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#0F172A]">Inventory Valuation &amp; Stock Alerts</h3>
            <button
              onClick={() => exportCSV('stock_valuation_report', state.products.map(p => ({
                SKU: p.sku,
                Name: p.name,
                Category: p.category,
                CostPrice: p.costPrice,
                SellingPrice: p.sellingPrice,
                Stock: p.currentStock,
                Valuation: p.currentStock * p.costPrice,
                Status: p.status
              })))}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Export CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Total Stock Valuation</span>
              <div className="text-[24px] font-bold text-[#0F172A] mt-1 tabular-nums">Rs. {totalStockValuation.toLocaleString()}</div>
              <span className="text-xs text-[#64748B]">At wholesale cost price</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Catalog Products</span>
              <div className="text-[24px] font-bold text-[#0F172A] mt-1 tabular-nums">{state.products.length}</div>
              <span className="text-xs text-[#64748B]">Active SKU items</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
              <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">Low / Out of Stock</span>
              <div className="text-[24px] font-bold text-rose-600 mt-1 tabular-nums">{lowOrOutStockItems.length}</div>
              <span className="text-xs text-rose-600 font-medium">Requires replenishment</span>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#0F172A]">Low Stock &amp; Critical Alerts</h4>
            {lowOrOutStockItems.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-[#64748B] uppercase">
                    <th className="py-2.5 px-3">SKU &amp; Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Current Stock</th>
                    <th className="py-2.5 px-3 text-right">Min Threshold</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowOrOutStockItems.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#0F172A]">{p.name}</span>
                        <span className="text-xs text-slate-400 block font-mono">{p.sku}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{p.category}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600 tabular-nums">{p.currentStock} {p.unit}s</td>
                      <td className="py-2.5 px-3 text-right text-slate-500 tabular-nums">{p.minStockAlert} {p.unit}s</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {p.currentStock === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-10 text-center text-xs text-emerald-600 font-semibold">All inventory items are currently above reorder thresholds!</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Ageing Report */}
      {activeTab === 'ageing' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#0F172A]">Receivables &amp; Payables Ageing Summary</h3>
            <button
              onClick={() => exportCSV('ageing_report', [
                ...customerAgeing.map(c => ({ Type: 'Customer Receivable', Name: c.name, AccountType: c.type, CreditTerms: `${c.creditDays} Days`, Balance: c.balance })),
                ...supplierAgeing.map(s => ({ Type: 'Supplier Payable', Name: s.name, AccountType: 'Vendor', CreditTerms: 'Net 30', Balance: s.payable }))
              ])}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Export CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Receivables */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-[#0F172A]">Customer Accounts Receivable</h4>
              {customerAgeing.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[#64748B] uppercase">
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Terms</th>
                      <th className="py-2.5 px-3 text-right">Outstanding (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerAgeing.map(c => (
                      <tr key={c.name} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-[#0F172A]">{c.name}</td>
                        <td className="py-2.5 px-3 text-slate-500">{c.creditDays} Days</td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-700 tabular-nums">Rs. {c.balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-10 text-center text-xs text-[#64748B]">No customer accounts registered.</div>
              )}
            </div>

            {/* Supplier Payables */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-[#0F172A]">Supplier Accounts Payable</h4>
              {supplierAgeing.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[#64748B] uppercase">
                      <th className="py-2.5 px-3">Supplier Name</th>
                      <th className="py-2.5 px-3 text-right">Outstanding Payable (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierAgeing.map(s => (
                      <tr key={s.name} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-[#0F172A]">{s.name}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600 tabular-nums">Rs. {s.payable.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-10 text-center text-xs text-[#64748B]">No supplier accounts registered.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Expense Report */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#0F172A]">Operating Expense Breakdown</h3>
            <button
              onClick={() => exportCSV('expense_report', filteredExpenses.map(e => ({
                Date: e.date,
                Category: e.category,
                Description: e.description,
                PaidVia: e.paidVia,
                Amount: e.amount
              })))}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm max-w-sm">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Total Expenses</span>
            <div className="text-[24px] font-bold text-[#0F172A] mt-1 tabular-nums">
              Rs. {filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
            </div>
            <span className="text-xs text-[#64748B]">{filteredExpenses.length} expense transactions</span>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#0F172A]">Expenses by Category</h4>
            {expenseCategoriesArray.length > 0 ? (
              <div className="space-y-3 pt-2">
                {expenseCategoriesArray.map(item => {
                  const widthPct = Math.max(6, Math.round((item.amount / maxExpenseAmt) * 100));
                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">{item.category}</span>
                        <span className="tabular-nums text-[#0F172A]">Rs. {item.amount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${widthPct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-[#64748B]">No expense records found for this period.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
