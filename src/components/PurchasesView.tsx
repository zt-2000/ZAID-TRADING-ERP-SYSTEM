import React, { useState } from 'react';
import { ERPStoreState, generateNextPoNo, formatDate } from '../lib/erpStore';
import { PurchaseOrder, PurchaseItem, ScreenId } from '../types/erp';

interface PurchasesViewProps {
  state: ERPStoreState;
  onNavigate: (screen: ScreenId) => void;
  onRecordPurchase: (po: PurchaseOrder) => void;
  onReceiveStock: (poId: string, receivedItems: PurchaseItem[]) => void;
  onPurchaseReturn: (poId: string, returnItems: PurchaseItem[], reason: string) => void;
  initialMode?: 'list' | 'create' | 'receive' | 'print' | 'return';
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  state,
  onNavigate,
  onRecordPurchase,
  onReceiveStock,
  onPurchaseReturn,
  initialMode = 'list'
}) => {
  const [mode, setMode] = useState<'list' | 'create' | 'receive' | 'print' | 'return'>(initialMode);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(state.purchases[0] || null);

  // Create PO form state
  const [supplierId, setSupplierId] = useState(state.suppliers[0]?.id || '');
  const [poStatus, setPoStatus] = useState<'Draft' | 'Ordered' | 'Received'>('Ordered');
  const [lineItems, setLineItems] = useState<Array<{ productId: string; quantity: number; unitCost: number }>>([
    { productId: state.products[0]?.id || '', quantity: 20, unitCost: state.products[0]?.costPrice || 100 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receive stock / GRN state
  const [grnPoId, setGrnPoId] = useState(state.purchases[0]?.id || '');
  const [grnReceivedQty, setGrnReceivedQty] = useState<{ [productId: string]: number }>({});

  // Purchase return state
  const [returnPoId, setReturnPoId] = useState(state.purchases[0]?.id || '');
  const [returnQty, setReturnQty] = useState<{ [productId: string]: number }>({});
  const [returnReason, setReturnReason] = useState('Defective Goods');

  const selectedSupplier = state.suppliers.find(s => s.id === supplierId) || state.suppliers[0];

  const subtotal = lineItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unitCost);
  }, 0);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { productId: state.products[0]?.id || '', quantity: 10, unitCost: 100 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!selectedSupplier || lineItems.length === 0) {
      alert('Please select a supplier and add at least one line item.');
      return;
    }

    setIsSubmitting(true);
    try {
      const nextPoNo = generateNextPoNo(state.purchases);
      const items: PurchaseItem[] = lineItems.map(li => {
        const prod = state.products.find(p => p.id === li.productId);
        return {
          productId: li.productId,
          productName: prod?.name || 'Wholesale Item',
          quantity: li.quantity,
          unitCost: li.unitCost
        };
      });

      const newPO: PurchaseOrder = {
        id: `po-${Date.now()}`,
        poNumber: nextPoNo,
        supplierId: supplierId || selectedSupplier.id,
        supplierName: selectedSupplier.name,
        date: new Date().toISOString(),
        totalAmount: subtotal,
        status: poStatus,
        items
      };

      await onRecordPurchase(newPO);
      setSelectedPO(newPO);
      setMode('print');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiveGRN = (e: React.FormEvent) => {
    e.preventDefault();
    const po = state.purchases.find(p => p.id === grnPoId);
    if (!po || !po.items) {
      alert('Selected purchase order has no line items.');
      return;
    }

    const receivedItems: PurchaseItem[] = po.items.map(item => ({
      ...item,
      quantity: grnReceivedQty[item.productId] ?? item.quantity
    }));

    onReceiveStock(po.id, receivedItems);
    setMode('list');
  };

  const handleProcessReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const po = state.purchases.find(p => p.id === returnPoId);
    if (!po || !po.items) {
      alert('Selected purchase order has no line items.');
      return;
    }

    const returnItems: PurchaseItem[] = po.items.map(item => ({
      ...item,
      quantity: returnQty[item.productId] ?? 0
    })).filter(i => i.quantity > 0);

    if (returnItems.length === 0) {
      alert('Please specify at least one item quantity to return.');
      return;
    }

    onPurchaseReturn(po.id, returnItems, returnReason);
    setMode('list');
  };

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">Purchases &amp; Procurement</h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">Supplier orders, good receipt notes (GRN), and purchase returns</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setMode('list')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${mode === 'list' ? 'bg-blue-50 text-[#2563EB] border-blue-200' : 'bg-white text-[#0F172A] border-[#E2E8F0]'}`}
          >
            Orders List
          </button>
          <button
            onClick={() => {
              if (state.suppliers.length === 0 || state.products.length === 0) {
                alert('Please add suppliers and products first.');
                return;
              }
              setMode('create');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${mode === 'create' ? 'bg-blue-50 text-[#2563EB] border-blue-200' : 'bg-white text-[#0F172A] border-[#E2E8F0]'}`}
          >
            Create Purchase
          </button>
          <button
            onClick={() => {
              if (state.purchases.length === 0) {
                alert('No purchase orders to receive stock against.');
                return;
              }
              setMode('receive');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${mode === 'receive' ? 'bg-blue-50 text-[#2563EB] border-blue-200' : 'bg-white text-[#0F172A] border-[#E2E8F0]'}`}
          >
            Receive Stock (GRN)
          </button>
          <button
            onClick={() => {
              if (state.purchases.length === 0) {
                alert('No purchase orders available for return.');
                return;
              }
              setMode('return');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${mode === 'return' ? 'bg-blue-50 text-[#2563EB] border-blue-200' : 'bg-white text-[#0F172A] border-[#E2E8F0]'}`}
          >
            Purchase Return
          </button>
        </div>
      </div>

      {mode === 'list' && (
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
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        po.status === 'Received' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        po.status === 'Ordered' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedPO(po);
                          setMode('print');
                        }}
                        className="px-2.5 py-1 text-xs text-[#2563EB] hover:bg-blue-50 border border-blue-200 rounded cursor-pointer inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">receipt</span>
                        <span>View</span>
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
            <h3 className="text-lg font-bold text-[#0F172A]">Create Purchase Order (Screen 12)</h3>
            <p className="text-xs text-[#64748B]">Procurement requisition with multiple line items &amp; vendor terms</p>
          </div>
          <form onSubmit={handleCreatePurchase} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Select Supplier *</label>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-[#0F172A]"
                >
                  {state.suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Order Status</label>
                <select
                  value={poStatus}
                  onChange={e => setPoStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-[#0F172A]"
                >
                  <option value="Ordered">Ordered</option>
                  <option value="Draft">Draft</option>
                  <option value="Received">Received (Immediate Stock)</option>
                </select>
              </div>
            </div>

            <div className="border border-[#E2E8F0] rounded-lg p-4 bg-slate-50 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Purchase Order Line Items</h4>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="px-2.5 py-1 text-xs bg-blue-50 text-[#2563EB] border border-blue-200 rounded font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>Add Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-3 rounded-lg border border-slate-200">
                    <div className="col-span-6">
                      <label className="block text-[10px] text-slate-500 mb-0.5">Product</label>
                      <select
                        value={item.productId}
                        onChange={e => {
                          const newItems = [...lineItems];
                          newItems[idx].productId = e.target.value;
                          const prod = state.products.find(p => p.id === e.target.value);
                          if (prod) newItems[idx].unitCost = prod.costPrice;
                          setLineItems(newItems);
                        }}
                        className="w-full px-2 py-1.5 border rounded text-xs text-[#0F172A]"
                      >
                        {state.products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (Cost: Rs. {p.costPrice})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-500 mb-0.5">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => {
                          const newItems = [...lineItems];
                          newItems[idx].quantity = parseInt(e.target.value, 10) || 1;
                          setLineItems(newItems);
                        }}
                        className="w-full px-2 py-1.5 border rounded text-xs text-[#0F172A]"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] text-slate-500 mb-0.5">Unit Cost (Rs.)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitCost}
                        onChange={e => {
                          const newItems = [...lineItems];
                          newItems[idx].unitCost = parseFloat(e.target.value) || 0;
                          setLineItems(newItems);
                        }}
                        className="w-full px-2 py-1.5 border rounded text-xs text-[#0F172A]"
                      />
                    </div>
                    <div className="col-span-1 pt-4 text-center">
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 flex justify-between items-center text-base font-bold text-[#0F172A]">
              <span>Total Bill Amount:</span>
              <span className="text-[#2563EB] tabular-nums">Rs. {subtotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setMode('list')}
                className="px-4 py-2 border rounded-lg text-sm text-[#0F172A] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] cursor-pointer"
              >
                {isSubmitting ? 'Saving Order...' : 'Post Purchase Order'}
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === 'receive' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="border-b pb-3 border-[#E2E8F0]">
            <h3 className="text-lg font-bold text-[#0F172A]">Receive Stock / Goods Receipt Note (GRN - Screen 14)</h3>
            <p className="text-xs text-[#64748B]">Verify received quantities and update warehouse inventory stock</p>
          </div>
          <form onSubmit={handleReceiveGRN} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Select Purchase Order</label>
              <select
                value={grnPoId}
                onChange={e => setGrnPoId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm text-[#0F172A]"
              >
                {state.purchases.map(po => (
                  <option key={po.id} value={po.id}>
                    {po.poNumber} - {po.supplierName} (Rs. {po.totalAmount.toLocaleString()}) [{po.status}]
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const currentPo = state.purchases.find(p => p.id === grnPoId);
              if (!currentPo || !currentPo.items || currentPo.items.length === 0) {
                return (
                  <div className="p-4 bg-slate-50 border rounded-lg text-xs text-slate-500 text-center">
                    This order has no line items recorded.
                  </div>
                );
              }
              return (
                <div className="space-y-3 border p-4 rounded-lg bg-slate-50">
                  <h4 className="text-xs font-bold uppercase text-[#64748B]">Order Line Items Verification</h4>
                  {currentPo.items.map(item => (
                    <div key={item.productId} className="flex items-center justify-between bg-white p-3 rounded border">
                      <div>
                        <span className="font-semibold text-sm text-[#0F172A]">{item.productName}</span>
                        <span className="text-xs text-slate-500 block">Ordered Qty: {item.quantity} units @ Rs. {item.unitCost}</span>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">Receive Qty</label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          defaultValue={item.quantity}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setGrnReceivedQty({ ...grnReceivedQty, [item.productId]: val });
                          }}
                          className="w-24 px-2 py-1 border rounded text-xs text-right"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setMode('list')}
                className="px-4 py-2 border rounded-lg text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] cursor-pointer"
              >
                Confirm Goods Receipt (GRN)
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === 'return' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="border-b pb-3 border-[#E2E8F0]">
            <h3 className="text-lg font-bold text-[#0F172A]">Purchase Return to Supplier (Screen 16)</h3>
            <p className="text-xs text-[#64748B]">Return damaged or excess stock and reduce supplier accounts payable</p>
          </div>
          <form onSubmit={handleProcessReturn} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Select Purchase Order</label>
              <select
                value={returnPoId}
                onChange={e => setReturnPoId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm text-[#0F172A]"
              >
                {state.purchases.map(po => (
                  <option key={po.id} value={po.id}>
                    {po.poNumber} - {po.supplierName} (Rs. {po.totalAmount.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const currentPo = state.purchases.find(p => p.id === returnPoId);
              if (!currentPo || !currentPo.items || currentPo.items.length === 0) {
                return (
                  <div className="p-4 bg-slate-50 border rounded-lg text-xs text-slate-500 text-center">
                    This order has no line items recorded.
                  </div>
                );
              }
              return (
                <div className="space-y-3 border p-4 rounded-lg bg-slate-50">
                  <h4 className="text-xs font-bold uppercase text-[#64748B]">Specify Return Quantities</h4>
                  {currentPo.items.map(item => (
                    <div key={item.productId} className="flex items-center justify-between bg-white p-3 rounded border">
                      <div>
                        <span className="font-semibold text-sm text-[#0F172A]">{item.productName}</span>
                        <span className="text-xs text-slate-500 block">Received: {item.quantity} units</span>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">Return Qty</label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          defaultValue={0}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setReturnQty({ ...returnQty, [item.productId]: val });
                          }}
                          className="w-24 px-2 py-1 border rounded text-xs text-right"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Reason for Return</label>
              <input
                type="text"
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm text-[#0F172A]"
                placeholder="e.g. Defective merchandise batch or expired stock"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setMode('list')}
                className="px-4 py-2 border rounded-lg text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 cursor-pointer"
              >
                Process Purchase Return
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === 'print' && selectedPO && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex items-start justify-between border-b pb-4 border-[#E2E8F0]">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">{state.companySettings.name || 'Company Profile'}</h2>
              <p className="text-xs text-[#64748B]">{state.companySettings.tradeName || 'Wholesale Procurement'}</p>
              <p className="text-xs text-[#64748B]">{state.companySettings.address || ''}</p>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full">
                PURCHASE ORDER (PO)
              </span>
              <p className="text-xs font-mono font-bold mt-2 text-[#0F172A]">{selectedPO.poNumber}</p>
              <p className="text-[11px] text-[#64748B]">{formatDate(selectedPO.date)}</p>
            </div>
          </div>

          <div className="border p-3 rounded-lg border-slate-100 bg-slate-50/50 text-xs">
            <span className="text-[#64748B] font-semibold uppercase">Vendor / Supplier</span>
            <p className="font-bold text-[#0F172A] text-sm mt-1">{selectedPO.supplierName}</p>
            <p className="text-[#64748B]">Status: <span className="font-semibold text-emerald-600">{selectedPO.status}</span></p>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-[#E2E8F0] text-[#64748B] uppercase">
              <tr>
                <th className="py-2">Item Description</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit Cost (Rs.)</th>
                <th className="py-2 text-right">Total (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {selectedPO.items && selectedPO.items.length > 0 ? (
                selectedPO.items.map(it => (
                  <tr key={it.productId}>
                    <td className="py-2.5 font-medium">{it.productName}</td>
                    <td className="py-2.5 text-right">{it.quantity}</td>
                    <td className="py-2.5 text-right tabular-nums">{it.unitCost.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">
                      {(it.quantity * it.unitCost).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-3 text-center text-slate-500">
                    Purchase Order Total Bill Batch
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="border-t border-[#E2E8F0] pt-4 flex justify-between items-center">
            <span className="text-xs text-[#64748B]">Authorized Procurement Signature: ___________________</span>
            <div className="text-right">
              <span className="text-xs text-[#64748B] block">Grand Total</span>
              <span className="text-xl font-bold text-[#0F172A] tabular-nums">
                Rs. {selectedPO.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setMode('list')}
              className="px-4 py-2 border rounded-lg text-xs font-medium hover:bg-slate-50 cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-xs font-semibold hover:bg-[#1D4ED8] cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print Order</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
