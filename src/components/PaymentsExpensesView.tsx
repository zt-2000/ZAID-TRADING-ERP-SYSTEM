import React, { useState } from 'react';
import { ERPStoreState, formatDate } from '../lib/erpStore';
import { ExpenseItem, ScreenId } from '../types/erp';

interface PaymentsExpensesViewProps {
  state: ERPStoreState;
  onNavigate: (screen: ScreenId) => void;
  onAddExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
  initialMode?: 'list' | 'create';
}

export const PaymentsExpensesView: React.FC<PaymentsExpensesViewProps> = ({
  state,
  onNavigate,
  onAddExpense,
  initialMode = 'list'
}) => {
  const [mode, setMode] = useState<'list' | 'create'>(initialMode);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Expense form state
  const [category, setCategory] = useState('Utilities');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidVia, setPaidVia] = useState<'Cash' | 'Bank'>('Bank');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['All', 'Utilities', 'Transport & Delivery', 'Staff Salaries', 'Warehouse Rent', 'Maintenance & Repairs', 'General'];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid expense amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      alert('Please enter a description for the expense.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddExpense({
        category,
        description: description.trim(),
        amount: parsedAmount,
        date: new Date().toISOString(),
        paidVia
      });
      setDescription('');
      setAmount('');
      setMode('list');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredExpenses = state.expenses.filter(e => {
    const matchesCat = selectedCategoryFilter === 'All' || e.category === selectedCategoryFilter;
    const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) || e.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalMonthlyExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCashExpenses = state.expenses.filter(e => e.paidVia === 'Cash').reduce((sum, e) => sum + e.amount, 0);
  const totalBankExpenses = state.expenses.filter(e => e.paidVia === 'Bank').reduce((sum, e) => sum + e.amount, 0);

  // Derive recent customer/supplier payments from sales and purchases if available
  const recentCustomerPayments = state.recentSales
    .filter(s => s.paidAmount > 0)
    .map(s => ({
      id: `pay-cust-${s.id}`,
      no: `PAY-${s.invoiceNo}`,
      party: s.customerName,
      type: 'Customer Receipt',
      amount: s.paidAmount,
      date: s.date,
      mode: 'Bank / Cash'
    }));

  const recentSupplierPayments = state.purchases
    .filter(p => p.status === 'Received')
    .map(p => ({
      id: `pay-supp-${p.id}`,
      no: `PAY-SUP-${p.id.slice(-6)}`,
      party: p.supplierName,
      type: 'Supplier Payment',
      amount: p.totalAmount,
      date: p.date,
      mode: 'Commercial Bank'
    }));

  const allPayments = [...recentCustomerPayments, ...recentSupplierPayments];

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto select-text">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">Payments &amp; Expenses</h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">Manage operational expenses, vendor settlements, and incoming customer payments</p>
        </div>
        <div className="flex items-center gap-3">
          {mode === 'create' ? (
            <button
              onClick={() => setMode('list')}
              className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] text-sm font-medium rounded-xl hover:bg-slate-50 shadow-sm cursor-pointer"
            >
              Back to Expenses List
            </button>
          ) : (
            <button
              onClick={() => setMode('create')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium rounded-xl shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Add Expense (Screen 24)</span>
            </button>
          )}
        </div>
      </div>

      {mode === 'list' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">TOTAL EXPENSES (MONTH)</span>
                <span className="text-[28px] text-[#0F172A] font-bold tabular-nums">Rs. {totalMonthlyExpenses.toLocaleString()}</span>
                <span className="text-[12px] text-[#64748B]">{state.expenses.length} recorded items</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100">
                <span className="material-symbols-outlined text-[24px]">payments</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">PAID BY CASH</span>
                <span className="text-[28px] text-[#0F172A] font-bold tabular-nums">Rs. {totalCashExpenses.toLocaleString()}</span>
                <span className="text-[12px] text-[#64748B]">Drawer &amp; petty cash float</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <span className="material-symbols-outlined text-[24px]">wallet</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">PAID BY BANK</span>
                <span className="text-[28px] text-[#0F172A] font-bold tabular-nums">Rs. {totalBankExpenses.toLocaleString()}</span>
                <span className="text-[12px] text-[#64748B]">Commercial bank account</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <span className="material-symbols-outlined text-[24px]">account_balance</span>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined text-[18px] text-[#64748B] absolute left-3 top-2.5">search</span>
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 cursor-pointer transition-colors ${
                    selectedCategoryFilter === cat
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A]">Operating Expenses Ledger</h3>
              <span className="text-xs text-[#64748B]">{filteredExpenses.length} Records</span>
            </div>
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-[#64748B]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Paid Via</th>
                  <th className="py-3 px-4 text-right">Amount (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500 text-xs">
                      No expenses recorded yet. Click "Add Expense" to record a new business expense.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-xs text-[#64748B]">{formatDate(exp.date)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#0F172A]">{exp.description}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          exp.paidVia === 'Cash' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {exp.paidVia}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums text-[#0F172A]">
                        Rs. {exp.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Recent Payments Section */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden mt-6">
            <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A]">Recent Customer &amp; Supplier Settlements</h3>
              <span className="text-xs text-[#64748B]">{allPayments.length} Transactions</span>
            </div>
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-[#64748B]">
                  <th className="py-3 px-4">Payment Ref</th>
                  <th className="py-3 px-4">Party Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {allPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                      No payment settlements recorded yet.
                    </td>
                  </tr>
                ) : (
                  allPayments.map(pay => (
                    <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">{pay.no}</td>
                      <td className="py-3 px-4 font-medium text-[#0F172A]">{pay.party}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          pay.type.includes('Customer') ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {pay.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#64748B]">{formatDate(pay.date)}</td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums text-[#0F172A]">
                        Rs. {pay.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mode === 'create' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="border-b pb-3 border-[#E2E8F0]">
            <h3 className="text-lg font-bold text-[#0F172A]">Record New Expense (Screen 24)</h3>
            <p className="text-xs text-[#64748B]">Log operating overhead, bills, or miscellaneous cash/bank payments</p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1">Expense Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] bg-white"
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1">Description *</label>
              <input
                type="text"
                required
                placeholder="e.g. Monthly Warehouse Electricity Bill (CEB)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1">Amount (LKR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="e.g. 24500"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1">Paid Via</label>
                <select
                  value={paidVia}
                  onChange={e => setPaidVia(e.target.value as 'Cash' | 'Bank')}
                  className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] bg-white"
                >
                  <option value="Bank">Commercial Bank Transfer</option>
                  <option value="Cash">Cash in Hand / Drawer</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setMode('list')}
                className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1D4ED8] cursor-pointer transition-all ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Saving Expense...' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
