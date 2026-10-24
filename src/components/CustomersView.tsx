import React, { useState } from 'react';
import { ERPStoreState } from '../lib/erpStore';
import { Customer, ScreenId } from '../types/erp';

interface CustomersViewProps {
  state: ERPStoreState;
  onNavigate: (screen: ScreenId) => void;
  onAddCustomer: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ state, onNavigate, onAddCustomer }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<'Wholesale' | 'Retail' | 'Regular'>('Wholesale');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditDays, setCreditDays] = useState('30');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name,
      accountType,
      phone,
      email,
      address,
      outstandingBalance: 0,
      creditDays: parseInt(creditDays, 10) || 14
    };
    onAddCustomer(newCust);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setShowAdd(false);
  };

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">Customers Management</h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">Wholesale accounts, credit limits, and ledger balances</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium rounded-xl shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Add Customer (Screen 18)</span>
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0F172A]">Active Customer Directory (Screen 17)</h3>
          <span className="text-xs text-[#64748B]">{state.customers.length} Accounts Registered</span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-[#64748B]">
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Account Type</th>
              <th className="py-3 px-4">Phone / Contact</th>
              <th className="py-3 px-4">Credit Terms</th>
              <th className="py-3 px-4 text-right">Outstanding Balance</th>
              <th className="py-3 px-4 text-right">Statement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-sm">
            {state.customers.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-[#0F172A]">{c.name}</div>
                  <div className="text-xs text-[#64748B]">{c.address}</div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 text-[#2563EB] border border-blue-100">
                    {c.accountType}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs text-[#64748B]">
                  <div>{c.phone}</div>
                  <div>{c.email}</div>
                </td>
                <td className="py-3 px-4 text-xs font-medium text-slate-700">{c.creditDays} Days Net</td>
                <td className="py-3 px-4 text-right font-semibold tabular-nums text-[#D97706]">
                  Rs. {c.outstandingBalance.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => setSelectedCustomer(c)}
                    className="px-2.5 py-1 text-xs text-[#2563EB] hover:bg-blue-50 border border-blue-200 rounded cursor-pointer"
                  >
                    View Ledger (Screen 19)
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Statement Modal (Screen 19) */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[#E2E8F0]">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">{selectedCustomer.name}</h3>
                <p className="text-xs text-[#64748B]">Customer Statement (Screen 19)</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-[#0F172A] cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-[#64748B]">Credit Terms</span>
                <span className="font-semibold">{selectedCustomer.creditDays} Days</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-[#64748B]">Phone</span>
                <span>{selectedCustomer.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-[#64748B]">Current Outstanding</span>
                <span className="font-bold text-amber-700 tabular-nums">
                  Rs. {selectedCustomer.outstandingBalance.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 border rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => onNavigate('09_record_customer_payment')}
                className="px-4 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-semibold hover:bg-[#1D4ED8] cursor-pointer"
              >
                Record Payment (Screen 09)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal (Screen 18) */}
      {showAdd && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#0F172A]">Add Customer (Screen 18)</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-[#0F172A] cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Company / Customer Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Account Type</label>
                <select
                  value={accountType}
                  onChange={e => setAccountType(e.target.value as any)}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm text-[#0F172A]"
                >
                  <option value="Wholesale">Wholesale</option>
                  <option value="Regular">Regular</option>
                  <option value="Retail">Retail</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Credit Days</label>
                  <input
                    type="number"
                    value={creditDays}
                    onChange={e => setCreditDays(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm text-[#0F172A]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm text-[#0F172A]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-1.5 border rounded-lg text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] cursor-pointer"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
