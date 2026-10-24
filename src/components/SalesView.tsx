import React, { useState } from 'react';
import { ERPStoreState, generateNextInvoiceNo, formatDate } from '../lib/erpStore';
import { SaleInvoice, ScreenId } from '../types/erp';

interface SalesViewProps {
  state: ERPStoreState;
  onNavigate: (screen: ScreenId) => void;
  onRecordSale: (invoice: SaleInvoice) => void;
  initialMode?: 'list' | 'create' | 'print';
}

export const SalesView: React.FC<SalesViewProps> = ({
  state,
  onNavigate,
  onRecordSale,
  initialMode = 'list'
}) => {
  const [mode, setMode] = useState<'list' | 'create' | 'print'>(initialMode);
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(state.recentSales[0] || null);

  // Create form state
  const [selectedCustomerId, setSelectedCustomerId] = useState(state.customers[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState(state.products[0]?.id || '');
  const [quantity, setQuantity] = useState(10);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProduct = state.products.find(p => p.id === selectedProductId) || state.products[0];
  const selectedCustomer = state.customers.find(c => c.id === selectedCustomerId) || state.customers[0];

  const subtotal = (selectedProduct?.sellingPrice || 0) * quantity;
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!selectedCustomer || !selectedProduct) {
      alert('Please add at least one customer and one product before creating an invoice.');
      return;
    }

    setIsSubmitting(true);
    try {
      const nextInvNo = generateNextInvoiceNo(state.recentSales);
      const newInv: SaleInvoice = {
        id: `inv-${Date.now()}`,
        invoiceNo: nextInvNo,
        customerId: selectedCustomerId || selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerType: selectedCustomer.accountType,
        date: new Date().toISOString(),
        totalAmount: total,
        paidAmount: total,
        status: 'Paid',
        itemsCount: quantity
      };

      await onRecordSale(newInv);
      setSelectedInvoice(newInv);
      setMode('print');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">Sales Management</h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">Wholesale invoices, point-of-sale billing, and receivables</p>
        </div>
        <div className="flex items-center gap-3">
          {mode !== 'list' && (
            <button
              onClick={() => setMode('list')}
              className="px-3.5 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] text-sm font-medium rounded-xl shadow-sm cursor-pointer"
            >
              Back to Sales List
            </button>
          )}
          {mode !== 'create' && (
            <button
              onClick={() => {
                if (state.customers.length === 0 || state.products.length === 0) {
                  alert('Please add at least one customer and product first.');
                  return;
                }
                setMode('create');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium rounded-xl shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Create Invoice</span>
            </button>
          )}
        </div>
      </div>

      {mode === 'list' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A]">Sales Invoices</h3>
            <span className="text-xs text-[#64748B]">{state.recentSales.length} Total Records</span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-[#64748B]">
                <th className="py-3 px-4">Invoice No.</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {state.recentSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#64748B] text-xs">
                    No sales invoices recorded yet.
                  </td>
                </tr>
              ) : (
                state.recentSales.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#0F172A] tabular-nums">{inv.invoiceNo}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#0F172A]">{inv.customerName}</div>
                      <div className="text-xs text-[#64748B]">{inv.customerType}</div>
                    </td>
                    <td className="py-3 px-4 text-[#64748B] text-xs">{formatDate(inv.date)}</td>
                    <td className="py-3 px-4 font-semibold text-right tabular-nums text-[#0F172A]">
                      Rs. {inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setMode('print');
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-[#2563EB] hover:bg-blue-50 rounded border border-blue-200 cursor-pointer inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">receipt</span>
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {mode === 'create' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm max-w-3xl mx-auto space-y-6">
          <div className="border-b pb-3 border-[#E2E8F0]">
            <h3 className="text-lg font-bold text-[#0F172A]">Create Wholesale Invoice</h3>
            <p className="text-xs text-[#64748B]">Issue official tax invoice to buyer</p>
          </div>
          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
                >
                  {state.customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.accountType})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Payment Method</label>
                <select className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]">
                  <option>Cash in Hand</option>
                  <option>Commercial Bank Transfer</option>
                  <option>Cheque (15 Days)</option>
                </select>
              </div>
            </div>

            <div className="border border-[#E2E8F0] rounded-lg p-4 bg-slate-50 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Invoice Line Items</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Product Item</label>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white text-[#0F172A]"
                  >
                    {state.products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - Rs. {p.sellingPrice} (Stock: {p.currentStock})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white text-[#0F172A]"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-xs text-[#64748B]">
                <span>Unit Price: Rs. {selectedProduct?.sellingPrice || 0}</span>
                <span>Subtotal: Rs. {subtotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-[#64748B]">
                <span>Subtotal:</span>
                <span className="tabular-nums">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Discount:</span>
                <span className="tabular-nums">Rs. {discountAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#0F172A] pt-2 border-t border-slate-200">
                <span>Total Payable:</span>
                <span className="text-[#2563EB] tabular-nums">Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
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
                className={`px-5 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] cursor-pointer transition-all ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Processing Invoice...' : 'Post Invoice & Print'}
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === 'print' && selectedInvoice && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex items-start justify-between border-b pb-4 border-[#E2E8F0]">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">{state.companySettings.name || 'Company Profile'}</h2>
              <p className="text-xs text-[#64748B]">{state.companySettings.tradeName || 'Wholesale Trading'}</p>
              <p className="text-xs text-[#64748B]">{state.companySettings.address || ''}</p>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                OFFICIAL INVOICE
              </span>
              <p className="text-xs font-mono font-bold mt-2 text-[#0F172A]">{selectedInvoice.invoiceNo}</p>
              <p className="text-[11px] text-[#64748B]">{formatDate(selectedInvoice.date)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="border p-3 rounded-lg border-slate-100 bg-slate-50/50">
              <span className="text-[#64748B] font-semibold uppercase">Billed To</span>
              <p className="font-bold text-[#0F172A] text-sm mt-1">{selectedInvoice.customerName}</p>
              <p className="text-[#64748B]">{selectedInvoice.customerType}</p>
            </div>
            <div className="border p-3 rounded-lg border-slate-100 bg-slate-50/50">
              <span className="text-[#64748B] font-semibold uppercase">Payment Details</span>
              <p className="font-medium text-[#0F172A] mt-1">Status: {selectedInvoice.status}</p>
              <p className="text-emerald-600 font-semibold">Settled in Full</p>
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-[#E2E8F0] text-[#64748B] uppercase">
              <tr>
                <th className="py-2">Item Description</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Total (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 font-medium">Wholesale Merchandise Order Batch</td>
                <td className="py-2.5 text-right">{selectedInvoice.itemsCount} units</td>
                <td className="py-2.5 text-right font-semibold tabular-nums">
                  Rs. {selectedInvoice.totalAmount.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="border-t border-[#E2E8F0] pt-4 flex justify-between items-center">
            <span className="text-xs text-[#64748B]">Authorized Signature: ___________________</span>
            <div className="text-right">
              <span className="text-xs text-[#64748B] block">Grand Total</span>
              <span className="text-xl font-bold text-[#0F172A] tabular-nums">
                Rs. {selectedInvoice.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setMode('list')}
              className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-xs font-medium hover:bg-slate-50 cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-xs font-semibold hover:bg-[#1D4ED8] cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print Invoice</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
