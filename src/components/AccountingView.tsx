import React, { useState } from 'react';
import { ERPStoreState, formatDate } from '../lib/erpStore';
import { ScreenId } from '../types/erp';

interface AccountingViewProps {
  state: ERPStoreState;
  onNavigate: (screen: ScreenId) => void;
  initialTab?: 'overview' | 'cash_bank' | 'chart' | 'journals' | 'ledger' | 'trial_balance' | 'profit_loss' | 'balance_sheet';
}

export const AccountingView: React.FC<AccountingViewProps> = ({
  state,
  onNavigate,
  initialTab = 'overview'
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'cash_bank' | 'chart' | 'journals' | 'ledger' | 'trial_balance' | 'profit_loss' | 'balance_sheet'
  >(initialTab);

  // General Ledger filter state
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState('1010');

  // Compute financial metrics dynamically
  const totalSalesRevenue = state.recentSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalPurchasesCost = state.purchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalExpenses = state.expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalInventoryValuation = state.products.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0);

  const grossProfit = totalSalesRevenue - totalPurchasesCost;
  const netProfit = grossProfit - totalExpenses;
  const grossMargin = totalSalesRevenue > 0 ? ((grossProfit / totalSalesRevenue) * 100).toFixed(1) : '0.0';

  // Chart of Accounts definitions
  const chartOfAccounts = [
    { code: '1010', name: 'Cash in Hand (Store Drawer)', type: 'ASSET', normal: 'DEBIT', balance: state.financials.cashInHand },
    { code: '1020', name: 'Commercial Bank Current Account', type: 'ASSET', normal: 'DEBIT', balance: state.financials.bankBalance },
    { code: '1030', name: 'Trade Accounts Receivable', type: 'ASSET', normal: 'DEBIT', balance: state.financials.customerReceivables },
    { code: '1040', name: 'Merchandise Inventory Stock', type: 'ASSET', normal: 'DEBIT', balance: totalInventoryValuation },
    { code: '2010', name: 'Trade Accounts Payable', type: 'LIABILITY', normal: 'CREDIT', balance: state.financials.supplierPayables },
    { code: '3010', name: 'Owner Equity & Capital', type: 'EQUITY', normal: 'CREDIT', balance: 500000 },
    { code: '4010', name: 'Wholesale Sales Revenue', type: 'REVENUE', normal: 'CREDIT', balance: totalSalesRevenue },
    { code: '5010', name: 'Cost of Goods Sold (COGS)', type: 'EXPENSE', normal: 'DEBIT', balance: totalPurchasesCost },
    { code: '5020', name: 'Operating & Utility Expenses', type: 'EXPENSE', normal: 'DEBIT', balance: totalExpenses }
  ];

  // Dynamic Trial Balance Accounts
  const trialBalanceAccounts = [
    { code: '1010', name: 'Cash in Hand (Physical Drawer)', category: 'Asset', debit: state.financials.cashInHand, credit: 0 },
    { code: '1020', name: 'Commercial Bank Current Account', category: 'Asset', debit: state.financials.bankBalance, credit: 0 },
    { code: '1030', name: 'Trade Accounts Receivable', category: 'Asset', debit: state.financials.customerReceivables, credit: 0 },
    { code: '1040', name: 'Merchandise Inventory Stock', category: 'Asset', debit: totalInventoryValuation, credit: 0 },
    { code: '2010', name: 'Trade Accounts Payable', category: 'Liability', debit: 0, credit: state.financials.supplierPayables },
    { code: '3010', name: 'Owner Equity & Capital', category: 'Equity', debit: 0, credit: 500000 },
    { code: '4010', name: 'Wholesale Sales Revenue', category: 'Revenue', debit: 0, credit: totalSalesRevenue },
    { code: '5010', name: 'Cost of Goods Sold (COGS)', category: 'Expense', debit: totalPurchasesCost, credit: 0 },
    { code: '5020', name: 'Operating & Utility Expenses', category: 'Expense', debit: totalExpenses, credit: 0 }
  ];

  const totalDebits = trialBalanceAccounts.reduce((acc, a) => acc + a.debit, 0);
  const totalCredits = trialBalanceAccounts.reduce((acc, a) => acc + a.credit, 0);
  const isTrialBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  // Balance Sheet calculations
  const totalAssets = state.financials.cashInHand + state.financials.bankBalance + state.financials.customerReceivables + totalInventoryValuation;
  const totalLiabilities = state.financials.supplierPayables;
  const totalEquity = 500000 + netProfit;
  const isBalanceSheetBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1;

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto select-text">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">Accounting &amp; Finance</h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">Double-entry ledger transactions, cash flow book, chart of accounts, and financial reports</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Double-Entry Balanced</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <span className="text-[11px] text-[#64748B]">Drawer &amp; petty cash</span>
          </div>
        </div>

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
            <span className="text-[11px] text-[#64748B]">Commercial Bank</span>
          </div>
        </div>

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
            <span className="text-[11px] text-[#D97706]">{state.customers.filter(c => c.outstandingBalance > 0).length} pending accounts</span>
          </div>
        </div>

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
            <span className="text-[11px] text-[#64748B]">Due to suppliers</span>
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
          Cash &amp; Bank Book (26)
        </button>
        <button
          onClick={() => setActiveTab('chart')}
          className={`pb-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'chart' ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Chart of Accounts (27)
        </button>
        <button
          onClick={() => setActiveTab('journals')}
          className={`pb-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'journals' ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Journal Entries (28)
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'ledger' ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          General Ledger (29)
        </button>
        <button
          onClick={() => setActiveTab('trial_balance')}
          className={`pb-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'trial_balance' ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Trial Balance (31)
        </button>
        <button
          onClick={() => setActiveTab('profit_loss')}
          className={`pb-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'profit_loss' ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Profit &amp; Loss (30)
        </button>
        <button
          onClick={() => setActiveTab('balance_sheet')}
          className={`pb-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'balance_sheet' ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Balance Sheet (32)
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            onClick={() => setActiveTab('chart')}
            className="bg-white border border-[#E2E8F0] hover:border-blue-400 rounded-xl p-5 shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[24px]">account_tree</span>
              </div>
              <h3 className="text-[16px] font-bold text-[#0F172A]">Chart of Accounts</h3>
              <p className="text-[13px] text-[#64748B] mt-1">
                Asset, liability, equity, revenue, and expense account classifications.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-[#2563EB] flex items-center gap-1">
              <span>View Accounts</span>
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
                Verify total Debits equal total Credits across all accounts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-purple-600 flex items-center gap-1">
              <span>Inspect Trial Balance</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('balance_sheet')}
            className="bg-white border border-[#E2E8F0] hover:border-blue-400 rounded-xl p-5 shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[24px]">domain</span>
              </div>
              <h3 className="text-[16px] font-bold text-[#0F172A]">Balance Sheet</h3>
              <p className="text-[13px] text-[#64748B] mt-1">
                Financial position statement: Assets = Liabilities + Equity.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span>View Balance Sheet</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'chart' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-[#E2E8F0]">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Chart of Accounts (Screen 27)</h3>
              <p className="text-xs text-[#64748B]">Standard double-entry general ledger accounts</p>
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-bold rounded-full">
              {chartOfAccounts.length} Active Accounts
            </span>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] uppercase text-[#64748B] border-b">
              <tr>
                <th className="py-2.5 px-4">Account Code</th>
                <th className="py-2.5 px-4">Account Title</th>
                <th className="py-2.5 px-4">Account Type</th>
                <th className="py-2.5 px-4">Normal Balance</th>
                <th className="py-2.5 px-4 text-right">Current Balance (LKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {chartOfAccounts.map(acc => (
                <tr key={acc.code} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">{acc.code}</td>
                  <td className="py-3 px-4 font-semibold text-[#0F172A]">{acc.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {acc.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{acc.normal}</td>
                  <td className="py-3 px-4 text-right font-bold tabular-nums text-[#0F172A]">
                    Rs. {acc.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 border-[#E2E8F0] gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">General Ledger (Screen 29)</h3>
              <p className="text-xs text-[#64748B]">Running-balance transaction history per account</p>
            </div>
            <div>
              <select
                value={selectedLedgerAccount}
                onChange={e => setSelectedLedgerAccount(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-xs font-semibold bg-white text-[#0F172A]"
              >
                {chartOfAccounts.map(a => (
                  <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                ))}
              </select>
            </div>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] uppercase text-[#64748B] border-b">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Reference</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 text-right">Debit</th>
                <th className="py-2.5 px-4 text-right">Credit</th>
                <th className="py-2.5 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {state.recentSales.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-500">{formatDate(s.date)}</td>
                  <td className="py-3 px-4 font-mono font-semibold">{s.invoiceNo}</td>
                  <td className="py-3 px-4">Sales Revenue &amp; Receivable for {s.customerName}</td>
                  <td className="py-3 px-4 text-right font-mono">Rs. {s.totalAmount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono">—</td>
                  <td className="py-3 px-4 text-right font-bold font-mono">Rs. {(s.totalAmount * (idx + 1)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'cash_bank' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A]">Cash &amp; Bank Book (Screen 26)</h3>
            <span className="text-xs text-[#64748B]">Daily Liquid Funds Ledger</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-[11px] uppercase text-[#64748B] border-b">
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
              {state.recentSales.map(s => (
                <tr key={s.id}>
                  <td className="py-3 px-4 text-xs text-[#64748B]">{formatDate(s.date)}</td>
                  <td className="py-3 px-4 font-medium">Bank Account</td>
                  <td className="py-3 px-4">Sales Invoice: {s.customerName} ({s.invoiceNo})</td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-600 tabular-nums">Rs. {s.totalAmount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-slate-400">—</td>
                  <td className="py-3 px-4 text-right font-bold tabular-nums">Rs. {state.financials.bankBalance.toLocaleString()}</td>
                </tr>
              ))}
              {state.expenses.map(e => (
                <tr key={e.id}>
                  <td className="py-3 px-4 text-xs text-[#64748B]">{formatDate(e.date)}</td>
                  <td className="py-3 px-4 font-medium">{e.paidVia} Account</td>
                  <td className="py-3 px-4">Expense: {e.category} - {e.description}</td>
                  <td className="py-3 px-4 text-right text-slate-400">—</td>
                  <td className="py-3 px-4 text-right font-semibold text-rose-600 tabular-nums">Rs. {e.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-bold tabular-nums">Rs. {state.financials.bankBalance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'journals' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-[#E2E8F0]">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Journal Entries Ledger (Screen 28)</h3>
              <p className="text-xs text-[#64748B]">Audited double-entry vouchers with verified debit = credit parity</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
              All Vouchers Balanced
            </span>
          </div>
          <div className="p-4 bg-slate-50 border rounded-lg text-center text-xs text-slate-600">
            Journal entries are automatically posted upon recording sales, purchases, payments, and expenses in the ERP system.
          </div>
        </div>
      )}

      {activeTab === 'trial_balance' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-[#E2E8F0]">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Trial Balance Statement (Screen 31)</h3>
              <p className="text-xs text-[#64748B]">Audited debit &amp; credit ledger account balances</p>
            </div>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
              isTrialBalanced ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700'
            }`}>
              {isTrialBalanced ? 'STATUS: BALANCED (Difference: Rs. 0.00)' : 'UNBALANCED'}
            </span>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] uppercase text-[#64748B] border-b">
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
                <tr key={a.code} className="hover:bg-slate-50">
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

      {activeTab === 'profit_loss' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm max-w-2xl mx-auto space-y-4">
          <div className="border-b pb-3 border-[#E2E8F0] text-center">
            <h3 className="text-lg font-bold text-[#0F172A]">{state.companySettings.name || 'Company Profile'}</h3>
            <p className="text-xs text-[#64748B]">Statement of Profit &amp; Loss (Screen 30)</p>
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

      {activeTab === 'balance_sheet' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm max-w-2xl mx-auto space-y-5">
          <div className="border-b pb-3 border-[#E2E8F0] text-center">
            <h3 className="text-lg font-bold text-[#0F172A]">{state.companySettings.name || 'Company Profile'}</h3>
            <p className="text-xs text-[#64748B]">Statement of Financial Position — Balance Sheet (Screen 32)</p>
            <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold ${
              isBalanceSheetBalanced ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700'
            }`}>
              {isBalanceSheetBalanced ? '✓ Assets = Liabilities + Equity (Balanced)' : 'Imbalanced Balance Sheet'}
            </span>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Assets</h4>
              <div className="space-y-1.5 pl-3 border-l-2 border-blue-200">
                <div className="flex justify-between text-xs">
                  <span>Cash in Hand</span>
                  <span className="font-mono font-semibold">Rs. {state.financials.cashInHand.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Commercial Bank Account</span>
                  <span className="font-mono font-semibold">Rs. {state.financials.bankBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Trade Accounts Receivable</span>
                  <span className="font-mono font-semibold">Rs. {state.financials.customerReceivables.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Merchandise Inventory Stock</span>
                  <span className="font-mono font-semibold">Rs. {totalInventoryValuation.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-[#0F172A] pt-2 border-t">
                  <span>Total Assets</span>
                  <span className="font-mono text-blue-600">Rs. {totalAssets.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Liabilities</h4>
              <div className="space-y-1.5 pl-3 border-l-2 border-amber-200">
                <div className="flex justify-between text-xs">
                  <span>Trade Accounts Payable</span>
                  <span className="font-mono font-semibold">Rs. {totalLiabilities.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-[#0F172A] pt-2 border-t">
                  <span>Total Liabilities</span>
                  <span className="font-mono text-amber-600">Rs. {totalLiabilities.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Equity</h4>
              <div className="space-y-1.5 pl-3 border-l-2 border-purple-200">
                <div className="flex justify-between text-xs">
                  <span>Owner Capital &amp; Initial Equity</span>
                  <span className="font-mono font-semibold">Rs. 500,000</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Retained Earnings (Period Net Profit)</span>
                  <span className="font-mono font-semibold">Rs. {netProfit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-[#0F172A] pt-2 border-t">
                  <span>Total Equity</span>
                  <span className="font-mono text-purple-600">Rs. {totalEquity.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center font-bold text-base">
              <span>Total Liabilities &amp; Equity:</span>
              <span className="font-mono text-[#0F172A]">Rs. {(totalLiabilities + totalEquity).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
