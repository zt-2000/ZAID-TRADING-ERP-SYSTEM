import React, { useState } from 'react';
import { ERPStoreState, generateNextInvoiceNo, formatDate } from '../lib/erpStore';
import { SaleInvoice, ScreenId } from '../types/erp';

interface SalesViewProps {
  state: ERPStoreState;
  onNavigate: (screen: ScreenId) => void;
  onRecordSale: (invoice: SaleInvoice) => void;
  onRecordCustomerPayment: (paymentData: { customerId: string; invoiceId: string; amount: number; paymentMethod: string; reference: string }) => Promise<void>;
  onRecordSalesReturn: (returnData: { invoiceId: string; productId: string; quantity: number; reason: string; refundMethod: string }) => Promise<void>;
  initialMode?: 'list' | 'create' | 'print' | 'payment' | 'return';
}

export const SalesView: React.FC<SalesViewProps> = ({
  state,
  onNavigate,
  onRecordSale,
  onRecordCustomerPayment,
  onRecordSalesReturn,
  initialMode = 'list'
}) => {
  const [mode, setMode] = useState<'list' | 'create' | 'print' | 'payment' | 'return'>(initialMode);
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(state.recentSales[0] || null);

  // Create form state
  const [selectedCustomerId, setSelectedCustomerId] = useState(state.customers[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState(state.products[0]?.id || '');
  const [quantity, setQuantity] = useState(10);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment form state
  const [paymentCustomerId, setPaymentCustomerId] = useState(state.customers[0]?.id || '');
  const [paymentInvoiceId, setPaymentInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'Cheque'>('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Return form state
  const [returnInvoiceId, setReturnInvoiceId] = useState(state.recentSales[0]?.id || '');
  const [returnProductId, setReturnProductId] = useState(state.products[0]?.id || '');
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnReason, setReturnReason] = useState('Defective Item');
  const [returnRefundMethod, setReturnRefundMethod] = useState<'cash refund' | 'credit to customer account'>('credit to customer account');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const selectedProduct = state.products.find(p => p.id === selectedProductId) || state.products[0];
  const selectedCustomer = state.customers.find(c => c.id === selectedCustomerId) || state.customers[0];
  const selectedCustomerForPayment = state.customers.find(c => c.id === paymentCustomerId) || state.customers[0];
  const customerUnpaidInvoices = state.recentSales.filter(inv => inv.customerId === paymentCustomerId && inv.status !== 'Paid');

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

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingPayment) return;
    if (!selectedCustomerForPayment) {
      alert('Please select a customer.');
      return;
    }
    const maxBalance = selectedCustomerForPayment.outstandingBalance;
    if (paymentAmount <= 0) {
      alert('Payment amount must be greater than 0.');
      return;
    }
    if (maxBalance > 0 && paymentAmount > maxBalance) {
      alert(`Payment amount cannot exceed customer outstanding balance (Rs. ${maxBalance.toLocaleString()}).`);
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await onRecordCustomerPayment({
        customerId: paymentCustomerId,
        invoiceId: paymentInvoiceId,
        amount: paymentAmount,
        paymentMethod,
        reference: paymentReference
      });
      setMode('list');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleSaveReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingReturn) return;
    if (!returnInvoiceId || !returnProductId) {
      alert('Please select an invoice and a product.');
      return;
    }
    if (returnQuantity <= 0) {
      alert('Return quantity must be greater than 0.');
      return;
    }

    setIsSubmittingReturn(true);
    try {
      await onRecordSalesReturn({
        invoiceId: returnInvoiceId,
        productId: returnProductId,
        quantity: returnQuantity,
        reason: returnReason,
        refundMethod: returnRefundMethod
      });
      setMode('list');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">Sales Management</h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">Wholesale invoices, point-of-sale billing, customer payments, and returns</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setMode('list')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${mode === 'list' ? 'bg-blue-50 text-[#2563EB] border-blue-200' : 'bg-white text-[#0F172A] border-[#E2E8F0]'}`}
          >
            Sales List
          </button>
          <button
            onClick={() => {
              if (state.customers.length === 0 || state.products.length === 0) {
                alert('Please add at least one customer and product first.');
                return;
              }
              setMode('create');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${mode === 'create' ? 'bg-blue-50 text-[#2563EB] border-blue-200' : 'bg-white text-[#0F172A] border-[#E2E8F0]'}`}
          >
            Create Invoice
          </button>
          <button
            onClick={() => {
              if (state.customers.length === 0) {
                alert('Please add at least one customer first.');
                return;
              }
              setMode('payment');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${mode === 'payment' ? 'bg-blue-50 text-[#2563EB] border-blue-200' : 'bg-white text-[#0F172A] border-[#E2E8F0]'}`}
          >
            Record Payment
          </button>
          <button
            onClick={() => {
              if (state.recentSales.length === 0 || state.products.length === 0) {
                alert('Please ensure there are recorded sales and products first.');
                return;
              }
              setMode('return');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${mode === 'return' ? 'bg-blue-50 text-[#2563EB] border-blue-200' : 'bg-white text-[#0F172A] border-[#E2E8F0]'}`}
          >
            Sales Return
          </button>
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

      {mode === 'payment' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="border-b pb-3 border-[#E2E8F0]">
            <h3 className="text-lg font-bold text-[#0F172A]">Record Customer Payment</h3>
            <p className="text-xs text-[#64748B]">Receive payment against customer receivables & outstanding balances</p>
          </div>
          <form onSubmit={handleSavePayment} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Select Customer</label>
              <select
                value={paymentCustomerId}
                onChange={e => setPaymentCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
              >
                {state.customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Outstanding: Rs. {c.outstandingBalance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-500 block">Current Outstanding Balance</span>
                <span className="text-base font-bold text-[#0F172A]">
                  Rs. {selectedCustomerForPayment?.outstandingBalance.toLocaleString() || 0}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Account Type</span>
                <span className="font-semibold text-blue-600">{selectedCustomerForPayment?.accountType}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Payment Amount (Rs.)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
                >
                  <option value="Cash">Cash in Hand</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="Cheque">Post-Dated Cheque</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Allocate to Specific Invoice (Optional)</label>
              <select
                value={paymentInvoiceId}
                onChange={e => setPaymentInvoiceId(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
              >
                <option value="">Apply to Oldest Unpaid Invoice Automatically</option>
                {customerUnpaidInvoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNo} - Rs. {inv.totalAmount.toLocaleString()} ({inv.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Reference / Receipt Number</label>
              <input
                type="text"
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
                placeholder="e.g. REC-9921 or Cheque #4421"
              />
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
                disabled={isSubmittingPayment}
                className="px-5 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] cursor-pointer transition-all"
              >
                {isSubmittingPayment ? 'Recording Payment...' : 'Save Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === 'return' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="border-b pb-3 border-[#E2E8F0]">
            <h3 className="text-lg font-bold text-[#0F172A]">Sales Return & Credit Note</h3>
            <p className="text-xs text-[#64748B]">Process returned merchandise, adjust inventory stock, and issue credit</p>
          </div>
          <form onSubmit={handleSaveReturn} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Select Invoice</label>
              <select
                value={returnInvoiceId}
                onChange={e => setReturnInvoiceId(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
              >
                {state.recentSales.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNo} - {inv.customerName} (Rs. {inv.totalAmount.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Select Product to Return</label>
              <select
                value={returnProductId}
                onChange={e => setReturnProductId(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
              >
                {state.products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (SKU: {p.sku} - Stock: {p.currentStock})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Return Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={returnQuantity}
                  onChange={e => setReturnQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Refund / Settlement Method</label>
                <select
                  value={returnRefundMethod}
                  onChange={e => setReturnRefundMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
                >
                  <option value="credit">Credit to Customer Account</option>
                  <option value="cash refund">Cash Refund</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Reason for Return</label>
              <select
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
              >
                <option value="Defective Item">Defective Item</option>
                <option value="Wrong Product Delivered">Wrong Product Delivered</option>
                <option value="Customer Order Cancelled">Customer Order Cancelled</option>
                <option value="Damaged in Transit">Damaged in Transit</option>
              </select>
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
                disabled={isSubmittingReturn}
                className="px-5 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] cursor-pointer transition-all"
              >
                {isSubmittingReturn ? 'Processing Return...' : 'Process Sales Return'}
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
