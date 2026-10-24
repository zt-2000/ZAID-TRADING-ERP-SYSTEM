import React, { useState } from 'react';
import { ERPStoreState } from '../lib/erpStore';
import { Supplier, ScreenId } from '../types/erp';

interface SuppliersViewProps {
  state: ERPStoreState;
  onNavigate: (screen: ScreenId) => void;
  onAddSupplier: (supplier: Supplier) => void;
  onPaySupplier: (supplierId: string, amount: number) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  state,
  onNavigate,
  onAddSupplier,
  onPaySupplier
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showPayModal, setShowPayModal] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'Commercial Bank' | 'Cash in Hand'>('Commercial Bank');

  // Form states for Add Supplier
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const totalOutstanding = state.suppliers.reduce((acc, s) => acc + s.outstandingPayable, 0);

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newSupplier: Supplier = {
      id: `sup-${Date.now()}`,
      name,
      phone,
      email: email || '',
      address: address || 'Colombo, Sri Lanka',
      outstandingPayable: 0
    };

    onAddSupplier(newSupplier);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setShowAdd(false);
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal) return;
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) return;

    onPaySupplier(showPayModal.id, amt);
    setPayAmount('');
    setShowPayModal(null);
  };

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto select-text">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">Suppliers</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider bg-slate-100 text-[#2563EB] uppercase font-mono">
              AP &amp; PROCUREMENT LEDGER
            </span>
          </div>
          <p className="text-[14px] text-[#64748B]">
            Manage suppliers and outstanding payables across all procurement channels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('11_purchases_management')}
            className="inline-flex items-center gap-2 px-4 h-[38px] rounded-[10px] bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 text-sm font-medium shadow-sm cursor-pointer"
          >
            <span>View Purchase Orders</span>
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 h-[38px] rounded-[10px] bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-sm font-medium shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Suppliers */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">TOTAL SUPPLIERS</span>
              <span className="text-[32px] font-bold text-[#0F172A] mt-1.5 tabular-nums">{state.suppliers.length}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-[#E2E8F0] flex items-center justify-center text-[#2563EB]">
              <span className="material-symbols-outlined text-[20px]">local_shipping</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-[#64748B]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Active wholesale vendors</span>
          </div>
        </div>

        {/* Card 2: With Outstanding */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">WITH OUTSTANDING</span>
              <span className="text-[32px] font-bold text-[#D97706] mt-1.5 tabular-nums">
                {state.suppliers.filter(s => s.outstandingPayable > 0).length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-amber-700 font-medium">
            Pending bill settlements
          </div>
        </div>

        {/* Card 3: Total Payables */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">TOTAL OUTSTANDING (LKR)</span>
              <span className="text-[32px] font-bold text-[#0F172A] mt-1.5 tabular-nums">
                Rs. {totalOutstanding.toLocaleString()}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-[#DC2626]">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-[#64748B]">
            Payable via bank / cheque
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0F172A]">Registered Vendors</h3>
          <span className="text-xs text-[#64748B]">{state.suppliers.length} Records</span>
        </div>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-[#64748B]">
              <th className="py-3 px-4">Supplier Name</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Email (Optional)</th>
              <th className="py-3 px-4">Address</th>
              <th className="py-3 px-4 text-right">Outstanding Payable</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {state.suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#64748B] text-xs">
                  No supplier accounts registered yet.
                </td>
              </tr>
            ) : (
              state.suppliers.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#0F172A]">{s.name}</td>
                  <td className="py-3 px-4 text-xs font-mono">{s.phone}</td>
                  <td className="py-3 px-4 text-xs text-[#64748B]">{s.email || '—'}</td>
                  <td className="py-3 px-4 text-xs text-[#64748B]">{s.address}</td>
                  <td className="py-3 px-4 text-right font-bold tabular-nums text-slate-800">
                    Rs. {s.outstandingPayable.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedSupplier(s)}
                      className="px-2.5 py-1 text-xs text-[#2563EB] hover:bg-blue-50 border border-blue-200 rounded cursor-pointer"
                    >
                      Statement
                    </button>
                    {s.outstandingPayable > 0 && (
                      <button
                        onClick={() => {
                          setShowPayModal(s);
                          setPayAmount(String(s.outstandingPayable));
                        }}
                        className="px-2.5 py-1 text-xs bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded cursor-pointer"
                      >
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Supplier Statement Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[#E2E8F0]">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">{selectedSupplier.name}</h3>
                <p className="text-xs text-[#64748B]">Supplier Statement &amp; AP Ledger</p>
              </div>
              <button onClick={() => setSelectedSupplier(null)} className="text-slate-400 hover:text-[#0F172A] cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-[#64748B]">Contact Phone</span>
                <span>{selectedSupplier.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-[#64748B]">Email Address</span>
                <span>{selectedSupplier.email || 'Not specified'}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-[#64748B]">Registered Address</span>
                <span>{selectedSupplier.address}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-[#64748B]">Total Outstanding Payable</span>
                <span className="font-bold text-rose-600 text-sm tabular-nums">
                  Rs. {selectedSupplier.outstandingPayable.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedSupplier(null)}
                className="px-4 py-1.5 border rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const s = selectedSupplier;
                  setSelectedSupplier(null);
                  setShowPayModal(s);
                  setPayAmount(String(s.outstandingPayable));
                }}
                className="px-4 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-semibold hover:bg-[#1D4ED8] cursor-pointer"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#0F172A]">Record Supplier Payment</h3>
              <button onClick={() => setShowPayModal(null)} className="text-slate-400 hover:text-[#0F172A] cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleExecutePayment} className="space-y-4">
              <div className="text-xs text-[#64748B]">
                Paying vendor: <strong className="text-[#0F172A]">{showPayModal.name}</strong>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Payment Amount (LKR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-[#0F172A] font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Payment Mode</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-[#0F172A]"
                >
                  <option value="Commercial Bank">Commercial Bank Account</option>
                  <option value="Cash in Hand">Cash in Hand / Drawer</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowPayModal(null)}
                  className="px-4 py-2 border rounded-lg text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1D4ED8] cursor-pointer"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#0F172A]">Add Supplier</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-[#0F172A] cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Company / Vendor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maliban Biscuit Manufactories"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm text-[#0F172A]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+94 11 234 5678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="sales@vendor.lk"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm text-[#0F172A]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Warehouse / Factory Address</label>
                <input
                  type="text"
                  placeholder="e.g. 120 Galle Road, Ratmalana"
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
                  className="px-4 py-1.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1D4ED8] cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
