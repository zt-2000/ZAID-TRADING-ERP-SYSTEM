import React, { useState } from 'react';
import { ERPStoreState, generateNextPoNo, formatDate } from '../lib/erpStore';
import { PurchaseOrder, ScreenId } from '../types/erp';

interface PurchasesViewProps {
  state: ERPStoreState;
  onNavigate: (screen: ScreenId) => void;
  onRecordPurchase: (po: PurchaseOrder) => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({ state, onNavigate, onRecordPurchase }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(state.suppliers[0]?.id || '');
  const [amount, setAmount] = useState('');

  const selectedSupplier = state.suppliers.find(s => s.id === selectedSupplierId) || state.suppliers[0];

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || state.suppliers.length === 0) {
      alert('Please add at least one supplier first.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid bill amount.');
      return;
    }

    const nextPoNo = generateNextPoNo(state.purchases);
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: nextPoNo,
      supplierId: selectedSupplierId || selectedSupplier.id,
      supplierName: selectedSupplier.name,
      date: new Date().toISOString(),
      totalAmount: parsedAmount,
      status: 'Received'
    };
    onRecordPurchase(newPO);
    setAmount('');
    setShowCreate(false);
  };

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">Purchases & Procurement</h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">Supplier orders, good receipt notes (GRN), and vendor bills</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('14_receive_stock')}
            className="px-3.5 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] text-sm font-medium rounded-xl shadow-sm cursor-pointer"
          >
            Receive Stock / GRN
          </button>
          <button
            onClick={() => {
              if (state.suppliers.length === 0) {
                alert('Please add at least one supplier first.');
                return;
              }
              setShowCreate(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium rounded-xl shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0F172A]">Purchase Orders Log</h3>
          <span className="text-xs text-[#64748B]">{state.purchases.length} Records</span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-[#64748B]">
              <th className="py-3 px-4">PO Number</th>
              <th className="py-3 px-4">Supplier / Vendor</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Bill Amount</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-sm">
            {state.purchases.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#64748B] text-xs">
                  No purchase orders recorded yet.
                </td>
              </tr>
            ) : (
              state.purchases.map(po => (
                <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#0F172A] tabular-nums">{po.poNumber}</td>
                  <td className="py-3 px-4 font-medium text-[#0F172A]">{po.supplierName}</td>
                  <td className="py-3 px-4 text-[#64748B] text-xs">{formatDate(po.date)}</td>
                  <td className="py-3 px-4 font-semibold text-right tabular-nums text-[#0F172A]">
                    Rs. {po.totalAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {po.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigate('13_purchase_details_print')}
                      className="px-2.5 py-1 text-xs text-[#2563EB] hover:bg-blue-50 border border-blue-200 rounded cursor-pointer"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#0F172A]">Create Purchase Order</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-[#0F172A] cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreatePO} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Select Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-[#0F172A]"
                >
                  {state.suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Total Bill Amount (Rs.)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 75000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-[#0F172A]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border rounded-lg text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] cursor-pointer"
                >
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
