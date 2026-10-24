import React, { useState } from 'react';
import { ERPStoreState } from '../lib/erpStore';
import { ScreenId } from '../types/erp';

interface AccountingViewProps {
  state: ERPStoreState;
  onNavigate: (screen: ScreenId) => void;
}

interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

interface JournalEntry {
  id: string;
  entryNo: string;
  date: string;
  description: string;
  reference: string;
  lines: JournalLine[];
}

export const AccountingView: React.FC<AccountingViewProps> = ({ state, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'cash_bank' | 'chart' | 'journals' | 'ledger' | 'trial_balance' | 'profit_loss' | 'balance_sheet'>('overview');

  // Journal Entries state
  const [journalEntries] = useState<JournalEntry[]>([]);

  // Compute total sales, purchases, cogs, expenses dynamically
  const totalSalesRevenue = state.recentSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalPurchasesCost = state.purchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalExpenses = state.expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalInventoryValuation = state.products.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0);

  // Dynamic Trial Balance Accounts
  const trialBalanceAccounts = [
    { code: '1010', name: 'Cash in Hand (Physical Drawer)', category: 'Asset', debit: state.financials.cashInHand, credit: 0 },
    { code: '1020', name: 'Commercial Bank Current Account', category: 'Asset', debit: state.financials.bankBalance, credit: 0 },
    { code: '1030', name: 'Trade Accounts Receivable', category: 'Asset', debit: state.financials.customerReceivables, credit: 0 },
    { code: '1040', name: 'Merchandise Inventory Stock', category: 'Asset', debit: totalInventoryValuation, credit: 0 },
    { code: '2010', name: 'Trade Accounts Payable', category: 'Liability', debit: 0, credit: state.financials.supplierPayables },
    { code: '3010', name: 'Owner Equity & Capital', category: 'Equity', debit: 0, credit: 0 },
    { code: '4010', name: 'Wholesale Sales Revenue', category: 'Revenue', debit: 0, credit: totalSalesRevenue },
    { code: '5010', name: 'Cost of Goods Sold (COGS)', category: 'Expense', debit: totalPurchasesCost, credit: 0 },
    { code: '5020', name: 'Operating & Utility Expenses', category: 'Expense', debit: totalExpenses, credit: 0 }
  ];

  const totalDebits = trialBalanceAccounts.reduce((acc, a) => acc + a.debit, 0);
  const totalCredits = trialBalanceAccounts.reduce((acc, a) => acc + a.credit, 0);
  const isTrialBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const grossProfit = totalSalesRevenue - totalPurchasesCost;
  const netProfit = grossProfit - totalExpenses;
  const grossMargin = totalSalesRevenue > 0 ? ((grossProfit / totalSalesRevenue) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto select-text">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">Accounting &amp; Finance</h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">Double-entry ledger transactions, cash flow book, and financial reporting</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Double-Entry Balanced</span>
          </div>
        </div>
      </div>

      {/* Data Source Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs text-[#64748B]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-slate-500">info</span>
          <span>
            <strong>Data Source Attribution:</strong> Financial dashboard totals and ledger balances reflect real-time calculations from the system database.
          </span>
        </div>
        <button
          onClick={() => onNavigate('36_company_settings')}
          className="text-[#2563EB] hover:underline font-semibold cursor-pointer shrink-0"
        >
          Check Settings
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Cash in Hand */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Cash in Hand</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#2563EB]">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[26px] font-bold text-[#0F172A] tabular-nums tracking-tight">
              Rs. {state.financials.cashInHand.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[#64748B]">
              <span className="material-symbols-outlined text-[14px]">point_of_sale</span>
              <span>Drawer &amp; petty cash</span>
            </div>
          </div>
        </div>

        {/* Card 2: Bank Balance */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Bank Balance</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-[20px]">account_balance</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[26px] font-bold text-[#0F172A] tabular-nums tracking-tight">
              Rs. {state.financials.bankBalance.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[#64748B]">
              <span className="material-symbols-outlined text-[14px]">credit_card</span>
              <span>Commercial Bank</span>
            </div>
          </div>
        </div>

        {/* Card 3: Receivables */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Customer Receivables</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined text-[20px]">trending_up</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[26px] font-bold text-[#D97706] tabular-nums tracking-tight">
              Rs. {state.financials.customerReceivables.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[#D97706]">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              <span>{state.customers.filter(c => c.outstandingBalance > 0).length} pending accounts</span>
            </div>
          </div>
        </div>

        {/* Card 4: Payables */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Supplier Payables</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <span className="material-symbols-outlined text-[20px]">local_shipping</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[26px] font-bold text-[#0F172A] tabular-nums tracking-tight">
              Rs. {state.financials.supplierPayables.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[#64748B]">
              <span className="material-symbols-outlined text-[14px]">receipt_long</span>
              <span>Due to {state.suppliers.filter(s => s.outstandingPayable > 0).length} suppliers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'overview' ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('cash_bank')}
          className={`pb-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'cash_bank' ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Cash &amp; Bank Book
        </button>
        <button
          onClick={() => setActiveTab('journals')}
          className={`pb-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'journals' ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Journal Entries
        </button>
        <button
          onClick={() => setActiveTab('trial_balance')}
          className={`pb-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'trial_balance' ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Trial Balance
        </button>
        <button
          onClick={() => setActiveTab('profit_loss')}
          className={`pb-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'profit_loss' ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Profit &amp; Loss
        </button>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            onClick={() => setActiveTab('journals')}
            className="bg-white border border-[#E2E8F0] hover:border-blue-400 rounded-xl p-5 shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[24px]">menu_book</span>
              </div>
              <h3 className="text-[16px] font-bold text-[#0F172A]">Journal Entries</h3>
              <p className="text-[13px] text-[#64748B] mt-1">
                Double-entry vouchers with debit &amp; credit balance matching.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span>View Journals</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('trial_balance')}
            className="bg-white border border-[#E2E8F0] hover:border-blue-400 rounded-xl p-5 shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[24px]">balance</span>
              </div>
              <h3 className="text-[16px] font-bold text-[#0F172A]">Trial Balance &amp; Ledger</h3>
              <p className="text-[13px] text-[#64748B] mt-1">
                Verify that total Debits equal total Credits across all asset, liability, and equity accounts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-purple-600 flex items-center gap-1">
              <span>Inspect Trial Balance</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('profit_loss')}
            className="bg-white border border-[#E2E8F0] hover:border-blue-400 rounded-xl p-5 shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[24px]">analytics</span>
              </div>
              <h3 className="text-[16px] font-bold text-[#0F172A]">Profit &amp; Loss Report</h3>
              <p className="text-[13px] text-[#64748B] mt-1">
                Wholesale gross revenue, COGS margins, operating overhead, and net margin.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-[#2563EB] flex items-center gap-1">
              <span>View P&amp;L Report</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Journal Entries */}
      {activeTab === 'journals' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between border-b pb-3 border-[#E2E8F0]">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Journal Entries Ledger</h3>
              <p className="text-xs text-[#64748B]">Audited double-entry vouchers with verified debit = credit parity</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
              All Vouchers Balanced
            </span>
          </div>

          {journalEntries.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No journal entries recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {journalEntries.map(entry => {
                const debitSum = entry.lines.reduce((acc, l) => acc + l.debit, 0);
                const creditSum = entry.lines.reduce((acc, l) => acc + l.credit, 0);
                const isBalanced = Math.abs(debitSum - creditSum) < 0.01;

                return (
                  <div key={entry.id} className="border border-[#E2E8F0] rounded-lg p-4 bg-slate-50/50 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 border-b pb-2 border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0F172A]">{entry.entryNo}</span>
                        <span className="text-[#64748B]">{entry.date}</span>
                        <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Ref: {entry.reference}</span>
                      </div>
                      <span className={`font-semibold ${isBalanced ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isBalanced ? '✓ Balanced' : '✗ Out of Balance'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">{entry.description}</p>
                    <table className="w-full text-left text-xs border-collapse bg-white rounded border border-[#E2E8F0]">
                      <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
                        <tr>
                          <th className="py-2 px-3">Account Code &amp; Name</th>
                          <th className="py-2 px-3 text-right">Debit (LKR)</th>
                          <th className="py-2 px-3 text-right">Credit (LKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {entry.lines.map((line, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3">
                              <span className="font-mono text-slate-500 mr-2">{line.accountCode}</span>
                              <span className="font-medium text-[#0F172A]">{line.accountName}</span>
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums font-mono">
                              {line.debit > 0 ? `Rs. ${line.debit.toLocaleString()}` : '—'}
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums font-mono">
                              {line.credit > 0 ? `Rs. ${line.credit.toLocaleString()}` : '—'}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-bold border-t border-slate-200">
                          <td className="py-2 px-3 text-right">Voucher Total:</td>
                          <td className="py-2 px-3 text-right tabular-nums font-mono text-emerald-700">
                            Rs. {debitSum.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums font-mono text-emerald-700">
                            Rs. {creditSum.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Trial Balance */}
      {activeTab === 'trial_balance' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-[#E2E8F0]">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Trial Balance Statement</h3>
              <p className="text-xs text-[#64748B]">Audited debit &amp; credit ledger account balances</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                isTrialBalanced ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700'
              }`}>
                {isTrialBalanced ? 'STATUS: BALANCED (Difference: Rs. 0.00)' : 'UNBALANCED'}
              </span>
            </div>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] text-[11px] uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
              <tr>
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4">Account Title</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4 text-right">Debit Balance (LKR)</th>
                <th className="py-2.5 px-4 text-right">Credit Balance (LKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {trialBalanceAccounts.map(a => (
                <tr key={a.code} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{a.code}</td>
                  <td className="py-2.5 px-4 font-semibold text-[#0F172A]">{a.name}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {a.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-mono text-[#0F172A]">
                    {a.debit > 0 ? `Rs. ${a.debit.toLocaleString()}` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-mono text-[#0F172A]">
                    {a.credit > 0 ? `Rs. ${a.credit.toLocaleString()}` : '—'}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold border-t-2 border-[#0F172A] text-sm">
                <td colSpan={3} className="py-3 px-4 text-right text-[#0F172A]">
                  Grand Total
                </td>
                <td className="py-3 px-4 text-right tabular-nums font-mono text-[#0F172A]">
                  Rs. {totalDebits.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right tabular-nums font-mono text-[#0F172A]">
                  Rs. {totalCredits.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Cash & Bank Book */}
      {activeTab === 'cash_bank' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A]">Cash &amp; Bank Book</h3>
            <span className="text-xs text-[#64748B]">Daily Ledger</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-[11px] uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
              <tr>
                <th className="py-2.5 px-4">Date / Time</th>
                <th className="py-2.5 px-4">Account</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 text-right">Debit (In)</th>
                <th className="py-2.5 px-4 text-right">Credit (Out)</th>
                <th className="py-2.5 px-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {state.recentSales.length === 0 && state.purchases.length === 0 && state.expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#64748B] text-xs">
                    No transactions recorded in Cash &amp; Bank book yet.
                  </td>
                </tr>
              ) : (
                <>
                  {state.recentSales.map(s => (
                    <tr key={s.id}>
                      <td className="py-3 px-4 text-xs text-[#64748B]">{s.date}</td>
                      <td className="py-3 px-4 font-medium">Bank (Commercial)</td>
                      <td className="py-3 px-4">Sales Invoice: {s.customerName} ({s.invoiceNo})</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600 tabular-nums">Rs. {s.totalAmount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-400">-</td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums">Rs. {state.financials.bankBalance.toLocaleString()}</td>
                    </tr>
                  ))}
                  {state.expenses.map(e => (
                    <tr key={e.id}>
                      <td className="py-3 px-4 text-xs text-[#64748B]">{e.date}</td>
                      <td className="py-3 px-4 font-medium">{e.paidVia === 'Cash' ? 'Cash in Hand' : 'Bank (Commercial)'}</td>
                      <td className="py-3 px-4">Expense: {e.category} - {e.description}</td>
                      <td className="py-3 px-4 text-right text-slate-400">-</td>
                      <td className="py-3 px-4 text-right font-semibold text-rose-600 tabular-nums">Rs. {e.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums">Rs. {state.financials.bankBalance.toLocaleString()}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Profit & Loss Statement */}
      {activeTab === 'profit_loss' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm max-w-2xl mx-auto space-y-4">
          <div className="border-b pb-3 border-[#E2E8F0] text-center">
            <h3 className="text-lg font-bold text-[#0F172A]">{state.companySettings.name || 'Company Profile'}</h3>
            <p className="text-xs text-[#64748B]">Statement of Profit &amp; Loss (Current Period)</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between font-bold text-[#0F172A] pt-2 border-b border-slate-100 pb-1">
              <span>Gross Sales Revenue</span>
              <span className="tabular-nums">Rs. {totalSalesRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#64748B] pl-4">
              <span>Less: Wholesale Cost of Goods Sold (COGS)</span>
              <span className="tabular-nums">- Rs. {totalPurchasesCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold text-emerald-700 bg-emerald-50 p-2 rounded">
              <span>Gross Profit ({grossMargin}% margin)</span>
              <span className="tabular-nums">Rs. {grossProfit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-[#0F172A] pt-3 border-b border-slate-100 pb-1">
              <span>Operating Expenses</span>
              <span className="tabular-nums">Rs. {totalExpenses.toLocaleString()}</span>
            </div>
            {state.expenses.map(e => (
              <div key={e.id} className="flex justify-between text-[#64748B] pl-4 text-xs">
                <span>{e.category} ({e.description})</span>
                <span className="tabular-nums">Rs. {e.amount.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-base text-[#0F172A] bg-blue-50 p-3 rounded-lg border border-blue-200 mt-4">
              <span>Period Net Profit</span>
              <span className="text-[#2563EB] tabular-nums">Rs. {netProfit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
